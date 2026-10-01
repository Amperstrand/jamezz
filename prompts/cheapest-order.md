---
description: Find the cheapest legitimate test order. Do not pay.
---

Find the cheapest real order at VENUE (QR mid or `JamezzClient` venue id).

## 1. Price floor

Read the menu. A standalone item is one the venue lists as its own row.
An option that is cheaper still needs a parent product. Do not build an
order that the menu UI cannot build.

Check `minOrderValue` from `client.venue` before calling a single cheap
item a valid cart.

## 2. Report, do not pay

- Cheapest standalone item: name, price, currency.
- Payment methods the venue config names. This Burgermeister table is
  Mollie card.
- Free pipe check: prepare the order, submit, abandon the Mollie page.
  That checks order creation only. It does not check that a card payment
  succeeds.
- Loyalty welcome credit, if the venue shows a program. Use your own
  cashu.email address. See `docs/ORDERING.md`.

Never change a client-side price to see if the server accepts it.
Never type a card number into the agent.
