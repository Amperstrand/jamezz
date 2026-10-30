import { createHash, createPrivateKey, createPublicKey, sign as edSign, verify as edVerify, type KeyObject } from "node:crypto";
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
  | "origin-mismatch"
  | "untrusted-key";

export type VerificationResult =
  | { ok: true; fingerprint: string; trusted: boolean }
  | { ok: false; reason: VerificationFailure };

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
  if (
    record === null ||
    typeof record !== "object" ||
    typeof record.mid !== "string" ||
    typeof record.vendorPubkey !== "string" ||
    typeof signed.signature !== "string" ||
    typeof record.issuedAt !== "string" ||
    record.issuedAt === "" ||
    typeof record.menuIdentity?.venueName !== "string" ||
    record.menuIdentity.venueName === "" ||
    typeof record.menuIdentity?.generation !== "string" ||
    record.menuIdentity.generation === ""
  ) {
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
  if (pubkey.asymmetricKeyType !== "ed25519") return { ok: false, reason: "bad-pubkey" };
  const valid = edVerify(null, recordBytes(record), pubkey, Buffer.from(signed.signature, "base64"));
  if (!valid) return { ok: false, reason: "bad-signature" };
  return { ok: true, fingerprint: keyFingerprint(record.vendorPubkey), trusted: isKnownBinding(record.mid, record.vendorPubkey) };
}

/**
 * Strict variant for consumers: identical checks, plus the venue-authorized
 * binding must already be established in the curated registry. A record that
 * merely verifies cryptographically proves POSSESSION of the vendor key, not
 * that the venue authorized the mid-to-key binding (issue #23) — an
 * untrusted resolver can always supply a self-generated keypair.
 */
export function verifyTrustedVenueKeyRecord(
  signed: SignedVenueKeyRecord,
  expectedOrigin = "https://qrv5.jamezz.app",
): VerificationResult {
  const verdict = verifySignedVenueKeyRecord(signed, expectedOrigin);
  if (!verdict.ok) return verdict;
  if (!verdict.trusted) return { ok: false, reason: "untrusted-key" };
  return verdict;
}

function isKnownBinding(mid: string, vendorPubkey: string): boolean {
  const known = KNOWN_VENUE_KEYS[mid];
  return known !== undefined && known.record.vendorPubkey === vendorPubkey;
}

const registry: Record<string, SignedVenueKeyRecord> = {};

/**
 * Registry of verified key bindings, keyed by mid. Empty until the
 * trust-layer side publishes records; entries land only with a verified
 * signature and a recorded source (never guessed — same rule as mids).
 */
export const KNOWN_VENUE_KEYS: Readonly<Record<string, SignedVenueKeyRecord>> = registry;

export function knownVenueKey(mid: string): SignedVenueKeyRecord | undefined {
  return registry[mid];
}

/** Trust-layer seam: register a binding as venue-authorized. The record must
 *  fully verify (shape, Ed25519, signature, origin) before it enters the
 *  registry — this is the only write path to KNOWN_VENUE_KEYS. */
export function registerKnownVenueKey(
  signed: SignedVenueKeyRecord,
  expectedOrigin = "https://qrv5.jamezz.app",
): VerificationResult {
  const verdict = verifySignedVenueKeyRecord(signed, expectedOrigin);
  if (!verdict.ok) return verdict;
  registry[signed.record.mid] = signed;
  return verdict;
}

/** Test/self-sign helper: produces a valid record + signature for a keypair. */
export function signVenueKeyRecord(record: VenueKeyRecord, privateKeyPem: string): SignedVenueKeyRecord {
  const signature = edSign(null, recordBytes(record), createPrivateKey(privateKeyPem));
  return { record, signature: signature.toString("base64") };
}
