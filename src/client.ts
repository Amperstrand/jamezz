import { asTransportError, JamezzError } from "./error.js";
import { fetchJson, JAMEZZ_ORIGIN, sessionHeaders } from "./http.js";
import { menuFromPayload, type RawMenuPayload, type RawSalesarea } from "./menu.js";
import { draftFromLines, ORDER_ENDPOINT, prepareOrder } from "./order.js";
import { tableMid, type CartLine, type Fulfillment, type Menu, type PaymentHandoff, type PreparedOrder, type TableMid, type Venue } from "./types.js";
import { knownTable, KNOWN_TABLES } from "./venues.js";

export { KNOWN_TABLES };

export interface ClientOptions {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => Date;
}

interface OrderResponse {
  readonly data?: {
    readonly id?: number | string;
    readonly paymentUrl?: string;
    readonly checkoutUrl?: string;
    readonly redirectUrl?: string;
  };
  readonly id?: number | string;
  readonly paymentUrl?: string;
}

function checkoutUrl(payload: OrderResponse): string | null {
  return (
    payload.data?.paymentUrl ??
    payload.data?.checkoutUrl ??
    payload.data?.redirectUrl ??
    payload.paymentUrl ??
    null
  );
}

function network(context: string, failure: { readonly body: string }): JamezzError {
  return new JamezzError("network", `${context}: ${failure.body}`);
}

export class JamezzClient {
  private readonly sessions = new Map<string, string>();

  constructor(private readonly options: ClientOptions = {}) {}

  async venue(table: TableMid): Promise<Venue | null> {
    const result = await fetchJson<RawSalesarea>(this.salesareaUrl(table), {
      headers: sessionHeaders(table, null),
      signal: AbortSignal.timeout(20_000),
    }, this.options.fetchImpl);
    if (!result.ok) {
      if (result.kind === "network") throw network("venue fetch failed", result);
      return null;
    }
    const salesarea = result.value.data?.salesarea;
    if (salesarea?.systeemNaam === undefined) return null;
    const known = knownTable(table);
    return {
      id: table,
      name: salesarea.systeemNaam.trim(),
      currency: salesarea.valuta ?? "EUR",
      payProvider: salesarea.payProvider ?? "MOLLIE",
      orderingEnabled: (salesarea.systemOnline ?? 1) === 1,
      website: `https://jamezz.app/dl/${table}`,
      ...(known === undefined ? {} : { address: known.address }),
    };
  }

  async menu(table: TableMid): Promise<Menu | null> {
    const sales = await this.fetchSalesarea(table);
    const hadSession = this.sessions.has(table);
    let menu = await this.fetchMenu(table, await this.session(table), sales);
    if (menu === null && hadSession) {
      // data-fetch-v2 is a session delta: a cached session that already got
      // its snapshot serves []. One fresh bootstrap + retry resolves it.
      menu = await this.fetchMenu(table, await this.session(table, true), sales);
    }
    return menu;
  }

  async openCart(table: TableMid): Promise<string | null> {
    const body = new FormData();
    body.set("session_mid", table);
    body.set("session_return_path", `${JAMEZZ_ORIGIN}/v5/qr/${table}/return`);
    const result = await fetchJson<{ readonly uuid?: string }>(`${JAMEZZ_ORIGIN}/v5_2/shopping-cart`, {
      method: "POST",
      headers: sessionHeaders(table, null),
      body,
      signal: AbortSignal.timeout(20_000),
    }, this.options.fetchImpl);
    if (!result.ok) {
      if (result.kind === "network") throw network("cart open failed", result);
      return null;
    }
    return result.value.uuid ?? null;
  }

  prepare(input: {
    readonly table: TableMid;
    readonly lines: readonly CartLine[];
    readonly fulfillment: Fulfillment;
    readonly email: string;
    readonly cartUuid: string;
    readonly currency: string;
  }): PreparedOrder {
    return prepareOrder(draftFromLines(input), input.currency);
  }

  /**
   * Posts the prepared order and returns the hosted card page handoff.
   * Do not enter a card number in this client. A person opens checkoutUrl.
   * The session cookie is taken from the client's own bootstrap unless one
   * is passed explicitly.
   */
  async submit(prepared: PreparedOrder, cookie?: string): Promise<PaymentHandoff | null> {
    const owned = cookie ?? (await this.session(prepared.draft.table));
    const result = await fetchJson<OrderResponse>(ORDER_ENDPOINT, {
      method: "POST",
      headers: {
        ...sessionHeaders(prepared.draft.table, owned ?? null),
        "content-type": "application/json",
      },
      body: JSON.stringify(prepared.body),
      signal: AbortSignal.timeout(30_000),
    }, this.options.fetchImpl);
    if (!result.ok) {
      if (result.kind === "network") throw network("order submit failed", result);
      return null;
    }
    const url = checkoutUrl(result.value);
    const orderId = result.value.data?.id ?? result.value.id;
    if (url === null || orderId === undefined) return null;
    return {
      orderId: String(orderId),
      checkoutUrl: url,
      note: "Open checkoutUrl and pay with your own card. This client stops here.",
    };
  }

  private async fetchSalesarea(table: TableMid): Promise<RawSalesarea | null> {
    const result = await fetchJson<RawSalesarea>(this.salesareaUrl(table), {
      headers: sessionHeaders(table, null),
      signal: AbortSignal.timeout(20_000),
    }, this.options.fetchImpl);
    if (!result.ok) {
      if (result.kind === "network") throw network("salesarea fetch failed", result);
      return null;
    }
    return result.value;
  }

  private async fetchMenu(
    table: TableMid,
    cookie: string | null,
    sales: RawSalesarea | null,
  ): Promise<Menu | null> {
    const data = await fetchJson<RawMenuPayload>(`${JAMEZZ_ORIGIN}/v5_2/qr/data-fetch-v2`, {
      headers: sessionHeaders(table, cookie),
      signal: AbortSignal.timeout(30_000),
    }, this.options.fetchImpl);
    if (!data.ok) {
      if (data.kind === "network") throw network("menu fetch failed", data);
      return null;
    }
    return menuFromPayload(table, sales, data.value, (this.options.now ?? (() => new Date()))());
  }

  private async session(table: TableMid, fresh = false): Promise<string | null> {
    if (!fresh) {
      const cached = this.sessions.get(table);
      if (cached !== undefined) return cached;
    }
    let bootstrap: Response;
    try {
      bootstrap = await (this.options.fetchImpl ?? fetch)(`${JAMEZZ_ORIGIN}/v5/qr/${table}`, {
        headers: { "user-agent": "jamezz/0.1", accept: "text/html" },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      throw asTransportError(error);
    }
    const cookie = bootstrap.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .filter(Boolean)
      .join("; ") || null;
    if (cookie !== null) this.sessions.set(table, cookie);
    return cookie;
  }

  private salesareaUrl(table: string): string {
    const returnPath = encodeURIComponent(`${JAMEZZ_ORIGIN}/v5/qr/${table}/return`);
    return `${JAMEZZ_ORIGIN}/v5_2/qr/salesarea-fetch?session_mid=${table}&session_return_path=${returnPath}`;
  }
}

export function burgermeisterTable(): TableMid {
  return tableMid("8613S3X");
}
