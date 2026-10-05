# End-of-day state — 2026-10-03 (hackathon day)

Read this before touching anything. Companion docs in this folder:
`2026-10-03-demo-architecture.md` (how it works), `…-t-minus-2h-roadmap.md`
(what was planned), `…-4min-pitch.md` + `…-script.md` + `…-shotlist.md`
(the talk). Video pipeline: Amperstrand/test-video (private).

## What is live right now

| Thing | State | Where |
|---|---|---|
| Bridge (provider rail, mode system, 2fiat leg, completer, caps) | **LIVE mode** at shutdown time — flip to **demo** on shutdown | ai-legion, `127.0.0.1:8787`, repo `/root/src/numo-pos/bridge` @ 505f75d+ |
| Public tunnel | `https://<ephemeral-tunnel>.trycloudflare.com (dead — killed at shutdown)` — **ephemeral URL**; killed at shutdown | cloudflared on ai-legion (`pkill -f "cloudflared[ ]tunnel.*8787"`) |
| 2fiat egress tunnel | rig → laptop SOCKS `socks5h://127.0.0.1:1080` (the rig's direct IP is **permanently blocked** by 2fiat) — killed at shutdown | supervisor script `/tmp/opencode/tunnel-supervisor.sh` on the operator laptop |
| numo app (English, provider rail, print landing) | Installed: **Sunmi V2s** (primary), Pixel 10 (wallet created, URL not yet set) | APKs: ai-legion `/root/src/numo-pos/Numo/app/build/outputs/apk/debug/` |
| Sunmi demo flow | **Verified end-to-end twice** (fixture invoices, venue-format order ids) | — |
| Live flow | **Armed, never fired.** Coke staged: COCA-COLA 0.33L €2.86 SKU `4966532`. 3 live orders left today (UTC cap), €5 max | — |
| Top-up leg | **Proven with real money**: €1 invoice paid, card $0.38 → $1.38 | the burner card (id redacted) |
| MCP | `mcp.cashu.exchange/mcp` open (5 tools, search+quote only); `api.cashu.exchange/mcp` 401 | — |
| Video | iteration-004 rendered; pipeline zero-token | `/root/test-video` on ai-legion + local clone |

## Secrets — where they live (and nowhere else)

- 2fiat API creds + card details (`PAN/EXP/CVC`): `ops/2fiat.env` on
  ai-legion, mode 0600, gitignored. **Rotate this card after the event —
  the PAN transited a chat transcript today.**
- No card data in any repo, ever; leak gates green (36/36 tests).

## How to resume (tomorrow morning, 10 minutes)

1. Laptop: `setsid nohup /tmp/opencode/tunnel-supervisor.sh &` (recreates
   rig SOCKS 1080; verify: `ssh root@ai-legion 'curl -s --socks5-hostname
   127.0.0.1:1080 -o /dev/null -w "%{http_code}"
   -H "user-agent: Mozilla/5.0" https://2fiat.com/'` → 200)
2. ai-legion: restart cloudflared quick tunnel (`cloudflared tunnel --url
   http://127.0.0.1:8787`) → **new URL** → update the app's Bridge address
   on the Sunmi (Settings → Bridge).
3. `POST /mode {"mode":"demo"}` → verify demo charge on the Sunmi.
4. Going live again: `POST /mode {"mode":"live"}` + ALLOW_SUBMIT per the
   bridge RUNBOOK; remember: 2fiat only works through the proxy.

## Open threads

- **First live order** (the coke): fire from Sunmi or API — invoice is
  ~$4 at 1.2× headroom; completer is first-contact (selectors unverified
  against the real checkout; 3DS challenge = fail closed).
- felixfelix-bot asks (Numo#2): encoder consumption → close jamezz#7;
  demo trust artifact; MCP credential decision.
- jamezz#14 (delivery investigation) — untouched.
- Presentation: iteration-005 video from real footage + audience QR
  (needs stable-URL decision: named tunnel vs doors-time generation).
- Uncommitted work (deliberately — commits are yours):
  jamezz: `AGENTS.md` (operator directives), `presentation/*` (all new),
  `apps/burger-402/`, `prompts/context/` · test-video: README + video/*.
