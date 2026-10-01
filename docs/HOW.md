# How this was done

Hackathon notes from 2026-09-30, rewritten so they can sit in a public
repo. The original prompts are below. The private kit they pointed at is
not.

## Original prompts

These are the user messages that started the work. Names of collaborators
and machine paths are removed.

1. Hackathon goal: bring mcp.cashu.exchange to life in Berlin. Find existing
   projects related to food and EV charging. Publish something. Clean up
   personal data first.
2. What is realistic in 4–6 hours? A chatbot or a map, plus one Berlin
   service a person can pay for. Payment should be a card the person holds.
3. Make it modular. Existing repos are a mess because they contain personal
   data. A new public repository should hold chatbot, map, and payment
   pieces without that data.
4. Build the public scaffold. Continuous deployment is fine. Secrets stay
   in the host's secret store, not in git.
5. Later: improve the prompts used to onboard a venue.
6. Burgermeister is mostly done. Export it as a module in its own public
   GitHub project.

The private follow-up prompts said: onboard a QR link, create an account,
drive checkout until the payment page, and write a playbook. Those steps
are `prompts/onboard-table.md`, `prompts/map-brand.md`, and
`prompts/cheapest-order.md`. They used to tell an agent to save a HAR file
and to reuse one shared mailbox. Both of those instructions are dropped.

## What actually worked

1. A table QR redirects to `qrv5.jamezz.app/v5/qr/{mid}`.
2. One GET of that page sets a session cookie. A second GET,
   `data-fetch-v2` with the `session-mid` header, returns the menu once.
   Calling it again on the same session returns an empty delta.
3. The cart contents live in the browser. `POST /v5_2/shopping-cart` only
   mints a uuid.
4. `POST /v5_2/kiosk/order` creates an order and redirects to a Mollie card
   page. `payDirect=1` means the kitchen does not see an unpaid order.
5. Loyalty is an email plus a 6-digit code. The first send after signup can
   return 200 and never arrive. Send it again.
6. A cashu.email address is a Nostr key. Receiving is free. The steps are
   public at <https://cashu.email/llms.txt>. Each person creates their own.

## What stays out of git

HAR files, raw captures, screenshots of a payment page, cookies, order ids,
card numbers, and secret keys. A menu snapshot is allowed only if it is
synthetic. A real menu is fetched at runtime.

## Where the pieces live

| Piece | Repo |
|---|---|
| This client, these prompts, Burgermeister table notes | [Amperstrand/jamezz](https://github.com/Amperstrand/jamezz) |
| Exchange scaffold: registry, map, chat, payment-rail interface | [Amperstrand/mcp-cashu-exchange](https://github.com/Amperstrand/mcp-cashu-exchange) |
| Mailbox API | <https://cashu.email/llms.txt> |

The exchange stays generic. A venue plugin should depend on this package,
not copy the HTTP calls. Card credentials, if a deployment has them, belong
in the host secret store and behind an explicit expose flag. They do not
belong in either public repo.

## Next modular cut

The client is one module. The prompts are a second. A third would be a
venue catalog file that another brand can append to without editing
`client.ts`. `src/venues.ts` is that file. Payment is not a module here:
Mollie already is the payment module, and the handoff is a URL.
