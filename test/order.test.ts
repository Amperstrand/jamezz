import { describe, expect, it } from "vitest";
import { buildOrderBody, cartTotal, draftFromLines, prepareOrder } from "../src/order.js";
import { tableMid } from "../src/types.js";

const line = {
  productId: "100",
  name: "Demo Burger",
  unitPrice: 6.4,
  quantity: 1,
  optionProductIds: ["200"],
} as const;

const attestation = {
  pin: { setId: "table-order-vendors-berlin", contentHash: "synthetic-set-hash" },
  proof: {
    c0: "synthetic-c0",
    keyImage: "synthetic-key-image",
    responses: ["r-one", "r-two"],
    ring: ["member-one", "member-two", "member-three"],
  },
};

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

describe("attestation passthrough (issue #7)", () => {
  it("records a sha256 digest on the prepared order but never verifies or inspects the proof", () => {
    const prepared = prepareOrder(
      draftFromLines({
        table: tableMid("8613S3X"),
        lines: [line],
        fulfillment: "eat-in",
        email: "guest@example.test",
        cartUuid: "cart-1",
        attestation,
      }),
      "EUR",
    );
    expect(prepared.attestation).toEqual({
      algorithm: "sha256",
      digest: "a28818c7290d74672954d1d881cf3bd7ddb63d95cfc73ea0b255d7853c768c2f",
    });
  });

  it("leaves the prepared order without an attestation record when none was given", () => {
    const prepared = prepareOrder(
      draftFromLines({
        table: tableMid("8613S3X"),
        lines: [line],
        fulfillment: "eat-in",
        email: "guest@example.test",
        cartUuid: "cart-1",
      }),
      "EUR",
    );
    expect(prepared.attestation).toBeUndefined();
  });

  it("keeps the attestation off the venue wire — the kiosk/order body carries no proof fields", () => {
    const draft = draftFromLines({
      table: tableMid("8613S3X"),
      lines: [line],
      fulfillment: "eat-in",
      email: "guest@example.test",
      cartUuid: "cart-1",
      attestation,
    });
    const body = JSON.stringify(buildOrderBody(draft));
    expect(body).not.toContain("attestation");
    expect(body).not.toContain("synthetic-key-image");
    expect(body).not.toContain("synthetic-set-hash");
    expect(body).not.toMatch(/pan|cvc|cardnumber/i);
  });
});
