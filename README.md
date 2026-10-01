# jamezz

Client and field notes for [Jamezz](https://qrv5.jamezz.app) table ordering.
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

Start here to place an order end to end with your own card:
[docs/PARTICIPANT-GUIDE.md](docs/PARTICIPANT-GUIDE.md).
Ordering details: [docs/ORDERING.md](docs/ORDERING.md).
More venues in Berlin and Germany: [docs/CANDIDATES.md](docs/CANDIDATES.md).
How the method was found, and the prompts to repeat it: [docs/HOW.md](docs/HOW.md).
Locations: [docs/VENUES.md](docs/VENUES.md).
Prompts (onboarding a table, a new platform, mapping a brand, cheapest test
order, writing the tests): [prompts/](prompts/).

Requires Node.js 22. `npm test` runs against synthetic payloads only.
