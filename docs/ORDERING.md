# Order from Burgermeister with your own card

This repository is the public handoff. It contains the API map, the
Burgermeister table that was verified on 2026-09-30, and a client that
prepares an order. It does not contain a card, a session cookie, a Nostr
secret, or a captured order.

Payment is a hosted Mollie page. A person opens that page and types their
own card. Do not put a card number in code, in a prompt, or in this repo.

## What you need

- Node.js 22 or newer.
- A table QR. The only mapped Burgermeister QR is Mehringdamm table 1:
  `8613S3X` (`https://jamezz.app/dl/8613S3X`). Other Burgermeister locations
  are listed in `docs/VENUES.md`. Their QR suffixes are not guessable.
- An email inbox you control. `cashu.email` is the documented free option.
- A card you are willing to charge. The cheapest standalone item seen on
  2026-09-30 was a €3.10 drink. An unpaid order expires and does not reach
  the kitchen (`payDirect=1`).

## 1. Create your own cashu.email address

Spec, copied here so this repo stands alone:
<https://cashu.email/llms.txt> and <https://cashu.email/llms-full.txt>.
`cashu.email` and `nomail.name` are the same API.

Receiving is free. Your address is `npub1...@cashu.email`, created on first
login. No SMTP account and no API key.

1. Generate a secp256k1 keypair (NIP-01 / NIP-19). `nostr-tools` does this:
   `generateSecretKey`, `getPublicKey`, `npubEncode`.
2. `POST https://cashu.email/api/auth/challenge` → `{ nonce }`.
3. Sign a kind-1 event whose content is the nonce and whose tags are
   `[["challenge", nonce]]`.
4. `POST https://cashu.email/api/auth/verify` with `{ event }`. The response
   sets `__Host-session`. Store that cookie and the secret key in a `0600`
   file outside git.
5. Your address is the npub plus `@cashu.email`. Confirm with
   `GET /api/auth/me` using the cookie.

Sending mail costs 100 sats. You do not need to send mail to receive a
login code. A test mint (`https://testnut.cashu.space`) exists for postage
experiments; it is not required for this order.

Read `X-Reason` and `X-Hint` on every 4xx. Cloudflare rejects a bare
`Python-urllib` user agent before auth runs, so send a named client
user agent.

`openCashuEmailAccount()` in this package performs steps 2–4 once you pass
a signer. It does not generate keys itself, so this package does not depend
on a crypto library.

## 2. Read the menu

All calls are same-origin on `https://qrv5.jamezz.app`.

| Call | Auth | What it returns |
|---|---|---|
| `GET /v5/qr/{mid}` | none | HTML. Seeds the Laravel session cookie. Required before the menu call. |
| `GET /v5_2/qr/salesarea-fetch?session_mid={mid}&session_return_path=...` | none | Venue name, currency, PSP, online flag. |
| `GET /v5_2/qr/data-fetch-v2` | cookie + `session-mid` header | Full menu, once per fresh session. |

Headers on data calls: `session-mid`, `session-return-path`
(`https://qrv5.jamezz.app/v5/qr/{mid}/return`), `session-locale: en`.

`data-fetch-v2` is a session delta. An empty payload means that session
already received the snapshot. Start a new cookie with another
`GET /v5/qr/{mid}`.

Join the menu like this:

- categories are `menukaarts` (string ids)
- links are `menukaart_products` (numeric ids — stringify them)
- products are `products` (string ids)
- skip `blocked` categories and `showInCategoryMenu: 0`
- English names live in `translations` JSON under `en.naam`
- a product with `price: 0` is often a size parent; the priced child is a
  separate row named `{parent} 0,2l`

```ts
import { burgermeisterTable, JamezzClient } from "jamezz";

const client = new JamezzClient();
const menu = await client.menu(burgermeisterTable());
```

## 3. Build the order

Verified guest checkout on 2026-09-30, Mehringdamm:

1. Pick a product. Options (extras, removals) are separate product ids.
2. `POST /v5_2/shopping-cart` as multipart with `session_mid` and
   `session_return_path`. The response uuid is the cart id. The cart
   contents themselves are client-side (`isServerShoppingCartEnabled: false`).
3. `POST /v5_2/kiosk/order` as JSON. Required fields that were present on
   the verified request:
   - `items[]` with `count`, `article.id`, `article.name`, `article.price`
   - `orderCustomFields.OrderMode.value`: `1` eat-in, `2` take-away
   - `orderCustomFields.email.value`: your cashu.email address
   - `shoppingCart.totalAmount`
   - `payMethod: "creditcard"`, `payProvider: "MOLLIE"`
   - `session_mid`, `session_return_path`, `returnUrl`
   - `shopping_cart_uuid` / `unique_shopping_cart_uuid`
4. The response redirects to
   `https://www.mollie.com/checkout/credit-card/session/{id}`.
5. Open that URL yourself. Card, Apple Pay, and Google Pay are entered
   there. This client must not see the card.
6. `GET /v5_2/kiosk/order/{id}` reports `payStatus` and `apiStatus`.
   While unpaid both stay `0`, and the kitchen is not fired.

`client.prepare(...)` builds that JSON. `client.submit(prepared)` posts it
and returns the checkout URL — the client owns its session cookie, so no
cookie handling is needed (one can still be passed explicitly). If the URL
is missing, stop and read the response. A `JamezzError` (reason `"network"`)
means the platform was unreachable; a null return means it answered.

Terms shown by the venue: `https://www.jamezz.nl/pdf/av.pdf` and
`https://www.jamezz.nl/pdf/pv.pdf`.

## 4. Loyalty, optional

Burgermeister loyalty is Piggy ("Burger Card"), keyed by email, not by a
password. It is not required to pay.

- `POST /v5_2/piggy/contact-create` with `{ contact_email, contact_attributes }`
- The venue UI omits `contact_attributes` and gets HTTP 400
  "Undefined array key". The contact is still created. A second call returns
  Piggy 60005 "already exists". Treat that 400 as created, then continue.
- `POST /v5_2/piggy/contact-send-mail` with `{ contact_email }`
- The first send after creation can return 200 and never arrive. Send once
  more, then poll the inbox every 20 seconds.
- The message subject is "Login Code". The code is the 6-digit number in
  the body. `loginCodeFromText()` extracts it.
- `POST /v5_2/piggy/contact-verify-code` with the code.
- Inbox list is metadata only. The body is
  `GET https://cashu.email/api/messages/:id`. For the encrypted raw blob,
  follow the decrypt section of `llms-full.txt`. The list snippet is enough
  when it already contains the 6 digits.

Do not reuse anyone else's email, npub, or Piggy contact.

## 5. Prompt for the next person

Paste this as the whole task:

> Use the jamezz repository. Create a new cashu.email account with the flow
> in docs/ORDERING.md (your own key, 0600 file, never commit it). Read the
> Burgermeister Mehringdamm menu for table 8613S3X. Prepare the cheapest
> available item as eat-in, using that new email. Submit the order only if
> I confirm the total. Stop at the Mollie URL and give it to me. I will
> type my own card. Do not store a card number, do not reuse an identity
> from another session, and do not guess QR codes for other locations.

## What was left out on purpose

Captured HAR files, raw menu dumps, order ids, Mollie session ids, Piggy
contact ids, and the npub used during research. Those stay in the private
kit. The shapes above are enough to repeat the flow with a fresh account.
