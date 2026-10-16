# Phase 6 — Log Analytics Workspace

## Objective
Create the Log Analytics workspace that is the central telemetry store for the Blue Team
side of the lab. Microsoft Sentinel (Phase 7), VM security/guest logs, and all detection KQL
(Phase 10+) attach to this one workspace.

## Architecture fit
```
law-redblue-lab (Log Analytics workspace, PerGB2018, 30-day retention)
   ├── Microsoft Sentinel enabled on top (Phase 7)
   ├── VM guest + security logs via Azure Monitor Agent / DCRs (later)
   └── Hunting + analytics KQL query the tables here (Phase 10+)
```

## Prerequisites
- Phases 0–2 complete; resource group `rg-redblue-lab` exists.
- Terraform file `terraform/monitoring.tf` present.

## Cost
- The workspace resource is **free**. Ingestion is pay-per-GB, but a home lab stays well under
  ~1 GB/day. Sentinel's first **31 days are free**. 30-day retention stays on the free tier.
- Realistic lab cost for this component: **~$0** within the trial/free windows.

---

## Method A — Terraform (primary)
Defined in `terraform/monitoring.tf`:
```powershell
# from: ...\Attacking and Defending with Azure\terraform
terraform apply -parallelism=1   # creates law-redblue-lab (plus any other pending resources)
terraform output log_analytics_workspace_name
```

## Method B — Azure CLI (equivalent)
```powershell
az monitor log-analytics workspace create `
  --resource-group rg-redblue-lab `
  --workspace-name law-redblue-lab `
  --location westus3 `
  --sku PerGB2018 `
  --retention-time 30
```

---

## Verification
- [ ] `terraform output log_analytics_workspace_name` prints `law-redblue-lab`, or
      `az monitor log-analytics workspace show -g rg-redblue-lab -n law-redblue-lab -o table`
      returns `Succeeded`.
- [ ] Portal → Log Analytics workspaces shows `law-redblue-lab` in the resource group.

## Security considerations
- The workspace holds security-relevant logs; access is governed by Azure RBAC. Keep it in the
  same RG so teardown is atomic.
- No data sources are connected yet, so nothing sensitive is ingested until later phases wire
  the VM diagnostics and Sentinel connectors.

## Blue Team relevance
This is the foundation of every detection in the lab. Creating it emits an `AzureActivity`
event (`Microsoft.OperationalInsights/workspaces/write`) — another legitimate baseline event
to recognize when hunting for suspicious resource creation in Phase 7.

## Portfolio evidence (no secrets)
- `terraform output log_analytics_workspace_name`.
- Portal screenshot of the workspace Overview (redact subscription ID / workspace ID).
- Save under `screenshots/phase-06/`.

## Cost control
- Workspace is free; no deallocation needed. Teardown with the rest via `terraform destroy`.
- When Sentinel is enabled (Phase 7), watch the 31-day free window; disable paid Defender plans
  after their 30-day trial.

## Next step
**Phase 7 — Microsoft Sentinel + connectors.** Enable Sentinel on `law-redblue-lab` and wire
the data connectors (Azure Activity, Entra ID, Defender) so attacks become detectable.
