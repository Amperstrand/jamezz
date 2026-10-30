import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  keyFingerprint,
  knownVenueKey,
  recordBytes,
  registerKnownVenueKey,
  signVenueKeyRecord,
  verifySignedVenueKeyRecord,
  verifyTrustedVenueKeyRecord,
  type VenueKeyRecord,
} from "../src/venue-keys.js";

function fixtureRecord(overrides: Partial<VenueKeyRecord> = {}): VenueKeyRecord {
  return {
    kind: "jamezz-venue-key-v1",
    mid: "8613S3X" as VenueKeyRecord["mid"],
    vendorPubkey: "",
    menuIdentity: { origin: "https://qrv5.jamezz.app", venueName: "Burgermeister Mehringdamm - QR", generation: "v5.2" },
    issuedAt: "2026-10-05T00:00:00Z",
    ...overrides,
  };
}

function freshKeypair(): { publicKeyDer: string; privateKeyPem: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKeyDer: publicKey.export({ format: "der", type: "spki" }).toString("base64"),
    privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  };
}

describe("venue key records (issue #7 q3)", () => {
  it("round-trips: a signed record verifies and yields the key fingerprint", () => {
    const pair = freshKeypair();
    const record = fixtureRecord({ vendorPubkey: pair.publicKeyDer });
    const signed = signVenueKeyRecord(record, pair.privateKeyPem);
    const verdict = verifySignedVenueKeyRecord(signed);
    expect(verdict).toEqual({ ok: true, fingerprint: keyFingerprint(pair.publicKeyDer), trusted: false });
  });

  it("record bytes are canonical: key order does not change what is signed", () => {
    const record = fixtureRecord();
    const shuffled: VenueKeyRecord = {
      vendorPubkey: record.vendorPubkey,
      menuIdentity: { venueName: record.menuIdentity.venueName, generation: record.menuIdentity.generation, origin: record.menuIdentity.origin },
      issuedAt: record.issuedAt,
      mid: record.mid,
      kind: record.kind,
    };
    expect(recordBytes(record).toString("hex")).toBe(recordBytes(shuffled).toString("hex"));
  });

  it("rejects tampering of every field a verifier must bind", () => {
    const pair = freshKeypair();
    const signed = signVenueKeyRecord(fixtureRecord({ vendorPubkey: pair.publicKeyDer }), pair.privateKeyPem);
    for (const tamper of [
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, mid: "8613S3Y" as VenueKeyRecord["mid"] }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, menuIdentity: { ...r.menuIdentity, venueName: "Evil Twin" } }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, menuIdentity: { ...r.menuIdentity, generation: "v3" } }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, issuedAt: "2027-01-01T00:00:00Z" }),
    ]) {
      const verdict = verifySignedVenueKeyRecord({ record: tamper(signed.record), signature: signed.signature });
      expect(verdict).toEqual({ ok: false, reason: "bad-signature" });
    }
  });

  it("rejects a foreign origin before crypto", () => {
    const pair = freshKeypair();
    const signed = signVenueKeyRecord(
      fixtureRecord({ vendorPubkey: pair.publicKeyDer, menuIdentity: { origin: "https://evil.example", venueName: "x", generation: "v5.2" } }),
      pair.privateKeyPem,
    );
    expect(verifySignedVenueKeyRecord(signed)).toEqual({ ok: false, reason: "origin-mismatch" });
  });

  it("rejects malformed records, unknown kinds, and bad pubkeys with stable reasons", () => {
    const pair = freshKeypair();
    const good = signVenueKeyRecord(fixtureRecord({ vendorPubkey: pair.publicKeyDer }), pair.privateKeyPem);
    expect(verifySignedVenueKeyRecord({ record: { ...good.record, kind: "other-v9" }, signature: good.signature })).toEqual({ ok: false, reason: "unknown-kind" });
    expect(verifySignedVenueKeyRecord({ record: { ...good.record, mid: "!!" }, signature: good.signature })).toEqual({ ok: false, reason: "malformed-record" });
    expect(verifySignedVenueKeyRecord({ record: { ...good.record, vendorPubkey: "bm90LWEta2V5" }, signature: good.signature })).toEqual({ ok: false, reason: "bad-pubkey" });
  });

  it("rejects a signature made with a different key than the declared pubkey", () => {
    const declaring = freshKeypair();
    const signing = freshKeypair();
    const signed = signVenueKeyRecord(fixtureRecord({ vendorPubkey: declaring.publicKeyDer }), signing.privateKeyPem);
    expect(verifySignedVenueKeyRecord(signed)).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects RSA pubkeys even with a valid RSA signature (issue #25)", () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const publicKeyDer = publicKey.export({ format: "der", type: "spki" }).toString("base64");
    const record = fixtureRecord({ vendorPubkey: publicKeyDer });
    const signature = sign(null, recordBytes(record), privateKey).toString("base64");
    expect(verifySignedVenueKeyRecord({ record, signature })).toEqual({ ok: false, reason: "bad-pubkey" });
  });

  it("rejects P-256 pubkeys even with a valid ECDSA signature (issue #25)", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const publicKeyDer = publicKey.export({ format: "der", type: "spki" }).toString("base64");
    const record = fixtureRecord({ vendorPubkey: publicKeyDer });
    const signature = sign(null, recordBytes(record), privateKey).toString("base64");
    expect(verifySignedVenueKeyRecord({ record, signature })).toEqual({ ok: false, reason: "bad-pubkey" });
  });

  it("rejects records missing issuedAt / venueName / generation (issue #24)", () => {
    const pair = freshKeypair();
    const base = fixtureRecord({ vendorPubkey: pair.publicKeyDer });
    for (const tamper of [
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, issuedAt: "" }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, issuedAt: 42 as unknown as string }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, menuIdentity: { ...r.menuIdentity, venueName: "" } }),
      (r: VenueKeyRecord): VenueKeyRecord => ({ ...r, menuIdentity: { ...r.menuIdentity, generation: "" } }),
    ]) {
      const signed = signVenueKeyRecord(tamper(base), pair.privateKeyPem);
      expect(verifySignedVenueKeyRecord(signed)).toEqual({ ok: false, reason: "malformed-record" });
    }
  });

  it("possession alone is untrusted; the strict variant refuses unknown bindings (issue #23)", () => {
    const pair = freshKeypair();
    const signed = signVenueKeyRecord(fixtureRecord({ vendorPubkey: pair.publicKeyDer }), pair.privateKeyPem);

    expect(verifySignedVenueKeyRecord(signed)).toEqual({ ok: true, fingerprint: keyFingerprint(pair.publicKeyDer), trusted: false });
    expect(verifyTrustedVenueKeyRecord(signed)).toEqual({ ok: false, reason: "untrusted-key" });
  });

  it("registerKnownVenueKey gates the registry and makes the binding trusted (issue #23)", () => {
    const pair = freshKeypair();
    const signed = signVenueKeyRecord(fixtureRecord({ vendorPubkey: pair.publicKeyDer }), pair.privateKeyPem);
    const foreign = freshKeypair();
    const foreignSigned = signVenueKeyRecord(
      fixtureRecord({ vendorPubkey: foreign.publicKeyDer }),
      foreign.privateKeyPem,
    );

    expect(registerKnownVenueKey(foreignSigned)).toEqual({
      ok: true,
      fingerprint: keyFingerprint(foreign.publicKeyDer),
      trusted: false,
    });
    expect(verifyTrustedVenueKeyRecord(foreignSigned)).toEqual({
      ok: true,
      fingerprint: keyFingerprint(foreign.publicKeyDer),
      trusted: true,
    });
    expect(knownVenueKey("8613S3X")).toBe(foreignSigned);

    expect(verifyTrustedVenueKeyRecord(signed)).toEqual({ ok: false, reason: "untrusted-key" });
  });

  it("registerKnownVenueKey refuses invalid records", () => {
    const pair = freshKeypair();
    const signing = freshKeypair();
    const bad = signVenueKeyRecord(
      fixtureRecord({ mid: "77ABCD2" as VenueKeyRecord["mid"], vendorPubkey: pair.publicKeyDer }),
      signing.privateKeyPem,
    );
    expect(registerKnownVenueKey(bad)).toEqual({ ok: false, reason: "bad-signature" });
    expect(knownVenueKey("77ABCD2")).toBeUndefined();
  });
});
