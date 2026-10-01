---
description: Write the client test suite for a venue API. Fake the transport, encode the quirks, feed the lessons back.
---

Write tests for CLIENT against PLATFORM. The suite must pass offline, prove
the wire contract, and stay leak-gate clean.

## Principles

1. **Test through the public methods.** Inject the transport (`fetchImpl`).
   Never mock client internals. If the client cannot accept an injected
   transport, that is the first finding — fix the client first.
2. **The fake is a router, not a per-test mock.** One `fake<Platform>()`
   factory that routes URLs and records every request (method, url, headers,
   body). Assertions read the request log: the wire contract is the thing
   under test. Share generic helpers (`test/transport-fake.ts`) across
   platforms.
3. **One describe per endpoint, one test per documented quirk.** The
   platform playbook's traps section IS the test list. Every trap becomes an
   `it(...)`.
4. **Encode session semantics in the fake, not the test.** If the API serves
   a full payload only to fresh sessions (Jamezz `data-fetch-v2` is a
   session delta), the fake returns an empty delta unless the bootstrap
   cookie is present — the ordering bug then fails the test naturally.
5. **Synthetic fixtures only.** Invented ids, prices, uuids; RFC 2606
   `example` hosts; a provenance comment saying so. Prices may mirror the
   venue's public menu math where a flow was verified. No captured payloads.
6. **Assert the payment boundary.** An order test asserts the client returns
   the hosted checkout URL and never a card field
   (`expect(JSON.stringify(body)).not.toMatch(/pan|cvc|cardnumber/i)`).

## Steps

1. Read the platform endpoint table (for Jamezz: `docs/ORDERING.md`).
2. Build `test/<platform>-fake.ts` with the quirks pre-installed.
3. Write `test/client.test.ts` wiring tests: bootstrap ordering, header and
   cookie propagation, cart fields, order body, boundary, failure paths.
4. `npm test && npm run typecheck && npm run gate` — all green.
5. **Learn:** every quirk you had to encode that is NOT in the docs gets
   added to the docs AND to Lessons below. The tests and the playbook
   converge; that loop is the point.

## Scale to a new platform

- Copy the fake's shape, not its routes. Endpoints come from the endpoint
  table of the new platform.
- Reuse `test/transport-fake.ts` helpers (headerRecord, bodyOf,
  jsonResponse, sent) — do not rewrite them per platform.
- Keep one fake per platform; a fake that grows conditionals for two
  platforms is two fakes.

## Lessons (append-only)

- Jamezz serves `data-fetch-v2` as a session delta — the fake must key on
  the bootstrap cookie or ordering bugs hide. Upgrade: the fake now issues
  a numbered session per bootstrap and serves the snapshot exactly once,
  which also proves the client's cached-session retry.
- Link ids (`menukaart_products`) are numeric; entity ids are strings —
  stringify before joining.
- Price-0 size parents resolve their display price from a priced
  `{parent} 0,2l` sibling row — the fixture must include the sibling.
- Hidden boards (`showInCategoryMenu=0`) and blocked boards stay in the
  payload — the fixture includes them to prove the filter.
- `cartTotal` covers line items only; option articles ride in
  `orderOptionGroups` and the venue reprices at the PSP — assert the shape,
  never fake the math.
- The first loyalty mail after signup can 200 and never deliver — when a
  loyalty client is added, encode the resend in the fake.
- A non-2xx bootstrap must not set a session cookie, or the delta test
  lies (found the hard way: the first fake handed cookies out on 503s).
- Transport death and "platform says no" are different contracts: network
  failures throw a typed error, absences return null. Test both.
