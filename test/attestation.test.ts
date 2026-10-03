import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { attestationDigest, canonicalJson } from "../src/attestation.js";

const attestation = {
  pin: { setId: "table-order-vendors-berlin", contentHash: "synthetic-set-hash" },
  proof: {
    c0: "synthetic-c0",
    keyImage: "synthetic-key-image",
    responses: ["r-one", "r-two"],
    ring: ["member-one", "member-two", "member-three"],
  },
};

describe("canonicalJson", () => {
  it("sorts object keys recursively so insertion order cannot change the digest input", () => {
    const reordered = {
      proof: {
        ring: ["member-one", "member-two", "member-three"],
        responses: ["r-one", "r-two"],
        keyImage: "synthetic-key-image",
        c0: "synthetic-c0",
      },
      pin: { contentHash: "synthetic-set-hash", setId: "table-order-vendors-berlin" },
    };
    expect(canonicalJson(reordered)).toBe(canonicalJson(attestation));
    expect(canonicalJson(attestation)).toBe(
      '{"pin":{"contentHash":"synthetic-set-hash","setId":"table-order-vendors-berlin"},' +
        '"proof":{"c0":"synthetic-c0","keyImage":"synthetic-key-image",' +
        '"responses":["r-one","r-two"],"ring":["member-one","member-two","member-three"]}}',
    );
  });

  it("rejects values JSON cannot represent faithfully, naming the path", () => {
    expect(() => canonicalJson({ proof: { keyImage: undefined } })).toThrow(
      /attestation at \$\.proof\.keyImage is not JSON-safe: undefined value/,
    );
    expect(() => canonicalJson({ ring: [() => "x"] })).toThrow(/not JSON-safe/);
    expect(() => canonicalJson({ c0: Number.NaN })).toThrow(/not JSON-safe/);
    expect(() => canonicalJson({ c0: 1n })).toThrow(/not JSON-safe/);
  });
});

describe("attestationDigest", () => {
  it("labels the algorithm and digests the canonical form (golden, computed independently)", () => {
    const record = attestationDigest(attestation);
    expect(record.algorithm).toBe("sha256");
    expect(record.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(record.digest).toBe("a28818c7290d74672954d1d881cf3bd7ddb63d95cfc73ea0b255d7853c768c2f");
    expect(record.digest).toBe(
      createHash("sha256")
        .update(
          '{"pin":{"contentHash":"synthetic-set-hash","setId":"table-order-vendors-berlin"},' +
            '"proof":{"c0":"synthetic-c0","keyImage":"synthetic-key-image",' +
            '"responses":["r-one","r-two"],"ring":["member-one","member-two","member-three"]}}',
          "utf8",
        )
        .digest("hex"),
    );
  });

  it("changes when the proof changes", () => {
    const altered = {
      ...attestation,
      proof: { ...attestation.proof, keyImage: "synthetic-other-key-image" },
    };
    expect(attestationDigest(altered).digest).not.toBe(attestationDigest(attestation).digest);
  });
});
