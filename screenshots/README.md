# Screenshots — moved into the documentation phase folders

Screenshots now live **inside each phase folder** under `documentation/`, next to that phase's
README and screenshot guideline. This keeps everything for one phase in one place.

## Where to save screenshots

```
documentation/phase-XX-.../screenshots/
```

Examples:
- Phase 0  → `documentation/phase-00-account-and-cost/screenshots/`
- Phase 4  → `documentation/phase-04-kali-attacker/screenshots/`
- Phase 6  → `documentation/phase-06-log-analytics/screenshots/`
- SQLi     → `documentation/phase-11-13-attack-detect-respond/screenshots/sqli/`

Each phase folder also contains a `screenshot-guideline.txt` with the exact shot list, file
naming, and redaction rules for that phase.

## Naming convention

```
phaseNN-SS-short-description.png        e.g. phase03-01-container-list-private.png
```
Phase 11-13 uses the story prefix: `phase11-A1-baseline.png`, `phase11-B7-volume-timechart.png`.

## GLOBAL REDACTION RULE (every screenshot)

Blur / black-box before saving:
- Subscription ID, Tenant/Directory ID, Workspace (customerId) GUID
- Any key, token, password, or shared key

Safe to show:
- Private IPs `10.20.x.x` (internal, non-routable)
- DVWA default lab creds (`admin`/`password`) — label as intentional lab defaults

> This top-level folder is kept only as a pointer. Put the actual images in the per-phase
> `documentation/.../screenshots/` folders.
