# AGENTS.md — contributing to jamezz

A read-and-prepare client for Jamezz table ordering (2,000+ venues, 25+
countries; Burgermeister Mehringdamm `8613S3X` is the worked example).
Consumed as a library, as an MCP/REST surface via
[mcp-cashu-exchange](https://github.com/Amperstrand/mcp-cashu-exchange),
and by the numo-bridge POS integration. Read the [README](README.md),
[docs/ORDERING.md](docs/ORDERING.md) (the API map), and
[docs/CANDIDATES.md](docs/CANDIDATES.md) (finding more venues) first.

## Repo map

| Path | What |
|---|---|
| `src/client.ts` | `JamezzClient` — venue/menu reads, cart, order submit |
| `src/order.ts` | order body builder (v2 shapes: per-line uuids) |
| `src/cli.ts` | read-only CLI (`npx jamezz menu <mid>`) — no order command on purpose |
| `src/venues.ts` | the venue catalog — data, not code; one row per photographed QR |
| `test/jamezz-fake.ts` | synthetic transport that encodes the platform quirks |
| `prompts/` | onboarding recipes (table, new platform, brand, cheapest test, writing tests) |
| `docs/` | ORDERING · PARTICIPANT-GUIDE · CANDIDATES · VENUES · HOW · PROVENANCE |

## Dev loop

```sh
npm install        # prepare builds dist/ (git-dep consumers need it)
npm test           # vitest — fully offline against the fakes
npm run typecheck && npm run build
npm run gate       # leak scan, tree + history
node dist/cli.js menu 8613S3X   # live read-only check
```

Conventions:

- **Error semantics:** a thrown `JamezzError` (reason `"network"`) means
  the platform was unreachable; a `null` return always means the platform
  answered and the thing is absent. Don't blur them.
- The client owns its sessions (re-bootstraps on delta-empty menus);
  `submit()` takes no cookie.
- **Quirk → test → Lesson:** every platform trap becomes a fixture in the
  fake, a test, and a line in `prompts/write-tests.md` Lessons. The v2.0
  drift fix (jamezz#5) is the worked example.
- Fakes are routers with request logs (`test/transport-fake.ts` helpers);
  assert on the wire, not on internals. A 200 is not a success
  (swallowed-error responses are pinned as tests).
- New venues: follow `prompts/onboard-table.md`. A catalog row requires a
  photographed QR **or** a mid verifiably published by the venue (indexed
  QR page, venue site) plus a live read confirming name, currency, and real
  prices. Never guess or derive a mid.

## Commits and CI

Commit with `sh scripts/git-commit.sh` (the wrapper runs the staged leak
scan; hooks don't launch in this environment). CI runs typecheck, build,
tests, and the leak scan on history. A weekly Smoke workflow does a
read-only live venue check and opens an issue on drift.

## Publication rules (hard boundaries)

This repository is public. Treat every file as if a stranger will read it.

Never commit:

- Card numbers, expiry, CVC, or a 2fiat / prepaid card in any form.
- HAR files, pcaps, browser logs, screenshots of a checkout page, cookies,
  session dumps, `.env`, identity files, or secret keys.
- A real npub, nsec, order id, or mailbox from a research session.
- Names of people, phone numbers, or license plates.

Logs and HAR files are how a card number leaks. They are gitignored.
`git add -f` on one of them must still fail the pre-commit hook.

Before a public push:

1. `sh scripts/install-hooks.sh` once per clone. (`npm install` builds
   `dist/` via `prepare` — it does not install hooks; that stays manual.)
2. Commit with `sh scripts/git-commit.sh`, not bare `git commit`.
3. `node scripts/leak-scan.mjs . --history` — must print 0 findings.
4. Do not put a tool in this repo that returns a card number.

Payment stops at the hosted card page. The person types their own card.
CI rejects a push that fails the scan.

## Operator directives (2026-10-03, live demo)

- **No Mollie in this stack.** No Mollie integration, credential, SDK, or
  named dependency exists anywhere we run. If a venue checkout page must
  be completed for a live order, the bridge's automation treats it as an
  opaque hosted page and finishes it headlessly (see the numo-pos bridge
  RUNBOOK). This SDK never opens, drives, or knows about that page.
- **Live orders run with no human in the loop** (bridge only, venue
  8613S3X only, per-order and daily caps enforced). 3DS frictionless flow
  auto-proceeds; a challenge page fails the order closed — funds remain
  on the card, no human is summoned.
- **Operator directive 2026-10-04 (supersedes blanket live-fire):** no
  live venue orders without EXPLICIT operator permission per order.
  Automated live ordering stays armed but gated; tests and demos run in
  demo/sim mode. The Sunmi POS is gone — numo testing happens on the
  ai-legion emulator (AVD numo-bm) or via the spike web UI (:3100).
- The charter above still governs THIS repository: the jamezz SDK stays
  card-free. Everything past the hosted page is the bridge's concern.

## 2fiat API rules (binding — violation gets IPs blocked)

The rig's IP was **permanently blocked** by 2fiat on 2026-10-03 after an
agent ran automated endpoint enumeration against their API (probing 30+
undocumented paths for card-reveal functionality). This section exists so
it never happens again.

**The ONLY 2fiat API calls we ever make:**

| Call | Endpoint | Purpose |
|---|---|---|
| Card balance | `GET /api/v1/cards` | Check if the card can cover an order |
| Create top-up | `POST /api/v1/prepaid-cards/topup/{cardId}` | Get a Lightning invoice for the customer |
| Invoice status | `GET /invoice/status?invoiceId=…&paymentMethodId=BTC-LN` | Poll until paid |

**NEVER do against 2fiat:**

- **No endpoint scanning or enumeration.** Do not probe paths that aren't
  listed above. Do not try variations, alternate spellings, or undocumented
  routes. If an endpoint isn't in the table, it doesn't exist for us.
- **No card-reveal attempts.** Do not try to programmatically extract PAN,
  CVV, or expiry from the API. Card details come from the operator via a
  0600 env file — never from the API. The API masks card numbers by design;
  fighting that design looks like card fraud and gets IPs blocked.
- **No rapid-fire requests.** Space all calls at least 2 seconds apart.
  2fiat is a financial service with fraud detection; rapid automated
  requests pattern-match to attacks.
- **No multiple token types on the same endpoint.** Use the wallet token
  only. Do not test whether other tokens work.
- **No undocumented API discovery.** If you need something the three
  endpoints above don't provide, ask the operator to contact 2fiat support.
  Do not try to find it yourself.

**What we DON'T need from 2fiat:** card details. The Playwright completer
reads card details from the env file at runtime (memory-only) and fills
the venue checkout page directly. 2fiat never sees the checkout — they
only fund the card via Lightning.
