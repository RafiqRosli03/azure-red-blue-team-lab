# Phase 6 — Log Analytics Workspace + Logs

**Status:** ✅ done — ACI diagnostics + Activity Log flowing

## What this phase is
Creating the central log store (`law-redblue-lab`) where all the lab's telemetry lands — the
foundation of the Blue Team side.

## Why it matters
You can't detect what you can't see. Every detection query in the lab runs against tables in
this one workspace. Two feeds matter:
- **`ContainerInstanceLog_CL`** — the container stdout/stderr, including DVWA's web access logs.
- **`AzureActivity`** — control-plane events (who created/changed/deleted Azure resources).

## What was built (Terraform `monitoring.tf`)
- `law-redblue-lab` — Log Analytics workspace, `PerGB2018`, 30-day retention (free tier).
- Subscription Activity Log → workspace diagnostic setting (feeds `AzureActivity`).
- Each ACI container group ships diagnostics to this workspace (feeds `ContainerInstanceLog_CL`).

## Verify — grab the workspace GUID (this is `$ws`, used everywhere)
```powershell
$ws = az monitor log-analytics workspace show -g rg-redblue-lab -n law-redblue-lab --query customerId -o tsv
$ws   # -> 5f251dad-c3ae-4cbf-ae8c-88ec26ff4be0
```

Confirm data is arriving:
```powershell
az monitor log-analytics query --workspace $ws --analytics-query "ContainerInstanceLog_CL | where TimeGenerated > ago(24h) | summarize Rows=count() by _ResourceId | sort by Rows desc" -o table
```

## Verified result (this session)
```
Rows   _ResourceId
1690   .../aci-redblue-kali
25     .../aci-redblue-juiceshop
17     .../aci-redblue-dvwa
```
All three containers are shipping logs. (Full web-access-log proof is in the Phase 11–13 folder.)

## Reference
`docs/phase-06-log-analytics-workspace.md`, `terraform/monitoring.tf`.

## Next
Phase 7 — enable Microsoft Sentinel on top of this workspace.
