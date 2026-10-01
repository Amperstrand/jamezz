# Burgermeister locations

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
