---
description: Onboard one table QR into this repo. Stop at the card page.
---

Onboard this table: INPUT (QR link, mid, or venue name).

## 1. Identify

Open `https://jamezz.app/dl/{code}` and note the redirect to
`qrv5.jamezz.app/v5/qr/{mid}`.

```ts
const client = new JamezzClient();
const venue = await client.venue(tableMid(mid));
const menu = await client.menu(tableMid(mid));
```

Record name, currency, pay provider, and one item whose price matches the
on-screen price. If `menu()` returns null, start a fresh session and call
it again. An empty menu on a reused session is a delta, not a closed venue.

## 2. Your own inbox

Create a new cashu.email account. Steps are in `docs/ORDERING.md`.
Store the secret key in a `0600` file outside this repo. Never paste it
into a prompt, a commit, or a log.

Use that address as the checkout email. Do not reuse an address from
another session.

## 3. Order to the card page

Pick the cheapest item that the menu shows as its own row. Do not order a
hidden add-on by itself.

```ts
const cartUuid = await client.openCart(table);
const prepared = client.prepare({
  table,
  lines: [{ productId, name, unitPrice, quantity: 1, optionProductIds: [] }],
  fulfillment: "eat-in",
  email,
  cartUuid,
  currency: venue.currency,
});
```

Show the total. Submit only after a person confirms it. `submit()` returns
a Mollie URL. Stop. The person types their own card.

Confirm an abandoned order stays unpaid. Do not complete payment while
onboarding.

## 4. What to commit

- A row in `src/venues.ts` if the QR was read off a table.
- A short note in `docs/VENUES.md`: mid, name, currency, PSP, one price check.
- A new file under `prompts/` only if the platform is not Jamezz.

Do not commit HAR files, screenshots of a checkout page, cookies, order
ids, or keys.
