# Phase 2 — VNet / Subnets / NSGs (Private, Option A)

**Status:** ✅ done — VNet `10.20.0.0/16`, delegated subnets, NSG attacker→victim only

## What this phase is
Building a private network so the vulnerable apps are completely isolated from the internet,
and the attacker can reach them only through a tightly-controlled firewall rule.

## Why it matters
These apps are **intentionally hackable**. If they were reachable from the internet, anyone
could find and abuse them. A private VNet with a least-privilege NSG is the core safety
guarantee of the whole lab: the only thing allowed to attack the victims is your own Kali box.

## What was built (Terraform `network.tf`)
- VNet `vnet-redblue-lab` — `10.20.0.0/16`.
- `snet-aci` `10.20.1.0/24` — delegated to ACI, hosts the victim apps.
- `snet-attacker` `10.20.2.0/24` — delegated to ACI, hosts Kali.
- `nsg-redblue-aci` — inbound **ALLOW only** from `10.20.2.0/24` to ports 80/3000; deny all else.
- `nsg-redblue-attacker` — deny all inbound (Kali needs none; reached via `az container exec`).

## The rule in plain English
> Only the attacker subnet can talk to the victim subnet, and only on the web ports.
> Everything else — including the whole internet — is denied.

## Verify
```powershell
az network vnet list -g rg-redblue-lab --query "[].{name:name, space:addressSpace.addressPrefixes[0]}" -o table
az network nsg list -g rg-redblue-lab -o table
```

## Reference
`docs/phase-02-vnet-subnets-nsgs.md`, `docs/phase-02-03-network-and-victims.md`, `terraform/network.tf`.

## Next
Phase 3 — deploy the victim apps into the private subnet.
