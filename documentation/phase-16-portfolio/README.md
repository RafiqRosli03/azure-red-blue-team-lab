# Phase 16 — Portfolio Packaging + Final Report

**Status:** ⬜ pending

## What this phase is
Packaging the whole lab into a clean, shareable write-up: the architecture, the exercises, the
evidence, and the lessons — the artifact you'd show an employer or put in a portfolio.

## Why it matters
The lab's value is only realized if it's communicable. This phase turns scattered commands and
query results into a coherent story: "here's an isolated Azure range I built, here are the
attacks I ran, here's how I detected and responded, here's what I learned."

## What to produce
- **Architecture diagram** (from `architecture/`) + the design rationale (why containers, why
  private, why two apps).
- **Per-exercise write-ups** — attack, detection, investigation, response, with screenshots
  (redact subscription/workspace IDs).
- **Detection catalog** — the KQL and the Sentinel analytics rules built in Phase 14.
- **Lessons learned** (`lessons-learned/`) — including honest detection gaps.
- **Final report** (`reports/`) — the executive summary tying it together.

## Evidence rules
- No real secrets, tokens, or credentials in the repo.
- Private IPs (10.20.x.x) are safe to show — they're internal, non-routable.
- Redact subscription ID and workspace GUID from screenshots.

## Reference
`architecture/`, `screenshots/`, `reports/`, `lessons-learned/`.

## Next
This is the final phase. Loop back to Phase 11–13 to add more exercises as desired.
