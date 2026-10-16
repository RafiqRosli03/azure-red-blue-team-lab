# Phase 15 — Incident Response: Screenshot Index

These shots document the incident-response lifecycle applied to the SQLi incident — triage,
containment, and closure. They are the IR slice of the SQLi exercise (also stored, in attack
context, under phase-11-13/screenshots/sqli/).

| File | IR phase | What it shows |
|------|----------|---------------|
| `phase15-01-triage-incident-detail.png` | Identify / Triage | Incident detail with the attacker IP entity (Kali 10.20.2.4) |
| `phase15-02-contain-stop-dvwa.png` | Contain | DVWA container stopped to cut the attacker's access |
| `phase15-03-close-incidents.png` | Recover / Close | Closing the incident queue |
| `phase15-04-incidents-updated.png` | Recover / Close | Incidents being updated to resolved |
| `phase15-05-incidents-resolved-tp.png` | Close | Incidents resolved, classified True Positive |

## The IR story these prove
1. **Identify / Triage** — opened the incident, confirmed severity High and the source entity.
2. **Contain** — stopped the DVWA container (lab equivalent of blocking the source IP / taking
   the app offline behind a WAF).
3. **Eradicate** (documented decision) — treat the 5 dumped/cracked credentials as compromised
   → rotate; reset the DVWA database to a clean baseline.
4. **Recover** — service restored on clean state; incidents resolved.
5. **Lessons learned** — detection worked but flooded (150 incidents); rule tuned (Phase 14).
   Hardening: parameterized queries + WAF + least-privilege DB account.

> Note: eradication/hardening (step 3 and the hardening in step 5) are documented decisions in
> this lab rather than portal actions. The screenshots cover the triage → contain → close path
> that was actually executed.
