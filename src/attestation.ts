import { createHash } from "node:crypto";
import type { AttestationDigest, OrderAttestation } from "./types.js";

/**
 * Deterministic JSON for hashing: object keys sorted recursively, no
 * whitespace. Keys sort by UTF-16 code unit; values JSON cannot represent
 * faithfully (undefined, functions, bigints, symbols, non-finite numbers)
 * throw instead of silently degrading, so two runtimes digest the same
 * attestation to the same bytes.
 */
export function canonicalJson(value: unknown): string {
  return serialize(value, "$");
}

function serialize(value: unknown, path: string): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`attestation at ${path} is not JSON-safe: non-finite number`);
      }
      return JSON.stringify(value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((entry, i) => serialize(entry, `${path}[${i}]`)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      const members = Object.keys(record)
        .sort()
        .map((key) => {
          if (record[key] === undefined) {
            throw new Error(`attestation at ${path}.${key} is not JSON-safe: undefined value`);
          }
          return `${JSON.stringify(key)}:${serialize(record[key], `${path}.${key}`)}`;
        });
      return `{${members.join(",")}}`;
    }
    default:
      throw new Error(`attestation at ${path} is not JSON-safe: ${typeof value}`);
  }
}

export function attestationDigest(attestation: OrderAttestation): AttestationDigest {
  return {
    algorithm: "sha256",
    digest: createHash("sha256").update(canonicalJson(attestation), "utf8").digest("hex"),
  };
}
