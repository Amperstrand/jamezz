# T−2h roadmap — small but controlled production (2026-10-03)

Goal: by T+2h, a **public, bounded, SIM-only** demo tier anyone can hit via
the audience QR — while LIVE stays internal and human-gated. "Controlled"
means: token or SIM gate on every mutating surface, order caps, rate
limits, a kill switch, and a rehearsed fallback.

Invariants for the whole window:
- SIM only in public. ALLOW_SUBMIT stays hard-refused in SIM (code-enforced).
- No card data, no real npubs, no live kitchen tickets. LIVE needs a human
  who says so out loud.
- Freeze at T+1:55. After freeze, only the fallback ladder runs.

## Phase 0 — Stabilize the rig (T+0:00 → 0:10) · owner: Sisyphus

- Restart bridge via `/root/src/numo-pos/demo-sim.sh`; verify dashboard
  banner: "SIM MODE — Burgermeister SIM (SIMBURG1) … ZERO jamezz calls".
- `demo-preflight.sh --clean` → every check green.
- Acceptance: banner present, blocked-calls counter visible, emulator
  (emulator-5554) attached.

## Phase 1 — Controlled public exposure (T+0:10 → 0:35) · owners: Sisyphus + numo-dev

- Expose the rig through a **cloudflared quick tunnel** on ai-legion
  (no domain needed, revocable in one command = kill switch).
  - spike (:3100) → public for the audience flow.
  - bridge (:8787) → same tunnel. **Auth is disabled by design**; the
    safety boundary is the mode system: `GET/POST /mode`, boot default
    **demo** (fixture venue, zero jamezz calls), live only for 8613S3X,
    other venues 422 `venue_not_live`. Flip back to demo before doors.
- Landing page = spike; audience QR targets the tunnel URL.
- Caps already in place: KV TTL 6h, MAX_ORDER_EUR 30, submit gate.
- Acceptance: from a phone on **cellular** (not venue Wi-Fi): open QR →
  menu renders → order → 402/testnut QR → paid → order number. Screenshot
  stored in test-video.

## Phase 2 — Content: iteration-005 (T+0:35 → 1:05) · owner: Sisyphus

- Capture from the SIM rig using the RUNBOOK "closest real flow" column as
  the shot list (CSV import → checkout → own-QR → paid → dashboard order
  number), scrcpy + tapbounds.py.
- Drop takes into `assets/recordings/`, rebuild video (zero-token compile).
- QR artwork: generate from the FINAL tunnel URL, replace the close card's
  placeholder, rebuild.
- Acceptance: iteration-005 plays ≤ 4:00 with real footage in every beat
  and a scannable final QR on the close frame.

## Phase 3 — Trust + MCP close-out (T+1:05 → 1:35) · owner: felixfelix-bot (chased by human)

- Deliverables per handover gist: (1) encoder consumption confirmed →
  close jamezz#7; (2) demo-able trust-set artifact (set id + one
  proof/verdict) for the honesty beat; (3) MCP access decision — demo
  credential for api.cashu.exchange/mcp OR bless mcp.cashu.exchange/mcp
  as the surface we demo.
- Acceptance: script's honesty beat names a real artifact; "we have MCP"
  is demonstrable with a live call or a cached screenshot.

## Phase 4 — Full rehearsal (T+1:35 → 1:55) · owner: single speaker + operator

- Run the 4:00 against a stopwatch on the actual rig (HDMI + audio).
- QR scan test again on cellular from the back of the room.
- Fallback ladder armed: iteration-005 video cued, catalog map slide ready.
- Delivery question answer: "pickup today; jamezz#14 decides delivery."

## Phase 5 — Freeze (T+1:55 → 2:00)

- No manifest edits, no redeploys. Kill switch documented: stop cloudflared
  process → public surface gone, local rig unaffected.

## Risk register

| Risk | Mitigation |
|---|---|
| Tunnel URL dies mid-day | QR points at the URL only minutes before doors; fallback = mcp.cashu.exchange + video |
| Bridge drifts (200-but-swallowed) | SIM gate + preflight; on stage, restart-don't-debug |
| felixfelix-bot deliverables slip | Phase 3 is additive to the pitch; script works without it (honesty beat keeps generic wording) |
| Emulator/UI flake during capture | RUNBOOK preflight + existing 004 footage as floor |
| Scope creep (numo fork gaps) | Fork work is POST-hackathon; do not start it inside this window |
