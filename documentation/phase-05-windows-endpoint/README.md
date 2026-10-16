# Phase 5 — Windows Endpoint VM (JIT, no public IP)

**Status:** ⛔ blocked — VM quota = 0; quota increase **requested and DENIED by Azure**

## What this phase is
Adding a Windows endpoint VM to the lab, reachable only via Just-In-Time (JIT) access with no
public IP — intended as a target for endpoint-focused detection (Defender for Endpoint).

## Why it's blocked (confirmed)
The pay-as-you-go subscription has a VM-family (Bsv2) vCPU quota of **0** (West US 3,
Azure subscription 1). No VM of that family can be created at that limit.

**A quota increase was requested (total limit 1) and Azure returned "Unsuccessful — we were
unable to complete 1 request."** The increase was **denied**, so the VM path remains closed on
this subscription. (Evidence: `phase05-03-quota-request.png` and
`phase05-04-quota-request-unsuccessful.png`.)

## ⭐ This is exactly why the lab uses containers
The denied quota is not a dead end — it is the **design justification** for the whole
architecture. Because no VM-family vCPUs are available:
- Victims run as **Azure Container Instances** (DVWA + Juice Shop), not VMs.
- The attacker (Kali) runs as an ACI container too.
- The same OWASP web-app attacks, detection, and response still work end to end — with **zero**
  VM quota and lower cost (ACI bills per second, $0 when stopped).

In portfolio terms: faced with a hard platform constraint, the lab was re-architected to a
container-based design that meets the same learning objectives. That is a stronger story than
if the VM had simply worked.

## What this phase loses (and the honest trade-off)
A real Windows endpoint would enable **endpoint/EDR** detection (Microsoft Defender for
Endpoint on a live OS) — process trees, on-host alerts, device timeline. The container lab does
**not** cover that layer. The web-application attack/detect/respond cycle (Phases 11–13) is
fully covered without it.

## Options if endpoint coverage is wanted later
1. **Request a different VM family** whose quota may be grantable (e.g. Dsv-series) in the same
   or another region, then retry the quota request.
2. **Open a support request** (the portal offered "Create a support request") to ask a human to
   approve a small limit — new PAYG subscriptions sometimes need this.
3. **Use a different subscription** (e.g. a Visual Studio / MSDN or a fresh free account) that
   has non-zero VM quota.
4. **Simulate endpoint telemetry** another way (e.g. a local Windows VM in VirtualBox onboarded
   to Defender) — off-Azure, but delivers the EDR learning.

## How to re-check quota (if you retry)
```powershell
az vm list-usage --location westus3 --query "[?contains(name.value, 'standardBSv2Family')]" -o table
```

## Decision
**Deferred — not pursued for now.** The web-app exercises don't need it, and the container
design is the intentional answer to this exact constraint. Phase 5 stays documented as a known,
accepted gap.

## Reference
`docs/00-cost-and-licensing.md` (VM cost table + quota note).

## Next
Continue at Phase 11–13 (the attack exercises) — no VM required.
