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

export class JamezzClient {
  constructor(private readonly options: ClientOptions = {}) {}

  async venue(table: TableMid): Promise<Venue | null> {
    const result = await fetchJson<RawSalesarea>(this.salesareaUrl(table), {
      headers: sessionHeaders(table, null),
      signal: AbortSignal.timeout(20_000),
    }, this.options.fetchImpl);
    if (!result.ok) return null;
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
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const bootstrap = await fetchImpl(`${JAMEZZ_ORIGIN}/v5/qr/${table}`, {
      headers: { "user-agent": "jamezz/0.1", accept: "text/html" },
      signal: AbortSignal.timeout(20_000),
    });
    const cookie = bootstrap.headers.getSetCookie().map((entry) => entry.split(";")[0]).filter(Boolean).join("; ") || null;
    const sales = await fetchJson<RawSalesarea>(this.salesareaUrl(table), {
      headers: sessionHeaders(table, null),
      signal: AbortSignal.timeout(20_000),
    }, fetchImpl);
    const data = await fetchJson<RawMenuPayload>(`${JAMEZZ_ORIGIN}/v5_2/qr/data-fetch-v2`, {
      headers: sessionHeaders(table, cookie),
      signal: AbortSignal.timeout(30_000),
    }, fetchImpl);
    if (!data.ok) return null;
    return menuFromPayload(table, sales.ok ? sales.value : null, data.value, (this.options.now ?? (() => new Date()))());
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
    if (!result.ok || result.value.uuid === undefined) return null;
    return result.value.uuid;
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
   * Posts the prepared order. The response is a hosted card page.
   * Do not enter a card number in this client. A person opens checkoutUrl.
   */
  async submit(prepared: PreparedOrder, cookie: string): Promise<PaymentHandoff | null> {
    const result = await fetchJson<OrderResponse>(ORDER_ENDPOINT, {
      method: "POST",
      headers: {
        ...sessionHeaders(prepared.draft.table, cookie),
        "content-type": "application/json",
      },
      body: JSON.stringify(prepared.body),
      signal: AbortSignal.timeout(30_000),
    }, this.options.fetchImpl);
    if (!result.ok) return null;
    const url = checkoutUrl(result.value);
    const orderId = result.value.data?.id ?? result.value.id;
    if (url === null || orderId === undefined) return null;
    return {
      orderId: String(orderId),
      checkoutUrl: url,
      note: "Open checkoutUrl and pay with your own card. This client stops here.",
    };
  }

  private salesareaUrl(table: string): string {
    const returnPath = encodeURIComponent(`${JAMEZZ_ORIGIN}/v5/qr/${table}/return`);
    return `${JAMEZZ_ORIGIN}/v5_2/qr/salesarea-fetch?session_mid=${table}&session_return_path=${returnPath}`;
  }
}

export function burgermeisterTable(): TableMid {
  return tableMid("8613S3X");
}
