# Finding more venues: Berlin, Germany, anywhere

Jamezz is bigger than one burger stand: the platform reports 2,000+ live
locations in 25+ countries with main markets in the Netherlands, Germany,
Belgium, and the UK, and it integrates German POS systems (Gastrofix,
Vectron, Oracle MICROS). One client covers all of them — a venue is just a
QR mid. PSP varies per venue (Mollie / CM (Lightspeed) / Adyen have all
been seen); the order flow is the same.

## How to find a venue (no API exists for this)

1. **Photograph the table QR.** Any Jamezz venue resolves to
   `https://jamezz.app/dl/{mid}`. This is the only guaranteed method.
2. **Search the indexed QR pages.** Google indexes `qrv5.jamezz.app/v5/qr/…`
   menu pages. Worked queries: `site:qrv5.jamezz.app <brand or dish>`,
   `"jamezz.app/dl" <city>`. This method is proven: three of the four
   cataloged tables were found this way (see docs/VENUES.md) — Van der
   Valk hotels publish their QR pages and Google indexes them.
3. **Brand sites and socials.** Venues link their QR URL from their own
   website, Instagram bio, or even their LinkedIn homepage.
4. **Named Jamezz chains** (from Jamezz's own marketing, mostly NL for now):
   De Beren, La Place, van der Valk hotels. German hotel and stadium
   restaurants are the likeliest Berlin-area candidates.

A mid looks like `{digits}{3 chars}`. The digit prefix is USUALLY the
salesarea id and sometimes is not (van der Valk `4577SVC` → salesarea 5570).
Never derive ids from mids; always read `salesarea-fetch`.

## Berlin candidates to check (unverified)

These are plausible, not confirmed — verify before adding:

- Burgermeister's other 17 locations ([docs/VENUES.md](VENUES.md)) — each
  needs its own table photo; the Uber Arena branch is the most likely to
  have QR ordering.
- Hotel restaurants and stadium/arena concessions (Jamezz's stated
  strengths; Uber Arena, Olympiastadion area).
- Burger chains with table service: Jim Block, Burgeramt, Berlin Burger
  International — check for QR table tents.
- Anything whose QR resolves to `qrv5.jamezz.app` — then it is done.

## Other table-QR platforms (same method, different endpoints)

The private corpus fingerprinted these; each needs its own fake + tests
(`prompts/onboard-new-platform.md`, `prompts/write-tests.md`):

| Platform | Hallmark |
|---|---|
| jamezz | `qrv5.jamezz.app`, Laravel session + `session-mid` header, Mollie/Adyen/CM |
| gastronovi | `services.gastronovi.com`, self-ordering widget behind a one-time ALTCHA proof-of-work; menu JSON cookieless after the PoW; Stripe/Adyen/PayPal + GN card; dead units still serve challenges — challenge ≠ liveness |
| ordermonkey | `app.ordermonkey.com` (Selise, Angular), plain 4-header curl menu API, no PoW/login; keys baked into public bundle; CHF, SIX/Adyen/TWINT; org+branch UUID pair in the URL |
| favrit | favrit.app ordering, Norwegian-origin, now wider |
| tebi | tebi ordering pages |
| ninito | Firestore websockets (no plain JSON) |
| heywaitr | heywaitr QR links |
| nordpay | nordpay checkout |

Aggregators (Wolt, Lieferando, Uber Eats) are out of scope: Lieferando
actively blocks programmatic access; the others are their own closed apps.

## Adding what you find

1. `prompts/onboard-table.md` if it is Jamezz.
2. `prompts/onboard-new-platform.md` if it is a new platform.
3. A row in `src/venues.ts` only after the QR was read off a real table.
4. Tests via `prompts/write-tests.md` — synthetic fixtures only.
