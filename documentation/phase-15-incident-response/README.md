# Phase 15 — Incident Response + Remediation

**Status:** ✅ done — full IR lifecycle executed on the SQLi incident

## What this phase is
Applying a structured incident-response (IR) process to the SQLi incident: identify, contain,
eradicate, recover, and capture lessons learned — the repeatable discipline a SOC uses.

## Why it matters
Detection tells you something happened; response is what contains the damage and prevents a
repeat. Running the SQLi incident through a formal IR lifecycle turns an ad-hoc reaction into a
demonstrable capability.

## The IR lifecycle (as executed)

### 1. Identify / Triage
- Opened the `SQLi / sqlmap against DVWA` incident (High severity, Initial access / T1190).
- Confirmed the attacker entity: source IP **`10.20.2.4`** (the Kali container).
- Screenshot: `screenshots/phase15-01-triage-incident-detail.png`.

### 2. Contain
- **Stopped the DVWA container** to cut the attacker's access immediately.
- Real-world equivalent: block the source IP at the NSG/WAF, or take the app offline.
- Screenshot: `screenshots/phase15-02-contain-stop-dvwa.png`.

### 3. Eradicate (documented decision)
- All 5 user credentials were dumped **and cracked** → treat every account as compromised and
  rotate the passwords (force-reset in a real app).
- Reset the DVWA database to a clean baseline (`setup.php` → Create / Reset Database).

### 4. Recover
- Service restored on clean state.
- Incidents worked and closed — screenshots `phase15-03..05` (close → update → resolved).
- Classification: **True Positive** (authorized security test).

### 5. Lessons learned
- **Detection worked but flooded** — ~150 near-duplicate incidents from one attack burst; fixed
  with event grouping (Phase 14). Detection must be tuned, not just enabled.
- **The real fixes are preventive:** parameterized queries (code), a WAF in front of the app,
  and a least-privilege DB account. Logging makes the attack *visible*; these make it *fail*.
- **Honest coverage gap:** Defender for Cloud / Endpoint do not see app-layer SQLi — only the
  collected web logs do (see Phase 9 coverage-gap note). Telemetry choice drives detection.

## Screenshots
`screenshots/phase15-01..05` (indexed in `screenshots/README.md`).

## Reference
`incident-response/`, the SQLi exercise in Phase 11–13, and Phase 14 (detection tuning).

## Next
Phase 16 — package the architecture, the exercise, the detections, and these lessons into the
final portfolio report.
