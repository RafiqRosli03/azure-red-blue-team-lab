# Phase 14 — Sentinel Detection Engineering

**Status:** ✅ done — analytics rule built, fired real incidents, then tuned

## What this phase is
Promoting the ad-hoc SQLi hunting query into a **standing Microsoft Sentinel analytics rule**
that raises incidents automatically — then tuning it after observing a real-world failure mode.

## Why it matters
Hunting is manual ("I found it when I looked"). Detection engineering makes it automatic ("the
system told me"). Building, firing, and tuning a rule is the core SOC detection-engineering
skill — and this phase demonstrates the complete loop on a real attack.

## What was built
A **scheduled query rule** in the Defender portal (Microsoft Sentinel → Analytics):
- **Name:** `SQLi / sqlmap against DVWA`
- **Severity:** High · **MITRE:** T1190 (Exploit Public-Facing Application)
- **Query:** matches the sqlmap User-Agent and SQLi payload signatures in
  `ContainerInstanceLog_CL` for the DVWA container.
- **Entity mapping:** source IP → IP entity (so incidents are investigable).
- **Schedule:** every 5 minutes, 1-hour lookback, alert when results > 0.
- **Incident creation:** enabled.

Query used:
```kql
ContainerInstanceLog_CL
| where _ResourceId has "dvwa"
| where Message has "sqlmap" or Message has_any ("UNION SELECT","information_schema","EXTRACTVALUE","SLEEP(","' OR '1'='1")
| extend SrcIP = extract(@"^(\d+\.\d+\.\d+\.\d+)", 1, Message)
| project TimeGenerated, SrcIP, Message, _ResourceId
```

## What happened (the engineering loop)
1. **Built** the rule from the hunting query.
2. **Fired** — re-running the sqlmap attack produced **High-severity incidents automatically**,
   tagged Initial access / T1190, with the Kali IP (`10.20.2.4`) mapped as the entity.
3. **Observed a failure mode** — the naive rule generated **~150 near-duplicate incidents** from
   a single attack burst (classic **alert fatigue** — one incident per matching log row).
4. **Tuned** — enabled **event grouping** ("group all events into a single alert"), collapsing a
   whole attack burst into **one** clean incident.

## The lesson
A detection rule isn't "done" when it fires — it's done when it fires *usefully*. Observing the
150-incident flood and fixing it with event grouping is the real detection-engineering value:
balancing sensitivity against analyst noise.

## Screenshots
`screenshots/phase14-01..08` (indexed in `screenshots/README.md`): source query → incident
response view → incidents generated → incident list → entity detail → tuning (1/2, 2/2) →
tuned single-incident result.

## Reference
`detections/sentinel/`, and the SQLi exercise in Phase 11–13.

## Next
Phase 15 — formalize the incident response; Phase 16 — package into the final report.
