# Adapter boundary and attestation passthrough (issue #7)

Decision record for
[Amperstrand/jamezz#7](https://github.com/Amperstrand/jamezz/issues/7)
("Coordinate the venue-adapter boundary: declarative adapter spec + where an
attestation hangs on submit()"), written so a stranger can see what was
decided and where each side's job starts. The trust-layer work it
coordinates with lives in
[Amperstrand/mcp-cashu-exchange](https://github.com/Amperstrand/mcp-cashu-exchange)
(ring-sig gate, paid leg) and the DropShop gateway (`orders-402.ts`,
ADR-009).

## Where the attestation hangs

**Verification lives above this SDK.** The jamezz client stays crypto-free:
no ring math, no schnorr, no pin policy. The pin and the policy are
deployment properties of the platform layer, so bolting them in would double
the trust surface for zero benefit.

What this SDK provides instead (issue #7 Q2):

- `prepare()` accepts an optional `attestation` — an opaque, platform-owned
  object (ring proof today, plain schnorr if the ring is retired; an
  optional `pin { setId, contentHash }` is the only structured part).
- `prepareOrder()` derives an `AttestationDigest` from it: **sha256 over the
  canonical JSON encoding** (object keys sorted recursively, UTF-16 code
  unit order; values JSON cannot represent faithfully are rejected, not
  silently coerced).
- The digest rides on `PreparedOrder` and on the `PaymentHandoff` that
  `submit()` returns, so the staged-order record and the venue receipt can
  carry the proof digest for audit. **Persist, never verify.**
- The attestation never reaches the venue API. `buildOrderBody()` does not
  emit it and the tests assert its absence on the recorded kiosk/order
  request, the same way card fields are asserted absent. The venue has no
  such field; inventing one on a live kitchen endpoint is unverifiable risk.

The platform's gate sits at its own `funded → attested → submitted`
transition, before the venue order is created — the SDK takes no position
on that; it only guarantees the digest is on the record the moment the
venue order exists.

## The signed order-intent object

The exchange signs *our* object by importing the encoder, never by
re-implementing it: `encodeOrderIntent()` / `orderIntentMessage()` in
`src/order-intent.ts`, domain `DROPSHOP-ORDER-INTENT/v1`. The byte layout is
the same scheme as the exchange's `plugin-trust-ring/prove.ts orderMessage`:
the UTF-8 domain tag raw, then every field as uint32 big-endian length +
UTF-8 bytes in fixed order — orderId, platform ("jamezz" — venue ids are
platform-scoped; added before any production signature existed, per the
Numo#1 contract note), venueId (the jamezz QR mid), itemCount,
per item {menuItemId, quantity, optionCount, option ids}, fulfillment,
total, currency, emailHash, createdAt, expiresAt, pin.setId,
pin.contentHash. `orderIntentMessage()` returns sha256(preimage): the bytes
a signature covers. Counts and quantities are decimal strings through the
same prefixing.

Two hard rules encoded as validation, not convention:

- **`total` is a decimal string in ISO-4217 minor units** (`"1440"`, never
  `"14.40"`, never a float). ADR-009: the 2fiat API 500s on `"2.00"`;
  Jamezz prices are decimal EUR. The signed total must come from the
  server's quote, never client math — that is the platform's job to
  enforce; the encoder refuses anything that is not an integer
  minor-units string.
- `emailHash` is a sha256 hex of the email — a hash, not plaintext, so the
  signed object keeps buyer pseudonymity.

## Declarative adapter spec: split by risk, not by principle (issue #7 Q1)

- **Menu reads → declarative, at the platform layer.** One reviewed engine
  over endpoint templates + field maps, with a dry-run mode ("fetch the
  menu, show the mapping, place no order"). That engine consumes
  jamezz-shaped adapters; the spec does not live in this repo.
- **Order submit → stays a typed code path per venue family, in jamezz.**
  Submission is stateful (session cookie + `session-mid` header acquired
  per venue), consequential (a real kitchen ticket), and shaped by exactly
  the drift issue #5 records. This is the code that must not become data.

## Venue keys and the QR (issue #7 Q3)

A venue's whole identity today is the platform's QR `mid`; there is no
venue-controlled endpoint, inbox, or keystore, so a venue cannot hold a
keypair. The QR payload is **not** extended: it is jamezz's artifact, not
the venue's. A `mid ↔ member pubkey` binding, if wanted, belongs in the
trust-set member metadata so the set author's vouch covers it.

## Drift a declarative read-spec must survive (issue #7 Q4)

From the v2.0 drift notes (issue #5), in bite-order — each is already
encoded as a fake fixture and a test in this repo:

1. `paymentURL` nesting varies across response shapes — a fallback chain,
   not one JSONPath (`checkoutUrl()` in `src/client.ts`).
2. Per-item `uuid` on `kiosk/order` is client-generated; a naive field map
   will not produce one, and the platform answers a missing uuid with
   HTTP 200 and a swallowed Laravel error (`orderStatus: 0`).
3. Cart `data.uuid` must round-trip byte-identical — regenerated uuids
   break the bind between cart open and order submit.
4. The auth shape is a *session acquisition step* (bootstrap `GET
   /v5/qr/{mid}` → cookie + `session-mid` header pair), not a header
   template.
5. The menu fetch is a session delta: a stale session returns `[]`, not an
   error. A dry-run mode must treat that as failure, not as an empty menu.

## Standing caveat

A ring verdict is a risk signal, not deterrence — "one of N" cannot
attribute a bad order. Nothing in this repo changes that; the attestation
passthrough implies nothing about vendor conduct after the kitchen fires,
and no test or CI path here may ever create a real venue order.
