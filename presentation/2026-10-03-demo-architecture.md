# Demo architecture — 2026-10-03 (as deployed)

Working doc. Describes what is actually running right now, why, and where
it goes after the hackathon.

## The pieces

| Piece | What it is | Where it runs |
|---|---|---|
| **numo app** (fork @85da0196, English) | Alice's terminal / merchant POS: provider toggle, menu sync, charge, invoice QR, order number, (landing: receipt print) | **Sunmi V2s** (primary, Android 11) · Pixel 10 (secondary) · emulator (rehearsal) |
| **bridge** (numo-pos/bridge) | The whole brain: `/provider/menu`, `/provider/orders` (402 → bolt11), mode system (`GET/POST /mode`), orders ledger `bridge-data/orders.jsonl` | **ai-legion** (20-core Linux box, 192.168.13.208 behind an openwrt router), node process on `127.0.0.1:8787` |
| **Demo payment leg** | testnut mint quote — a real invoice that auto-settles in ~3s; nobody pays anything | testnut (external, free) |
| **Live payment leg** (landing) | 2fiat top-up bolt11 → funds the card → bridge submits at the venue → operator completes Mollie checkout (human gate) | 2fiat (creds staged at `numo-pos/ops/2fiat.env`, never committed) |
| **cloudflared quick tunnel** | Public HTTPS front door to the localhost bridge | ai-legion, outbound-only |
| **Gateway** | api.cashu.exchange (demo tier) — separate DropShop surface | Cloudflare (deployed) |

## Why the "cloudflare thing"? (the direct answer)

**Yes — it's because the bridge runs on a remote box (a VPS-style
workstation), not on the phone or in this room.** The bridge binds
`127.0.0.1:8787` on ai-legion, which sits on a different network
(192.168.13.x behind a router) than the demo devices (guest Wi-Fi, LTE).
Devices cannot address it directly, so we tested the alternatives:

| Option | Verdict |
|---|---|
| `adb reverse` + SSH tunnel | Works, but per-device USB, laptop becomes a SPOF, audience phones can't use it |
| Port-forward on the router | Needs router admin, exposes the box, fragile |
| **Deploy bridge to Cloudflare Workers** | The *right* endgame — burger-402 was literally designed as a CF Worker (KV, no-auth, 402) — but the current bridge (provider rail, modes, fixtures) is a node service; porting + wrangler auth = hours we don't have today |
| **cloudflared quick tunnel** ✅ | Zero config, outbound-only (no open ports), public HTTPS in ~10s, kill switch = kill the process. The box already runs a named CF Zero-Trust tunnel for other services, so the pattern fit the infra |

So the tunnel is the **temporary public ingress** for a bridge that
"lives" on ai-legion. Post-hackathon: port the provider rail into the
burger-402 worker and deploy it properly — then "our Cloudflare server"
IS the bridge and the tunnel disappears.

## Data flow (demo mode, as verified on the Sunmi today)

```
Sunmi/Pixel (Wi-Fi/LTE)
   │  HTTPS  https://…trycloudflare.com
   ▼
Cloudflare edge ──► cloudflared (outbound, ai-legion)
                        │
                        ▼
              bridge  127.0.0.1:8787
              mode=demo (boot default)
                        │
        ┌───────────────┼─────────────────┐
        ▼ demo          ▼ live (8613S3X only)
   testnut quote    2fiat top-up bolt11
   auto-settle ~3s  → card funded → submit
        │                → Mollie (human gate)
        ▼                ▼
   SIM order number  REAL venue order id
        └───────► back to the device ──────┘
                  (+ receipt print on Sunmi — landing)
```

## Mode system (the one control)

- `GET /mode` → `{"mode":"demo","realOrderVenues":["8613S3X"]}`
- `POST /mode {"mode":"live"|"demo"}` — runtime switch, persisted
  (`bridge-data/mode.json`), boot default **demo**
- App's "Demo mode (off = LIVE)" switch **mirrors** it — note the
  semantics: **switch checked = LIVE**, unchecked = demo. One tap flips
  both sides.
- Live allows real orders **only to 8613S3X**; anything else →
  `422 venue_not_live`.
- Demo is enforced in code: fixture menu swap, submit hard-refused,
  blocked-calls counter on the dashboard.

## Target: the bridge ON Cloudflare, card on file end-to-end

