import { createHash, sign as edSign, verify as edVerify, createPublicKey, type KeyObject } from "node:crypto";
import { canonicalJson } from "./attestation.js";
import { tableMid, type TableMid } from "./types.js";

/**
 * Venue key binding (issue #7 q3). The venue's QR stays untouched; the
 * binding between a table mid and a vendor signing key is a PARALLEL
 * signed record, resolvable by mid the way /.well-known resolves UCP
 * endpoints. The QR keeps saying "load my menu"; this record says "and
 * this is the key whose attestations count for that mid".
 */

export interface VenueKeyRecord {
  readonly kind: "jamezz-venue-key-v1";
  readonly mid: TableMid;
  /** ed25519 public key, SPKI DER, base64. */
  readonly vendorPubkey: string;
  readonly menuIdentity: {
    readonly origin: string;
    readonly venueName: string;
    readonly generation: string;
  };
  readonly issuedAt: string;
}

export interface SignedVenueKeyRecord {
  readonly record: VenueKeyRecord;
  /** ed25519 detached signature over the canonical record bytes, base64. */
  readonly signature: string;
}

export type VerificationFailure =
  | "malformed-record"
  | "unknown-kind"
  | "bad-pubkey"
  | "bad-signature"
  | "origin-mismatch";

export type VerificationResult = { ok: true; fingerprint: string } | { ok: false; reason: VerificationFailure };

/** Bytes a vendor signs and every verifier hashes: canonical JSON, UTF-8. */
export function recordBytes(record: VenueKeyRecord): Buffer {
  return Buffer.from(canonicalJson(record), "utf8");
}

/** Short human-checkable identity of the vendor key (sha256, first 16 hex). */
export function keyFingerprint(vendorPubkey: string): string {
  return createHash("sha256").update(vendorPubkey, "utf8").digest("hex").slice(0, 16);
}

function parsePubkey(vendorPubkey: string): KeyObject | null {
  try {
    return createPublicKey({ key: Buffer.from(vendorPubkey, "base64"), format: "der", type: "spki" });
  } catch {
    return null;
  }
}

export function verifySignedVenueKeyRecord(
  signed: SignedVenueKeyRecord,
  expectedOrigin = "https://qrv5.jamezz.app",
): VerificationResult {
  const { record } = signed;
  if (record === null || typeof record !== "object" || typeof record.mid !== "string" || typeof record.vendorPubkey !== "string" || typeof signed.signature !== "string") {
    return { ok: false, reason: "malformed-record" };
  }
  if (record.kind !== "jamezz-venue-key-v1") return { ok: false, reason: "unknown-kind" };
  try {
    tableMid(record.mid);
  } catch {
    return { ok: false, reason: "malformed-record" };
  }
  if (record.menuIdentity?.origin !== expectedOrigin) return { ok: false, reason: "origin-mismatch" };
  const pubkey = parsePubkey(record.vendorPubkey);
  if (pubkey === null) return { ok: false, reason: "bad-pubkey" };
  const valid = edVerify(null, recordBytes(record), pubkey, Buffer.from(signed.signature, "base64"));
  return valid ? { ok: true, fingerprint: keyFingerprint(record.vendorPubkey) } : { ok: false, reason: "bad-signature" };
}

/**
 * Registry of verified key bindings, keyed by mid. Empty until the
 * trust-layer side publishes records; entries land only with a verified
 * signature and a recorded source (never guessed — same rule as mids).
 */
export const KNOWN_VENUE_KEYS: Readonly<Record<string, SignedVenueKeyRecord>> = {};

export function knownVenueKey(mid: string): SignedVenueKeyRecord | undefined {
  return KNOWN_VENUE_KEYS[mid];
}

/** Test/self-sign helper: produces a valid record + signature for a keypair. */
export function signVenueKeyRecord(record: VenueKeyRecord, privateKeyPem: string): SignedVenueKeyRecord {
  const signature = edSign(null, recordBytes(record), createPrivateKey(privateKeyPem));
  return { record, signature: signature.toString("base64") };
}
