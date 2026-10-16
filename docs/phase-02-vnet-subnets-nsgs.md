# Phase 2 — VNet, Subnets, NSGs

## Objective
Create the lab network: one VNet with a public subnet (Linux victim VM) and an internal
subnet (Windows endpoint VM), each protected by a Network Security Group. Inbound access to
the public subnet is locked to your home public IP only. Still ~$0 — VNets, subnets, and NSGs
are free; billing starts with the VM in Phase 3.

## Architecture fit
```
vnet-redblue-lab  10.10.0.0/16
├── snet-public    10.10.1.0/24  -> Linux victim (DVWA + Juice Shop)   [nsg-redblue-public]
└── snet-internal  10.10.2.0/24  -> Windows endpoint (no public IP)    [nsg-redblue-internal]
```
- `nsg-redblue-public`: allow SSH (22) and web (80, 3000, 8080) **from your home IP only**;
  deny all other inbound.
- `nsg-redblue-internal`: deny all inbound from the Internet. The Windows endpoint is reached
  later via Just-In-Time (JIT) access, not a standing open port.

## Prerequisites
- Phase 1 complete: `rg-redblue-lab` exists and is in Terraform state.
- Your home public IPv4. Find it with:
  ```powershell
  curl.exe -s -4 ifconfig.me/ip
  ```
- `home_ip` set in `terraform/terraform.tfvars` (gitignored — never commit your real IP).

---

## Method A — Terraform (primary)
Files: `terraform/network.tf`, variables in `terraform/variables.tf`, outputs in
`terraform/outputs.tf`.

```powershell
# from: ...\Attacking and Defending with Azure\terraform
terraform fmt
terraform validate              # -> Success!
terraform plan -out tfplan      # -> Plan: 7 to add, 0 to change, 0 to destroy
terraform apply tfplan
terraform output                # vnet_name, subnet ids, public_nsg_name
```

The 7 resources: 1 VNet, 2 subnets, 2 NSGs, 2 subnet-NSG associations.

## Method B — Azure CLI (equivalent)
```powershell
az network vnet create -g rg-redblue-lab -n vnet-redblue-lab `
  --address-prefix 10.10.0.0/16 --subnet-name snet-public --subnet-prefix 10.10.1.0/24
az network vnet subnet create -g rg-redblue-lab --vnet-name vnet-redblue-lab `
  -n snet-internal --address-prefix 10.10.2.0/24

az network nsg create -g rg-redblue-lab -n nsg-redblue-public
az network nsg rule create -g rg-redblue-lab --nsg-name nsg-redblue-public `
  -n Allow-SSH-from-home --priority 100 --access Allow --protocol Tcp `
  --destination-port-ranges 22 --source-address-prefixes <YOUR_HOME_IP>
az network nsg rule create -g rg-redblue-lab --nsg-name nsg-redblue-public `
  -n Allow-HTTP-from-home --priority 110 --access Allow --protocol Tcp `
  --destination-port-ranges 80 3000 8080 --source-address-prefixes <YOUR_HOME_IP>

az network nsg create -g rg-redblue-lab -n nsg-redblue-internal
# (default rules already deny Internet inbound; JIT added later)

az network vnet subnet update -g rg-redblue-lab --vnet-name vnet-redblue-lab `
  -n snet-public --network-security-group nsg-redblue-public
az network vnet subnet update -g rg-redblue-lab --vnet-name vnet-redblue-lab `
  -n snet-internal --network-security-group nsg-redblue-internal
```

---

## Verification
- [ ] `terraform output` prints `vnet-redblue-lab` and both subnet IDs.
- [ ] NSG rules confirm the home-IP allowlist:
  ```powershell
  az network nsg rule list -g rg-redblue-lab --nsg-name nsg-redblue-public `
    --query "[].{Name:name, Priority:priority, Access:access, Source:sourceAddressPrefix}" -o table
  ```
  Expect: Allow-SSH-from-home / Allow-HTTP-from-home (source = your IP) + Deny-all-other-inbound.
- [ ] Portal → VNet shows both subnets each associated with their NSG.

## Security considerations
- The public NSG is the lab's primary perimeter control: only your home IP can reach the
  victim. **If your ISP IP changes, update `home_ip` and re-run `terraform apply`** or the
  allowlist goes stale (you lose access, or an old address stays trusted).
- The internal subnet has no standing inbound from the Internet — the Windows endpoint uses
  JIT access (Phase 5), which opens RDP only on demand, from your IP, for a limited window.
- No compute exists yet, so there is still no running attack surface.

## Blue Team relevance
Creating network resources emits `AzureActivity` events
(`Microsoft.Network/virtualNetworks/write`, `.../networkSecurityGroups/write`). NSG flow logs
(enabled in a later phase) become a key detection source: blocked inbound attempts from
non-home IPs are an early recon indicator. Note the legitimate create events now — they are
your baseline for Phase 7 detections.

## Portfolio evidence (no secrets)
- `terraform plan` summary (7 to add) and `terraform output`.
- NSG rule list table (redact your home IP if you prefer).
- Portal screenshot of the VNet + subnet/NSG associations (redact subscription ID).
- Save under `screenshots/phase-02/`.

## Cost control
- Nothing billable yet. VNets/subnets/NSGs are free.
- Teardown (whole lab): `terraform destroy` or `az group delete -n rg-redblue-lab --yes`.

## Next step
**Phase 3 — Linux victim VM + Docker (DVWA + Juice Shop).** This is the first **billable**
resource. We deploy a B2s Linux VM into `snet-public` with a public IP, install Docker, and
run DVWA + Juice Shop. Remember the cost discipline: `az vm deallocate` after every session,
and the public IP + OS disk bill while allocated. Have your home IP current for SSH access.
