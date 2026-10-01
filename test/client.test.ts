import { describe, expect, it } from "vitest";
import { burgermeisterTable, JamezzClient, JamezzError } from "../src/index.js";
import { tableMid } from "../src/types.js";
import { fakeJamezz, SYNTHETIC_SESSION_COOKIE } from "./jamezz-fake.js";
import { sent } from "./transport-fake.js";

function client(fetchImpl: typeof fetch): JamezzClient {
  return new JamezzClient({
    fetchImpl,
    now: () => new Date("2026-10-02T00:00:00.000Z"),
  });
}

describe("venue", () => {
  it("reads the public table config", async () => {
    const { fetchImpl } = fakeJamezz();
    const venue = await client(fetchImpl).venue(burgermeisterTable());
    expect(venue).toMatchObject({
      name: "Burgermeister Mehringdamm - QR (synthetic)",
      currency: "EUR",
      payProvider: "MOLLIE",
      orderingEnabled: true,
      website: "https://jamezz.app/dl/8613S3X",
      address: "Mehringdamm 39, 10961 Berlin",
    });
  });

  it("omits the address for an unmapped table and honors the offline flag", async () => {
    const offline = fakeJamezz({ salesareaOverride: { systemOnline: 0 } });
    const venue = await client(offline.fetchImpl).venue(tableMid("TEST01"));
    expect(venue?.address).toBeUndefined();
    const online = fakeJamezz();
    const flags = await client(online.fetchImpl).venue(tableMid("TEST01"));
    expect(flags?.address).toBeUndefined();
    const closed = await client(offline.fetchImpl).venue(burgermeisterTable());
    expect(closed?.orderingEnabled).toBe(false);
  });
});

describe("menu", () => {
  it("bootstraps a session first, then fetches the full menu with it", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const menu = await client(fetchImpl).menu(burgermeisterTable());
    const bootstrap = requests.findIndex((r) => r.url.endsWith("/v5/qr/8613S3X"));
    const dataFetch = sent(requests, "/v5_2/qr/data-fetch-v2");
    expect(bootstrap).toBeGreaterThanOrEqual(0);
    expect(requests.findIndex((r) => r.url.includes("data-fetch-v2"))).toBeGreaterThan(bootstrap);
    expect(dataFetch?.headers["cookie"]).toContain("synthetic-session");
    expect(dataFetch?.headers["session-mid"]).toBe("8613S3X");
    expect(menu?.categories.map((c) => c.name)).toEqual(["Burger", "Drinks"]);
    expect(menu?.categories[0]?.items.find((i) => i.id === "101")).toMatchObject({
      name: "Cheeseburger",
      price: 6.4,
      description: "Synthetic beef patty",
    });
    const shake = menu?.categories[0]?.items.find((i) => i.id === "102");
    expect(shake?.price).toBe(3.4);
    const ids = menu?.categories.flatMap((c) => c.items.map((i) => i.id));
    expect(ids).not.toContain("104");
    expect(ids).not.toContain("105");
    expect(ids).not.toContain("106");
  });

  it("returns null when the session gets only an empty delta", async () => {
    const noSession = fakeJamezz({ bootstrapStatus: 503 });
    const menu = await client(noSession.fetchImpl).menu(burgermeisterTable());
    expect(menu).toBeNull();
  });

  it("re-bootstraps once when a cached session already got its snapshot", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const c = client(fetchImpl);
    const first = await c.menu(burgermeisterTable());
    expect(first?.categories[0]?.items[0]?.name).toBe("Cheeseburger");
    const second = await c.menu(burgermeisterTable());
    expect(second?.categories[0]?.items[0]?.name).toBe("Cheeseburger");
    const bootstraps = requests.filter((r) => r.url.endsWith("/v5/qr/8613S3X"));
    expect(bootstraps).toHaveLength(2);
  });

  it("throws a typed network error when the transport dies", async () => {
    const dead: typeof fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    await expect(client(dead).venue(burgermeisterTable())).rejects.toMatchObject({
      name: "JamezzError",
      reason: "network",
    });
    await expect(client(dead).menu(burgermeisterTable())).rejects.toBeInstanceOf(JamezzError);
  });
});

