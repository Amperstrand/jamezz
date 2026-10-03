import { describe, expect, it } from "vitest";
import { encodeOrderIntent, orderIntentMessage } from "../src/order-intent.js";
import { tableMid } from "../src/types.js";

const intent = {
  orderId: "synthetic-order-id",
  platform: "jamezz" as const,
  venueId: tableMid("8613S3X"),
  items: [
    { menuItemId: "101", quantity: 2, options: ["201", "202"] },
    { menuItemId: "103", quantity: 1, options: [] },
  ],
  fulfillment: "take-away",
  total: "1610",
  currency: "EUR",
  emailHash: "a".repeat(64),
  createdAt: "2026-10-03T10:00:00Z",
  expiresAt: "2026-10-03T10:20:00Z",
  pin: { setId: "table-order-vendors-berlin", contentHash: "synthetic-set-hash" },
};

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

describe("encodeOrderIntent", () => {
  it("emits the domain tag raw, then uint32-be length-prefixed fields in fixed order (golden)", () => {
    expect(hex(encodeOrderIntent(intent))).toBe(
      "44524f5053484f502d4f524445522d494e54454e542f7631" +
        "0000001273796e7468657469632d6f726465722d6964" +
        "000000066a616d657a7a" +
        "0000000738363133533358" +
        "0000000132" +
        "00000003313031" +
        "0000000132" +
        "0000000132" +
        "00000003323031" +
        "00000003323032" +
        "00000003313033" +
        "0000000131" +
        "0000000130" +
        "0000000974616b652d61776179" +
        "0000000431363130" +
        "00000003455552" +
        "00000040" + "61".repeat(64) +
        "00000014323032362d31302d30335431303a30303a30305a" +
        "00000014323032362d31302d30335431303a32303a30305a" +
        "0000001a7461626c652d6f726465722d76656e646f72732d6265726c696e" +
        "0000001273796e7468657469632d7365742d68617368",
    );
  });

  it("is deterministic — the same intent encodes to the same bytes twice", () => {
    expect(hex(encodeOrderIntent(intent))).toBe(hex(encodeOrderIntent({ ...intent })));
  });

  it("rejects a decimal total (ADR-009: amounts are integer minor-unit strings)", () => {
    expect(() => encodeOrderIntent({ ...intent, total: "16.10" })).toThrow(/minor units/);
    expect(() => encodeOrderIntent({ ...intent, total: "-1" })).toThrow(/minor units/);
  });

  it("rejects malformed currency, email hash, timestamps, items, and pin fields", () => {
    expect(() => encodeOrderIntent({ ...intent, currency: "eur" })).toThrow(/ISO-4217/);
    expect(() => encodeOrderIntent({ ...intent, emailHash: "ABC" })).toThrow(/emailHash/);
    expect(() => encodeOrderIntent({ ...intent, createdAt: "yesterday" })).toThrow(/ISO-8601/);
    expect(() => encodeOrderIntent({ ...intent, items: [] })).toThrow(/at least one item/);
    expect(() =>
      encodeOrderIntent({ ...intent, items: [{ menuItemId: "101", quantity: 0, options: [] }] }),
    ).toThrow(/quantity must be an integer >= 1/);
    expect(() =>
      encodeOrderIntent({ ...intent, pin: { setId: "", contentHash: "synthetic-set-hash" } }),
    ).toThrow(/pin\.setId must not be empty/);
  });
});

describe("orderIntentMessage", () => {
  it("is sha256 of the preimage — the bytes a signature covers (golden)", () => {
    expect(hex(orderIntentMessage(intent))).toBe(
      "5a00d4ec1f459d2abfd4eb04408b014c8391574647edc0364e6d65e7a8016f01",
    );
  });
});
