/**
 * SYNTHETIC Jamezz transport. Every value is invented; nothing here is a
 * captured payload. The fixture mirrors the SHAPE observed at the public
 * Burgermeister Mehringdamm table (QR 8613S3X) on 2026-09-30 so the tests
 * exercise the documented platform quirks as behavior:
 *
 *  - data-fetch-v2 is a session delta: a full menu only for a session that
 *    just bootstrapped (has the session cookie); otherwise an empty array.
 *  - menukaart_products ids are numbers; menukaart/product ids are strings.
 *  - price-0 size parents resolve their display price from a priced
 *    `{parent} 0,2l` sibling row.
 *  - hidden boards (showInCategoryMenu=0) and blocked boards stay in the
 *    payload but must not surface.
 *
 * Checkout host and uuids use RFC 2606 example/synthetic values.
 */
import { bodyOf, headerRecord, jsonResponse, type RecordedRequest } from "./transport-fake.js";

export const SYNTHETIC_SESSION_COOKIE = "jamezz_app_session=synthetic-session";
const ORIGIN = "https://qrv5.jamezz.app";

export interface FakeJamezzOptions {
  readonly salesareaOverride?: Record<string, unknown>;
  readonly orderResponse?: Record<string, unknown>;
  readonly bootstrapStatus?: number;
}

const salesareaPayload = (override: Record<string, unknown> | undefined) => ({
  status: "ok",
  data: {
    salesarea: {
      id: 8613,
      venue_id: 1545,
      menukaartVestigingId: 5927,
      systeemNaam: "Burgermeister Mehringdamm - QR (synthetic)",
      brand_label: "burgermeister",
      valuta: "EUR",
      payProvider: "MOLLIE",
      systemOnline: 1,
      payDirect: 1,
      minOrderValue: "0.00",
      maxOrderValue: "500.00",
      ...override,
    },
  },
});

const menuPayload = {
  status: "ok",
  data: {
    menukaarts: [
      { id: "3", naam: "Menüartikel", sortkey: 0, showInCategoryMenu: 0 },
      { id: "1", naam: "Burger", sortkey: 1, showInCategoryMenu: 1 },
      { id: "4", naam: "Gesperrt", sortkey: 2, showInCategoryMenu: 1, blocked: 1 },
      {
        id: "2",
        naam: "Getränke",
        sortkey: 3,
        showInCategoryMenu: 1,
        translations: JSON.stringify({ en: { naam: "Drinks" } }),
      },
    ],
    menukaart_products: [
      { menukaart_id: 1, product_id: 101 },
      { menukaart_id: 1, product_id: 102 },
      { menukaart_id: 1, product_id: 106 },
      { menukaart_id: "2", product_id: "103" },
      { menukaart_id: 3, product_id: 104 },
      { menukaart_id: 4, product_id: 105 },
    ],
    products: [
      {
        id: "101",
        naam: "Cheeseburger",
        omschrijving: "Synthetische Beschreibung",
        price: 6.4,
        translations: JSON.stringify({
          en: { naam: "Cheeseburger", omschrijving: "Synthetic beef patty" },
        }),
      },
      { id: "102", naam: "Milkshake Vanilla", price: 0 },
      { id: "102-02", naam: "Milkshake Vanilla 0,2l", price: 3.4 },
      { id: "103", naam: "Viva Con Agua 0,33l", price: 3.1 },
      { id: "104", naam: "Hidden Combo Cola", price: 1.5 },
      { id: "105", naam: "Blocked Item", price: 2 },
      { id: "106", naam: "Sold Out Special", price: 4.5, not_available: true },
    ],
  },
};

export function fakeJamezz(options: FakeJamezzOptions = {}): {
  readonly fetchImpl: typeof fetch;
  readonly requests: readonly RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];
  let issued = 0;
  const served = new Set<string>();
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    requests.push({ method, url, headers: headerRecord(init), body: bodyOf(init) });

    if (method === "GET" && url === `${ORIGIN}/v5/qr/8613S3X`) {
      const status = options.bootstrapStatus ?? 200;
      issued += 1;
      return new Response("<html>synthetic qr page</html>", {
        status,
        ...(status < 400
          ? { headers: { "set-cookie": `${SYNTHETIC_SESSION_COOKIE}-${issued}; Path=/; HttpOnly` } }
          : {}),
      });
    }
    if (url.startsWith(`${ORIGIN}/v5_2/qr/salesarea-fetch`)) {
      return jsonResponse(salesareaPayload(options.salesareaOverride));
    }
    if (url === `${ORIGIN}/v5_2/qr/data-fetch-v2`) {
      const cookie = headerRecord(init).cookie ?? "";
      const isFreshSnapshot =
        cookie === `${SYNTHETIC_SESSION_COOKIE}-${issued}` && !served.has(cookie);
      if (isFreshSnapshot) served.add(cookie);
      return jsonResponse(isFreshSnapshot ? menuPayload : { status: "ok", data: [] });
    }
    if (method === "POST" && url === `${ORIGIN}/v5_2/shopping-cart`) {
      return jsonResponse({ status: "ok", uuid: "synthetic-cart-uuid" });
    }
    if (method === "POST" && url === `${ORIGIN}/v5_2/kiosk/order`) {
      return jsonResponse(
        options.orderResponse ?? {
          status: "ok",
          data: { id: 424242, paymentUrl: "https://pay.example/mollie/session/synthetic" },
        },
      );
    }
    return jsonResponse({ status: "error", error: `unrouted ${method} ${url}` });
  };
  return { fetchImpl, requests };
}