describe("cart and order", () => {
  it("opens a cart with the table multipart fields", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const uuid = await client(fetchImpl).openCart(burgermeisterTable());
    expect(uuid).toBe("synthetic-cart-uuid");
    const post = sent(requests, "/v5_2/shopping-cart");
    expect(post?.method).toBe("POST");
    expect(post?.headers["session-mid"]).toBe("8613S3X");
    if (post?.body instanceof FormData) {
      expect(String(post.body.get("session_mid"))).toBe("8613S3X");
      expect(String(post.body.get("session_return_path"))).toBe(
        "https://qrv5.jamezz.app/v5/qr/8613S3X/return",
      );
    } else {
      expect.unreachable("cart body must be multipart form data");
    }
  });

  it("posts the prepared order and stops at the hosted checkout", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const c = client(fetchImpl);
    const venue = await c.venue(burgermeisterTable());
    const prepared = c.prepare({
      table: burgermeisterTable(),
      lines: [
        { productId: "101", name: "Cheeseburger", unitPrice: 6.4, quantity: 1, optionProductIds: ["201"] },
      ],
      fulfillment: "eat-in",
      email: "guest@example.test",
      cartUuid: "synthetic-cart-uuid",
      currency: venue?.currency ?? "EUR",
    });
    expect(prepared.total).toBe(6.4);
    const handoff = await c.submit(prepared, SYNTHETIC_SESSION_COOKIE);
    expect(handoff).toMatchObject({
      orderId: "424242",
      checkoutUrl: "https://pay.example/mollie/session/synthetic",
    });
    const post = sent(requests, "/v5_2/kiosk/order");
    expect(post?.headers["cookie"]).toContain("synthetic-session");
    expect(post?.headers["content-type"]).toContain("application/json");
    if (typeof post?.body === "string") {
      const body = JSON.parse(post.body) as Record<string, unknown>;
      expect(body["payMethod"]).toBe("creditcard");
      expect(body["session_mid"]).toBe("8613S3X");
      expect(JSON.stringify(body)).not.toMatch(/pan|cvc|cardnumber/i);
      const fields = body["orderCustomFields"] as { OrderMode: { value: number }; email: { value: string } };
      expect(fields.OrderMode.value).toBe(1);
      expect(fields.email.value).toBe("guest@example.test");
    } else {
      expect.unreachable("order body must be a JSON string");
    }
  });

  it("bootstraps its own session for submit() when no cookie is given", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const c = client(fetchImpl);
    const prepared = c.prepare({
      table: burgermeisterTable(),
      lines: [{ productId: "101", name: "Cheeseburger", unitPrice: 6.4, quantity: 1, optionProductIds: [] }],
      fulfillment: "eat-in",
      email: "guest@example.test",
      cartUuid: "synthetic-cart-uuid",
      currency: "EUR",
    });
    const handoff = await c.submit(prepared);
    expect(handoff?.checkoutUrl).toBe("https://pay.example/mollie/session/synthetic");
    const order = sent(requests, "/v5_2/kiosk/order");
    expect(order?.headers["cookie"]).toContain("synthetic-session-1");
    expect(requests.some((r) => r.url.endsWith("/v5/qr/8613S3X"))).toBe(true);
  });

  it("returns null when the venue never yields a checkout url", async () => {
    const { fetchImpl } = fakeJamezz({ orderResponse: { status: "ok", data: { id: 424242 } } });
    const c = client(fetchImpl);
    const prepared = c.prepare({
      table: burgermeisterTable(),
      lines: [{ productId: "103", name: "Viva Con Agua 0,33l", unitPrice: 3.1, quantity: 1, optionProductIds: [] }],
      fulfillment: "take-away",
      email: "guest@example.test",
      cartUuid: "synthetic-cart-uuid",
      currency: "EUR",
    });
    expect(await c.submit(prepared, SYNTHETIC_SESSION_COOKIE)).toBeNull();
  });
});
