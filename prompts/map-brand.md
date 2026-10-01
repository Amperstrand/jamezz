---
description: Map a brand's public locations. Do not guess QR suffixes.
---

Map BRAND across the ordering surfaces you can verify.

## 1. Location list

Read the brand's public locations page. Keep name, address, and open or
coming-soon. That list is safe to commit.

## 2. Find real QR codes

Search the public web for `"qrv5.jamezz.app" BRAND` and `"jamezz.app/dl" BRAND`.
Also check the brand site, Instagram, and LinkedIn for a linked QR URL.

A mid is digits plus three letters. The digits are usually the sales-area
id and sometimes are not. Never invent the suffix.

Feed each found mid through `JamezzClient.venue` and `JamezzClient.menu`.

## 3. Other surfaces

- Webshop: record the public shop URL and platform name only.
- App: record the public store id. Do not capture an app session into git.
- Aggregators: record the public store URL if one is indexed. If a site
  blocks you, write "blocked" and stop. Do not route around it.

## 4. Commit

Update `src/venues.ts` and `docs/VENUES.md`. Unknown QR cells stay
`unknown`. Growth path is a visit or a photo, not a guess.
