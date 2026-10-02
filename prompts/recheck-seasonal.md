---
description: Recheck a seasonally-closed QR mid and onboard it when it wakes up.
---

Recheck these mids: INPUT (a mid from docs/CANDIDATES.md "pending seasonal
activation", or any mid that previously resolved with an empty menu).

## 1. Read, don't assume

```sh
node dist/cli.js venue <mid>   # null = platform answered, venue absent right now
node dist/cli.js menu <mid>    # null = same; a thrown network error is different
```

Error semantics decide everything:

- Thrown `JamezzError` (reason `"network"`) → platform unreachable; retry later.
- `null` → the platform answered and the venue/menu is absent: still
  seasonal/deactivated. Stop here; recheck next quarter.
- A real menu → continue.

Remember the session quirk: an empty menu on a reused session is a delta,
not a closed venue. The CLI's client re-bootstraps, but if you read through
another tool and see `[]`, retry once with a fresh session before
concluding anything.

## 2. When the menu is back

Follow `prompts/onboard-table.md` from step 1: record name, currency, pay
provider, and one on-screen price. A catalog row in `src/venues.ts` needs
all three verified live — never add a row from the resolving redirect alone.

## 3. What to commit

- Verified: the row in `src/venues.ts`, a line in `docs/VENUES.md`, and move
  the mid out of the CANDIDATES pending table.
- Still dead: nothing — the CANDIDATES table already carries the provenance.
  Update the "Status" column date if a quarter has passed.

Do not commit order ids, cookies, or session dumps from the reads.
