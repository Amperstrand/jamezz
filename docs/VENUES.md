# Venues

## Mapped Jamezz tables (live-verified)

| Table mid | Venue | Address | Checkout |
|---|---|---|---|
| `8613S3X` | Burgermeister Mehringdamm (Tafel 1) | Mehringdamm 39, 10961 Berlin | MOLLIE |
| `8329DHW` | Van der Valk Gent — Limoncello Take Away | Akkerhage 10, 9000 Gent, BE | ADYEN |
| `5960PM3` | Van der Valk Gent — Roomservice Cocotte | Akkerhage 10, 9000 Gent, BE | ADYEN (room charge) |
| `4577SVC` | van der Valk Gilze-Tilburg — Toekan To Go | Gilze-Tilburg, NL | ADYEN |
| `6442UFX` | Summio Parc Heihaas — Webshop Snackbar | Voorthuizerstraat 75, 3881 SE Putten, NL | MOLLIE |
| `7540MAK` | Jumbo Koornneef Monster — Webshop | Monster, Zuid-Holland, NL | MOLLIE |
| `8114MKM` | Søgaard Bryghus takeaway | C.W. Obels Plads 1, 9000 Aalborg, DK | MOLLIE (DKK) |
| `6399J53` | Jumbo Foodmarkt Koornneef Westland (Naaldwijk) — Webshop | Naaldwijk, Zuid-Holland, NL | MOLLIE |
| `8325JY4` | Dickenz — Webshop (QR Design) | Scharendijke, Zeeland, NL | MOLLIE |
| `7541HE2` | Jumbo Koornneef Aan de Haven (Scheveningen) — Webshop | Scheveningen, Den Haag, NL | MOLLIE |
| `7991NQZ` | PAPAVESS — Webshop | Mannenberg 228, 3270 Scherpenheuvel, BE | MOLLIE |
| `84608JJ` | Omami Ulricehamn — Webshop (Leading) | Ulricehamn, SE | MOLLIE (SEK) |
| `487MVV` | Anne&Max Utrecht Domkwartier — Afhalen V5 | Utrecht Domkwartier, NL | MOLLIE |
| `489URT` | Anne&Max Leidschendam — Webshop afhalen | Liguster 62, 2262 Leidschendam, NL | MOLLIE |

`8613S3X` was photographed; the other thirteen mids are venue-published
(Google-indexed QR pages under `qrv5.jamezz.app/v5/qr/…` and
`jamezz.app/dl/…` redirects), each verified by a live read — venue name,
currency, and at least one real price — on 2026-10-02. The 2026-10-02
batch (jamezz#6) added ten venues across NL / BE / DK / SE and the first
DKK and SEK rows: Summio Parc Heihaas snackbar (Pizza Margherita
12.50 EUR), three Jumbo Koornneef webshops (Goat cheese salad 5.75 EUR /
Breakfast deal 3.99 EUR), Søgaard Bryghus Aalborg (Bun with butter
17.00 DKK), Dickenz Scharendijke (frappuccino 5.95 EUR), PAPAVESS
Scherpenheuvel (Poke Bowl Medium 12.50 EUR, matches the venue's own
menu PDF), Omami Ulricehamn (Sushi Pop California Roll 169.00 SEK), and
two Anne&Max branches (Pastrami Sandwich 12.50 EUR). `540BEQ`
("hello alpha", CHF, Stripe) is the platform's own demo surface —
documented here, deliberately not cataloged.

## Burgermeister locations

Source: burgermeister.com location list, captured 2026-09-30. Addresses are
public. A Jamezz QR mid is not. Only Mehringdamm table 1 is mapped.

| Location | Address | Jamezz QR |
|---|---|---|
| Schlesisches Tor | Oberbaumstraße 8, 10997 Berlin | unknown |
| Kottbusser Tor | Skalitzer Straße 136, 10999 Berlin | unknown |
| Bahnhof Zoo | Joachimsthaler Straße 1-4, 10623 Berlin | unknown |
| Eberswalder | Schönhauser Allee 45, 10435 Berlin | unknown |
| Konstanzer | Konstanzer Straße 1, 10707 Berlin | unknown |
| Alexanderplatz | Dircksenstraße 113, 10178 Berlin | unknown |
| Warschauer Straße | Warschauer Straße 65, 10243 Berlin | unknown |
| Mehringdamm | Mehringdamm 39, 10961 Berlin | `8613S3X` (table 1) |
| Schloßstraße | Schloßstraße 117, 12163 Berlin | unknown |
| Hermannplatz | Hasenheide 113, 10967 Berlin | unknown |
| Gropiusstadt | Johannisthaler Chaussee 317, 12351 Berlin | unknown |
| Leopoldplatz | Müllerstraße 28, 13353 Berlin | unknown |
| Akazienstraße | Grunewaldstraße 118, 10823 Berlin | unknown |
| Potsdamer Platz | Potsdamer Platz, 10785 Berlin | unknown |
| Zehlendorf Eiche | Berlin | unknown |
| Uber Arena | Berlin | unknown |
| Friedrichstraße | Friedrichstraße 141-142, 10117 Berlin | coming soon |
| Checkpoint Charlie | Berlin | coming soon |

Other ways to order, not implemented here:

- Shopify webshop: https://shop.burgermeister.com/ (not Jamezz)
- App id `com.burgermeisterapp` (store list not captured)
- Wolt, Lieferando, Uber Eats

A mid looks like digits plus three letters. The digit prefix is usually the
sales area id and sometimes is not. Always read `salesarea-fetch`. Do not
invent a suffix.

To add a table: photograph the QR, resolve `https://jamezz.app/dl/{mid}`,
and call `JamezzClient.menu`. Other Jamezz brands use the same API. Payment
provider varies by venue (Mollie, CM, Adyen were all seen). This Burgermeister
table is Mollie, card only.
