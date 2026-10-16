# Phase 10 — KQL Foundations

**Status:** ✅ done — Activity Log queries written + verified

## What this phase is
Learning and verifying the core KQL (Kusto Query Language) hunting queries against the
`AzureActivity` table — the first hands-on detection content, usable without any attack.

## Why it matters
KQL is how you ask the logs questions. Before chasing app attacks, you establish a baseline:
what does *normal* control-plane activity look like? Anything off-baseline later is a signal.
These queries also become the basis for the Phase 14 analytics rules.

## The query set (all verified against live data)
Full writeups live in `detections/kql/00-azure-activity-foundations.md`. Highlights:

1. **Baseline** — everything that happened in the subscription (know your normal).
2. **Resource creation** — attackers often create VMs/storage (`...WRITE` + `Success`).
3. **NSG / firewall changes** — someone widening the perimeter is a red flag.
4. **Failed operations burst** — permission probing with stolen creds.
5. **Role assignment changes** — privilege escalation / persistence.
6. **New source IP for a known caller** — stolen-credential tell.

## Example (run in Portal → Sentinel → Logs, or via CLI)
```powershell
az monitor log-analytics query --workspace $ws --analytics-query "AzureActivity | where TimeGenerated > ago(24h) | project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ActivityStatusValue | sort by TimeGenerated desc" -o table
```

## Reference
`detections/kql/00-azure-activity-foundations.md`.

## Next
Phase 11–13 — the attack → detect → investigate → respond exercises (uses this KQL skill on
app telemetry).
