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

Start here if you want to place an order: [docs/ORDERING.md](docs/ORDERING.md).
Locations: [docs/VENUES.md](docs/VENUES.md).

Requires Node.js 22. `npm test` runs against synthetic payloads only.
