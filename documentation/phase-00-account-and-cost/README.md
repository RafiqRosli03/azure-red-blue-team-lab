# Phase 0 — Azure Account + Budget Alerts + Cost Guardrails

**Status:** ✅ done

## What this phase is
Setting up the Azure account and putting a hard spending guardrail in place before building
anything that costs money.

## Why it matters
A lab that bills by the second can quietly eat your free credit. A budget + alerts means you
get warned (and can stop) long before anything runs away. This is the safety net for the whole
project.

## What was done
- Azure free account active (`$200` credit / 30-day window + always-free services).
- Budget set with **50 / 80 / 100%** alerts.
- Cost discipline rule established: **stop all containers at the end of every session**.

## Key cost facts for this lab
- ACI containers bill **per second while running**; `$0` when stopped or destroyed.
- Log Analytics workspace is free; ingestion stays under the free tier for a home lab.
- Sentinel's first **31 days** are free.
- The expensive thing (VMs) is avoided entirely — the lab uses containers.

## Verify
```powershell
az account show --query "{sub:name, user:user.name}" -o table
az consumption budget list -o table   # shows the configured budget (if set at sub scope)
```

## Reference
See `docs/phase-00-account-and-cost-guardrails.md` and `docs/00-cost-and-licensing.md`.

## Next
Phase 1 — resource group + Terraform skeleton.
