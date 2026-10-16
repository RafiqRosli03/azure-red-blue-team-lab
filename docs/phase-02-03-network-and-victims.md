# Phase 2 + 3 — Private VNet, NSGs, and Victim/Attacker Containers (Option A)

Status: **DEPLOYED & VERIFIED** (westus3).

## Objective
Put the vulnerable apps behind a private VNet so nothing is exposed to the internet, and
place the Kali attacker inside the VNet. Attacker reaches victims over a least-privilege NSG;
analyst reaches Kali via `az container exec`.

## What got built (Terraform)
- `network.tf`
  - VNet `vnet-redblue-lab` `10.20.0.0/16`
  - `snet-aci` `10.20.1.0/24` — delegated to `Microsoft.ContainerInstance`, hosts victims
  - `snet-attacker` `10.20.2.0/24` — delegated to ACI, hosts Kali
  - `nsg-redblue-aci` — inbound ALLOW only from `10.20.2.0/24` to ports 80/3000; deny all else
  - `nsg-redblue-attacker` — deny all inbound (Kali needs none; reached via exec)
- `containers.tf`
  - `aci-redblue-dvwa` — private `10.20.1.4`, port 80
  - `aci-redblue-juiceshop` — private `10.20.1.5`, port 3000
  - `aci-redblue-kali` — private `10.20.2.4`, boots with web-attack tools installed
- All three stream diagnostics to `law-redblue-lab` (Log Analytics / Sentinel).

## Key constraints learned (verified against Microsoft docs + provider)
- VNet-integrated ACI gets a **private IP only** — no public IP, no `dns_name_label`.
  So you attack from the **in-VNet Kali container**, not from a public endpoint.
- An ACI container group in a VNet **must expose at least one port** (`MissingIpAddressPorts`).
  Kali exposes a dummy 8080 with nothing listening and no NSG rule permitting inbound —
  it is unreachable; it only satisfies the ACI API.
- `az container exec` passes commands best as a single token. Multi-word installs are done at
  container **boot** (the `commands` block) so Kali always comes up fully armed.

## Verification (all passed)
```text
az container list ... -> all three Private, no public IP
nmap 10.20.1.4 (from Kali) -> 80/tcp open
nmap 10.20.1.5 (from Kali) -> 3000/tcp open
curl http://10.20.1.4/      -> DVWA=302 (login redirect, correct)
curl http://10.20.1.5:3000/ -> JUICE=200 (app up)
```

## How to use the lab
```powershell
# open a Kali shell
az container exec -g rg-redblue-lab -n aci-redblue-kali --exec-command "/bin/bash"

# from inside Kali, targets are:
#   DVWA       http://10.20.1.4/
#   Juice Shop http://10.20.1.5:3000/
```

## Security considerations
- No public ingress anywhere — the deliberately vulnerable apps cannot be reached from the
  internet. This is the core isolation guarantee.
- NSG enforces attacker->victim only. Even inside the VNet, access is least-privilege.
- Private IPs (10.20.1.4/.5, 10.20.2.4) are internal, non-routable — safe to show in a portfolio.

## Blue Team relevance
Container stdout/stderr (incl. web access logs) streams to `ContainerInstanceLog_CL`; control
plane events to `AzureActivity`. These are the tables the attack->detection exercises query.

## Portfolio evidence (no secrets)
- `terraform plan`/`apply` showing public->private transition.
- `az container list` output: all Private.
- nmap + curl results from Kali proving private reachability.
- Save under `screenshots/phase-02-03/`.

## Cost control
ACI bills per second while running. Between sessions:
```powershell
az container stop -g rg-redblue-lab -n aci-redblue-dvwa
az container stop -g rg-redblue-lab -n aci-redblue-juiceshop
az container stop -g rg-redblue-lab -n aci-redblue-kali
# or tear the whole lab down:  terraform destroy
```
Note: stopping Kali loses the installed tools; they reinstall on next start (boot command).

## Next step
Phase 6/7 are already deployed (Log Analytics + Sentinel). Next: a KQL parser function over
`ContainerInstanceLog_CL` and the first Sentinel analytics rules, then the first
attack -> detect -> investigate -> respond exercise.
