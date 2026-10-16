# Phase 7 — Microsoft Sentinel + Connectors

**Status:** 🟡 partial — Sentinel + Azure Activity done; Defender connectors pending

## What this phase is
Turning the Log Analytics workspace into a SIEM by enabling Microsoft Sentinel on top of it,
and wiring in data connectors.

## Why it matters
Sentinel is the Blue Team's cockpit: hunting queries, scheduled analytics rules, incidents, and
investigation all live here. Enabling it on `law-redblue-lab` unlocks the detection-engineering
work in Phase 14.

## What's done
- ✅ Sentinel enabled on `law-redblue-lab` (Terraform `azurerm_sentinel_log_analytics_workspace_onboarding`).
- ✅ **Azure Activity** data source live — control-plane events queryable in `AzureActivity`.
- ✅ Container logs flowing (via Phase 6 diagnostics) — queryable in `ContainerInstanceLog_CL`.

## What's pending
- ⬜ **Defender connectors** — Defender for Cloud / Defender for Endpoint / XDR connectors are
  not wired yet (depends on Phase 9). Not required for the current web-app attack exercises.

## Verify
```powershell
az sentinel setting list --resource-group rg-redblue-lab --workspace-name law-redblue-lab -o table 2>$null
# or confirm in Portal -> Microsoft Sentinel -> law-redblue-lab is listed
```

## Reference
`terraform/monitoring.tf`, `detections/sentinel/`.

## Next
Phase 8 (Entra ID) and Phase 9 (Defender) are pending; the active work continues at Phase
10 (KQL foundations, done) and Phase 11–13 (attack exercises, in progress).
