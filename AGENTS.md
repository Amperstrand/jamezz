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
