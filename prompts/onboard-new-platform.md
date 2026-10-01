---
description: Onboard a venue on a NEW table-QR platform (not Jamezz). Same rules, new endpoints.
---

Onboard VENUE on PLATFORM (not Jamezz — for Jamezz use onboard-table.md).
The outcome is a documented provider-grade client with tests, published
without captured data.

## Phase 0 — Classify (2 min)

Cheap recon before any browser: `curl /llms.txt`, `/robots.txt`,
`/sitemap.xml`, one product page's JSON-LD. Fingerprints of known platforms
are in `docs/CANDIDATES.md`. If the platform is already known, reuse its
fake and tests; only the endpoints are new.

## Phase 1 — Entrypoint and identity (5 min)

Resolve the QR/link chain to the venue's stable identifier (mid, slug,
store id). Find the config endpoint that names the venue: ids, currency,
language, PSP, loyalty, fulfillment modes, order limits. Record the
endpoint table — it becomes `docs/` and the fake's route list.

## Phase 2 — Data surface (10 min)

Answer once: **cookieless JSON? session-delta? websocket-only?
server-rendered HTML?** Replay each call with curl and note which
cookies/headers are load-bearing. Document the data quirks (id type
mismatches, price-0 parents, hidden categories) — each quirk becomes a
test.

## Phase 3 — Account (10 min)

Register with YOUR OWN fresh cashu.email address
([docs/ORDERING.md](../docs/ORDERING.md) §1). Known traps: the first
verification mail can 200-and-never-arrive (re-send once, poll ~20s);
registration endpoints can report failure but succeed (verify via the
"already exists" error before declaring failure).

## Phase 4 — Order to the boundary (10 min)

Drive product → options → cart → checkout in a browser with a HAR recorder
attached for your own analysis. Capture the order-create request/response
SHAPE (that is the contract) and the status-endpoint semantics. STOP at the
PSP. Confirm an unpaid order does not fire to the venue. Never complete a
payment during onboarding, never probe price integrity, never order hidden
items standalone.

## Phase 5 — Artifacts (what may be published)

- Endpoint table + adaptation recipe in `docs/`.
- Client package with an injectable transport.
- `test/<platform>-fake.ts` + tests per `prompts/write-tests.md`.
- Quirks appended to the Lessons list in that prompt.

NOT published: HAR files, raw payloads, screenshots of checkout pages,
order ids, cookies, account identities. They stay local, gitignored.

## Verify

- Tests green offline against the synthetic fake.
- `npm run gate` clean (tree and history).
- One live price matches the venue's UI exactly — that proves the mapping.
