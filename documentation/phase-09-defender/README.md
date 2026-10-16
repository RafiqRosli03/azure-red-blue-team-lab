# Phase 9 — Defender for Cloud + Defender for Endpoint/XDR

**Status:** ⬜ pending (DfC free CSPM tier works without a VM)

## What this phase is
Turning on Microsoft's cloud security posture + threat protection: Defender for Cloud (CSPM)
and, where an endpoint exists, Defender for Endpoint / XDR.

## Why it matters
- **Defender for Cloud (free CSPM)** gives a secure score and misconfiguration recommendations
  for your Azure resources — it works **without a VM**, so it's available right now.
- **Defender for Endpoint / XDR** provides EDR-style detection on real operating systems — but
  that needs the Windows endpoint from Phase 5 (currently blocked on VM quota).

## Current state
- ⬜ Defender for Cloud free CSPM tier not yet enabled (easy win — no VM needed).
- ⬜ Defender for Endpoint/XDR deferred (depends on Phase 5 VM).

## What to do when you build it
1. Enable Defender for Cloud (free CSPM): Portal → Microsoft Defender for Cloud → turn on for
   the subscription; review the secure score and recommendations.
2. Keep paid plans **off** unless inside the 30-day trial (see cost doc).
3. When a Windows endpoint exists (Phase 5), onboard it to Defender for Endpoint and wire the
   connector into Sentinel (Phase 7).

## Honest note for the portfolio
Document which attacks Defender **would not** catch and why — e.g. app-layer SQLi against DVWA
is invisible to Defender without web-log collection. That gap analysis is itself a Blue Team
skill (`detections/defender/`).

## Reference
`detections/defender/`, `docs/00-cost-and-licensing.md`.

## Next
Phase 10 — KQL foundations (done); then Phase 11–13 (active).
