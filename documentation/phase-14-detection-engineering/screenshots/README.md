# Phase 14 — Detection Engineering: Screenshot Index

These shots document turning the SQLi hunting query into a standing Sentinel analytics rule
that fires incidents automatically — then tuning it. They are the detection-engineering slice
of the SQLi exercise (also stored, in attack context, under phase-11-13/screenshots/sqli/).

| File | What it shows |
|------|---------------|
| `phase14-01-source-kql-in-logs.png` | The source hunting query in Sentinel Logs (what the rule is built from) |
| `phase14-02-rule-incident-response.png` | Defender portal — rule / incident response view |
| `phase14-03-incidents-from-rule.png` | Incidents generated automatically by the analytics rule |
| `phase14-04-incident-list.png` | The incident list (High severity, Initial access / T1190) |
| `phase14-05-incident-detail-entity-ip.png` | Incident detail with the mapped IP entity (Kali 10.20.2.4) |
| `phase14-06-rule-tuning-eventgrouping-1.png` | Tuning the rule — event grouping (1/2) |
| `phase14-07-rule-tuning-eventgrouping-2.png` | Tuning the rule — event grouping (2/2) |
| `phase14-08-rule-tuned-single-incident.png` | Result: rule now produces 1 unified incident instead of ~150 |

## The detection-engineering story these prove
1. **Built** a scheduled analytics rule from a hunting query (sqlmap UA + SQLi payload signatures).
2. **Mapped an entity** (source IP) so incidents are investigable.
3. **It fired** — real High-severity incidents appeared automatically (MITRE T1190).
4. **Found a problem** — the naive rule produced ~150 near-duplicate incidents (alert fatigue).
5. **Tuned it** — event grouping collapsed a whole attack burst into a single incident.

That full loop (build → fire → observe failure mode → tune) is the core detection-engineering
skill this phase demonstrates.
