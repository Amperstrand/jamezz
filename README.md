# jamezz

Client and field notes for [Jamezz](https://qrv5.jamezz.app) table ordering.

This module is part of **DropShop** (working title) — one 402-gated order
API for anything, live at <https://api.cashu.exchange> (demo tier). See
[Amperstrand/mcp-oda](https://github.com/Amperstrand/mcp-oda) for the unified
gateway; this package is the Jamezz venue adapter it consumes.
Burgermeister Mehringdamm table 1 (`8613S3X`) is the worked example, verified
2026-09-30.

This project can read a menu and prepare a guest order. Paying is a hosted
Mollie page. You type your own card there. This repository has no card
numbers, no session cookies, and no private keys.

```ts
import { burgermeisterTable, JamezzClient } from "jamezz";

const client = new JamezzClient();
const menu = await client.menu(burgermeisterTable());
```

Install (published decision pending — git install is the supported path):

```sh
npm install github:Amperstrand/jamezz
```

Read-only CLI (no order command on purpose — the payment boundary stays
with the caller):

```sh
npx jamezz tables
npx jamezz venue 8613S3X
npx jamezz menu 8613S3X
```

Error semantics: a thrown `JamezzError` (reason `"network"`) means the
platform was unreachable; a `null` return always means the platform
answered and the thing is absent. `submit()` no longer needs a cookie —
the client owns its session and re-bootstraps on a delta-empty menu.

Start here to place an order end to end with your own card:
[docs/PARTICIPANT-GUIDE.md](docs/PARTICIPANT-GUIDE.md).
Ordering details: [docs/ORDERING.md](docs/ORDERING.md).
The adapter boundary and attestation passthrough (issue #7):
[docs/ADAPTER-BOUNDARY.md](docs/ADAPTER-BOUNDARY.md).
More venues in Berlin and Germany: [docs/CANDIDATES.md](docs/CANDIDATES.md).
How the method was found, and the prompts to repeat it: [docs/HOW.md](docs/HOW.md).
Locations: [docs/VENUES.md](docs/VENUES.md).
Prompts (onboarding a table, a new platform, mapping a brand, cheapest test
order, writing the tests): [prompts/](prompts/).

The catalog carries 75 live-verified tables across multiple chains. Requires Node.js 22. `npm test` runs against synthetic payloads only.

Part of the [mcp.cashu.exchange](https://github.com/Amperstrand/mcp-cashu-exchange)
architecture — the full system diagram lives in that repo's README.
