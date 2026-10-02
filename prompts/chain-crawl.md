---
description: Harvest a chain's per-location Jamezz mids from its own website.
---

Harvest this chain: INPUT (brand name or chain website).

## Why this method

Indexed-QR search finds one venue at a time. A chain site that embeds its
locations' webshop links yields dozens of mids in one fetch: on 2026-10-02,
`annemax.nl/vestigingen/` carried 36 Anne&Max mids and `omami.se` listed
all five Ômami webshops. Chains often run afhalen / bezorgen / catering as
separate mids per location — expect several per site.

## 1. Fetch and grep

```sh
curl -sL <chain site / locations page> | grep -oE 'jamezz\.app/dl/[A-Za-z0-9]+|qrv5\.jamezz\.app/v5/qr/[A-Za-z0-9]+' | sort -u
```

If nothing matches in HTML, look for a locations JSON (WordPress +
WooCommerce chain sites): try `/wp-json/`, sitemaps, and URL-decoded `\/`
inside inline scripts (`services[].url` is the Anne&Max shape).

## 2. Verify each mid read-only

```sh
node dist/cli.js venue <mid> && node dist/cli.js menu <mid>
```

A catalog row needs the live read: venue name, currency, and at least one
real price. Expect seasonal park/venue mids to resolve with empty menus —
park them in docs/CANDIDATES.md "pending seasonal activation" with the
source page, not in `src/venues.ts`.

## 3. Crawl politely

GET-only, ~1 request per 2 seconds, hard-stop on 403/429. A chain site
that gates ordering behind an app or bit.ly (Roompot, Landal, van der Valk
NL all do) is a dead end for this method — record the negative result once
and don't re-crawl.

## 4. What to commit

Verified rows in `src/venues.ts` + `docs/VENUES.md`; the negative-result
list (chains that are static-jamezz-free) belongs in docs/CANDIDATES.md so
nobody re-crawls them.
