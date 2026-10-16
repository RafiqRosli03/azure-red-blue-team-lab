# Lessons Learned

Running log of what worked, what broke, false positives encountered, detection gaps found,
and tuning decisions. Feeds the final report's Lessons Learned and Recommendations sections.

---

## Phase 3 blocker: `SkuNotAvailable` — new-subscription VM capacity restriction

**Date:** 2026-10-10

### What happened
After building the network layer (RG, VNet, subnets, NSGs) successfully, every attempt to
create the Linux victim VM failed with HTTP 409 `SkuNotAvailable: ... Capacity Restrictions`.

Tried and all rejected:

| VM size | Region | Result |
|---|---|---|
| Standard_B2s | southeastasia | SkuNotAvailable |
| Standard_B2as_v2 | southeastasia | SkuNotAvailable |
| Standard_D2s_v3 | southeastasia | SkuNotAvailable |
| Standard_B2s | australiaeast | SkuNotAvailable |
| Standard_B1s | westus3 | SkuNotAvailable |

`az vm list-usage` showed every family at `0/4` — a low default cap typical of a fresh
pay-as-you-go / free-credit subscription. Combined with the capacity-restriction wording,
this is Azure blocking VM creation on a new subscription regardless of size or region.

### Root cause
New Azure subscriptions (free credit / new PAYG) commonly start **unable to create VMs** in
busy regions due to per-family vCPU quotas set to a low value and regional capacity gating.
This is a subscription-level restriction, not a Terraform or config problem.

### The real fix (free): request a quota / VM access increase
1. Portal → **Quotas** (or Help + support → New support request → *Service and subscription
   limits (quotas)*).
2. Request an increase for a VM family in the lab region, e.g. **Standard BSv2 Family vCPUs**
   or **Standard DSv5 Family vCPUs**, to at least **2–4 vCPUs**.
3. Approval for small amounts on credit subscriptions is usually fast (minutes–hours).
4. Once granted: `terraform apply` — the VM slots into the already-built network. No rework.

### Terraform lesson: the azurerm "inconsistent result" glitch
During rapid parallel creates, azurerm v4.x intermittently returned
`Provider produced inconsistent result after apply: Root object was present, but now absent`
for the VNet / NSG, leaving state out of sync with Azure (resources existed in Azure but not
in state → subsequent "already exists" errors).

**Fix that worked:** `terraform apply -parallelism=1` — serializing resource creation avoids
the race entirely. The whole network then built in one clean pass with zero drift.

**If drift already happened:** `terraform import <addr> <azure-id>` to reconcile, or (cleanest)
`az group delete` + remove local `*.tfstate` + a fresh serialized apply.

### Current state
Network layer fully deployed in **westus3** and clean in Terraform state (RG, VNet, 2 subnets,
2 NSGs + associations, public IP, NIC). Only the VM is pending the quota increase.
