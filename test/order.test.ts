import { describe, expect, it } from "vitest";
import { buildOrderBody, cartTotal, draftFromLines } from "../src/order.js";
import { tableMid } from "../src/types.js";

const line = {
  productId: "100",
  name: "Demo Burger",
  unitPrice: 6.4,
  quantity: 1,
  optionProductIds: ["200"],
} as const;

describe("buildOrderBody", () => {
  it("prices the cart and marks card payment without storing a card", () => {
    const draft = draftFromLines({
      table: tableMid("8613S3X"),
      lines: [line],
      fulfillment: "eat-in",
      email: "guest@example.test",
      cartUuid: "cart-1",
    });
    const body = buildOrderBody(draft);
    expect(cartTotal(draft.lines)).toBe(6.4);
    expect(body["payMethod"]).toBe("creditcard");
    expect(body["payProvider"]).toBe("MOLLIE");
    expect(body["session_mid"]).toBe("8613S3X");
    expect(JSON.stringify(body)).not.toMatch(/pan|cvc|cardnumber/i);
    const fields = body["orderCustomFields"] as { OrderMode: { value: number }; email: { value: string } };
    expect(fields.OrderMode.value).toBe(1);
    expect(fields.email.value).toBe("guest@example.test");
  });

  it("rejects an empty cart and a malformed email", () => {
    expect(() =>
      draftFromLines({
        table: tableMid("8613S3X"),
        lines: [],
        fulfillment: "take-away",
        email: "guest@example.test",
        cartUuid: "cart-1",
      }),
    ).toThrow(/at least one line/);
    expect(() =>
      draftFromLines({
        table: tableMid("8613S3X"),
        lines: [line],
        fulfillment: "take-away",
        email: "not-an-email",
        cartUuid: "cart-1",
      }),
    ).toThrow(/address you control/);
  });
});