Today the bridge is a node service on ai-legion behind a tunnel. The
endgame (burger-402's native shape) makes Cloudflare the actual home:

1. **Port the provider rail + mode system into the burger-402 worker**
   (it already has: 402 flow, TwoFiat client, JamezzOrderDriver, KV
   orders, no-auth-by-design). The wrangler.jsonc KV binding
   (`ORDERS`, id `f8ac885c…`) already exists — a namespace was created
   once, so CF account access exists somewhere on the team.
2. **Secrets, not cards:** `wrangler secret put TWOFIAT_WALLET_TOKEN` /
   `TWOFIAT_CARD_ID`. The PAN never enters Cloudflare — the charter
   ("no card numbers anywhere, the person types their own card") holds.
   The card itself stays at 2fiat; the Worker holds only the ability to
   top it up.
3. **Stable URL:** a Workers route on a zone we already run
   (`api.cashu.exchange` is already on CF) — kills the ephemeral-tunnel
   QR problem for good.
4. **The completion leg:** the worker calls the completer (a browser
   runner on a VPS — Workers cannot run Chromium) for the venue's
   hosted checkout page; the card itself stays at 2fiat and on-file
   never happens at the venue (disproven) — automation completes it
   every time, memory-only.
5. **Order of operations:** finish the node-bridge 2fiat leg first (in
   flight), verify live once at Mehringdamm, THEN port to the Worker.
   Never deploy an unverified payment path straight to Cloudflare.

Migration checklist: port provider rail → deploy worker (secrets via
wrangler, never in repo) → point a stable route at it → switch the app's
Bridge address → re-run preflight against the worker → keep the ai-legion
bridge as cold fallback → delete the tunnel.

## Live orders — endpoints and automation (operator directive: no human in the loop)

Every endpoint below places REAL orders when the bridge is in live mode.
Allowlist: 8613S3X only. Caps: MAX_ORDER_EUR per order + a daily live-order
counter on the dashboard (automation without rate limits buys 40 burgers).

| Surface | How |
|---|---|
| **Sunmi / numo app** | Bridge settings → LIVE (switch checked) → sync → charge. Real invoice (2fiat top-up) → paid → auto-submit → real order number + receipt |
| **API** | `POST /provider/orders` (SKUs + table) → bolt11 → pay → `GET /provider/orders/{id}` until `submitted` → venue order id. Same via the 402 REST shape |
| **MCP** | `orders.place` tool wrapping the bridge — QUEUED (needs a stable bridge URL first; ephemeral tunnel + MCP config don't mix) |
| **Chat** | mcp-oda chat surface exists but is unverified for ordering — not promised today |

The completion leg (what removes the human) — operator directive
2026-10-03: **no Mollie in our stack, no human in the loop**:

1. ~~Saved card at the venue~~ — **disproven by live test**: the venue's
   hosted checkout is a fresh session every time; no memory, no
   auto-charge, no tokenization.
2. **The completer (only path):** a post-funded watchdog on the rig
   launches headless Chromium, opens the venue checkout URL — **an
   opaque hosted page to our stack; no Mollie API, credential, SDK, or
   named dependency exists anywhere we run** — fetches card details
   from the 2fiat API **into memory only**, fills and submits.
   Frictionless 3DS auto-proceeds; a 3DS challenge **fails the order
   closed** (funds remain on the card, dashboard flag, no human
   summoned).

### Card-storage invariant (never varies, never on GitHub)

- Card number: **only at 2fiat** (issuer). Fetched just-in-time into
  process memory when automation must type it. Never disk, logs, repos.
- Stored credentials: 2fiat wallet token + card id — today a `0600` env
  file on the rig; after the Worker port, **Cloudflare Worker secrets**.
- The jamezz SDK stays card-free by charter; all of this lives in the
  bridge codebase.

## Ops facts

- Tunnel URL: `https://<ephemeral-tunnel>.trycloudflare.com (dead — killed at shutdown)`
  — **ephemeral**: a restart mints a NEW URL. If we put a QR on screen, it
  must be generated from the URL in effect at doors-time (or move to a
  named tunnel/domain before printing anything).
- Kill switch: `pkill -f "cloudflared tunnel.*8787"` on ai-legion — public
  surface gone, local rig unaffected.
- Venue hours (live window): Burgermeister Mehringdamm is open
  **Sun–Thu 11:00–02:00, Fri–Sat 11:00–04:00**; the live jamezz read
  reports `online: yes`. Late close = safe for an all-day demo.
- Evidence on the wire: Sunmi demo charges produced
  `SIM-PO-MUS97R7K-0003` and `SIM-PO-MUS9D9F0-0004` (676-sat fixture
  invoices, not app-local quotes).
