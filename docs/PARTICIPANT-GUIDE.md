# Participant guide: order a burger E2E with your own card

You need: Node 22+, a table QR (or use the read-only demo table below), an
inbox, and a card you are willing to charge a few euros on. Nothing here
needs our help — everything you run is in this repo.

Time: about 30 minutes, most of it waiting for mail.

## 1. Your own inbox (free, no signup)

Create a cashu.email address — a Nostr key IS the account. Full steps in
[docs/ORDERING.md](ORDERING.md) §1 and the public spec at
<https://cashu.email/llms.txt>. Keep the secret key in a `0600` file outside
git. Receiving is free; you never need to send mail.

## 2. Read a real menu (free, no order)

Library:

```ts
import { burgermeisterTable, JamezzClient } from "jamezz";
const menu = await new JamezzClient().menu(burgermeisterTable());
```

Or the read-only CLI:

```sh
npx jamezz menu 8613S3X
```

Table `8613S3X` is Burgermeister Mehringdamm (Berlin). Verified read path,
no order placed. If you are at any other Jamezz venue, photograph its table
QR and use that mid instead — see [docs/CANDIDATES.md](CANDIDATES.md).

## 3. Prepare and submit an order

Cheapest standalone item seen at Mehringdamm: a €3.10 drink. Build the order
with your cashu.email address, confirm the total yourself, submit, and you
get back a hosted Mollie checkout URL. Steps and code: [docs/ORDERING.md](ORDERING.md) §3.

## 4. Pay with your own card

Open the Mollie URL in your browser and pay with:

- **your personal card**, or
- **your own 2fiat card** — a virtual prepaid Mastercard you buy at
  <https://2fiat.com> with Bitcoin, Monero, or Lightning (no account/KYC;
  roughly $30 issuance incl. $20 balance, ~6% top-up, ~$0.80 per
  authorization, ~2.5% on non-USD purchases, 1-year life; Apple/Google Pay
  work). Fund it lightly — a burger and a drink is enough.

Card details go only into the merchant's hosted payment page. Never into a
prompt, a repo, a script argument, or a hosted worker. 3DS / OTP codes are
yours to answer. Unpaid orders simply expire — the kitchen is not fired
until payment lands (`payDirect=1`).

## 5. Watch the order

`GET /v5_2/kiosk/order/{id}` (via the client) shows `payStatus` and the
pickup number once paid.

## Rules that keep this publishable

- No card numbers, cookies, HAR files, or screenshots of checkout pages in
  commits — the pre-commit gate and CI enforce it.
- Use your own freshly created identity. Never reuse someone else's.
- Stop at the hosted checkout. No price tampering, no hidden-item orders.
