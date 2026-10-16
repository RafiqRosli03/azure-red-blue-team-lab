# Cost & Licensing Reference (verified October 2026)

> Pricing and trial terms change. Re-verify at the official links before relying on them.
> Figures below are estimates for planning, not quotes.

## Trial clocks — start these deliberately, not by accident

| Service | Free window | What you get | Source |
|---|---|---|---|
| Azure free account | **$200 credit / 30 days** + some services free 12 mo + ~55 always-free | general Azure | [FAQ](https://azure.microsoft.com/en-us/free/free-account-faq/) |
| Microsoft Sentinel | **first 10 GB/day free for 31 days** | SIEM ingestion/analysis | [Sentinel billing](https://learn.microsoft.com/en-us/azure/sentinel/billing) |
| Defender for Cloud | **free for first 30 days** (paid plans) | CWP plans | [DfC pricing](https://azure.microsoft.com/en-us/pricing/details/defender-for-cloud/) |
| Microsoft 365 E5 trial | **30 days**, 25 users | Entra ID P2, MDE P2, XDR, Conditional Access | — |
| Standalone Defender trial | **90 days** | Defender for Endpoint / XDR | [Defender licensing](https://www.microsoft.com/licensing/guidance/microsoft-defender) |
| Defender Vulnerability Mgmt | **90 days** | MDVM | [MDVM trial](https://learn.microsoft.com/en-us/defender-vulnerability-management/defender-vulnerability-management-trial) |
| Defender for Office 365 | **90 days** | DfO365 P2 | [DfO365 trial](https://learn.microsoft.com/en-us/defender-office-365/try-microsoft-defender-for-office-365) |

**Note:** The free M365 E5 *Developer sandbox* is no longer freely available to individuals/students;
use the 30-day M365 E5 trial instead for Entra P2 + Conditional Access.

## What is free / always-free / billable

**Free or near-free in this lab**
- Log Analytics / Sentinel ingestion while under the 31-day free window (home lab is < 1 GB/day).
- Defender for Cloud free CSPM (secure score, recommendations) — stays free indefinitely.
- Entra ID free tier (basic sign-in/audit logs).
- Azure Activity Log.

**The real cost driver: VM compute**

East US pay-as-you-go, verified Sept 2026 (source: economize.cloud):

| VM | Spec | Linux /hr | Windows /hr | 24x7 / month |
|---|---|---|---|---|
| B1s | 1 vCPU / 1 GB | ~$0.0104 | — | ~$7.60 |
| B2s | 2 vCPU / 4 GB | ~$0.0416 | ~$0.0496 | ~$30 / ~$36 |
| B2ms | 2 vCPU / 8 GB | ~$0.0832 | ~$0.0912 | ~$61 / ~$67 |

**Region note — this lab uses `southeastasia` (Singapore), closest to Malaysia.**
Southeast Asia runs roughly **+45% above the lowest-cost region** for VMs
([azurespeed.com](https://www.azurespeed.com/AzureVmPricing/Regions/southeastasia)). Approximate
Southeast Asia rates: B2s Linux ~$0.06/hr, B2ms Windows ~$0.13/hr. Still negligible for short,
deallocated sessions — a 25-hour project run is only a few dollars.

**Things that bill even when a VM is "stopped"**
- Managed OS disk (~$3–10/mo each) — bills unless the VM is deleted.
- Public IP (~$3–4/mo each) — bills while allocated.
- **Only `az vm deallocate` stops compute charges.** Stopping inside the OS does not.
- Azure Bastion standalone ~$140/mo — **do not deploy**; use JIT access instead.

## Cost estimate for this project (Tier B, a few days)

- 2 VMs active ~25 hrs total, deallocated between sessions: **~$2–3 compute**
- 2 disks + 2 public IPs for ~10 days: **~$6–10**
- Sentinel / Defender within trial windows: **$0**
- **Total ≈ $10–15 of the $200 credit → effectively RM0, $0 out of pocket**

**Worst case (everything left running 24x7 a month): ~$120–180** — would exhaust the credit.

## Cost-control checklist

- [ ] Budget set at $20 with 50/80/100% alerts (see `docs/phase-00-...`).
- [ ] `az vm deallocate` both VMs after every session.
- [ ] Defender for Cloud paid plans ON only during 30-day trial, then OFF.
- [ ] No standalone Azure Bastion.
- [ ] Delete the whole RG when done for the week: `az group delete -n rg-redblue-lab --yes`.
- [ ] Check for orphaned disks / public IPs after any VM delete.
- [ ] Track trial clocks (table above).
