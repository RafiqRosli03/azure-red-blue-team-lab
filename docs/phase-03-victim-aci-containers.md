# Phase 3 (container edition) — Victim apps on Azure Container Instances

## Objective
Run the two intentionally vulnerable apps (DVWA + OWASP Juice Shop) in Azure so attacks happen
against cloud-hosted targets — using **Azure Container Instances (ACI)** instead of a VM.

## Why ACI (the key decision)
The original plan was a Linux VM, but this new PAYG subscription has a **Bsv2 (and all VM-family)
vCPU quota of 0** that could not be auto-raised (requires Microsoft support review). ACI uses a
**separate quota** (`Microsoft.ContainerInstance`) that is available, so it **bypasses the VM
capacity block entirely**. A test container confirmed ACI deploys fine before we committed.

This is the Azure equivalent of AWS Fargate: serverless containers, no VM to manage, no VM quota.

## Architecture
```
rg-redblue-lab (westus3)
├── aci-redblue-dvwa       -> DVWA        public IP + FQDN, port 80
├── aci-redblue-juiceshop  -> Juice Shop  public IP + FQDN, port 3000
├── law-redblue-lab        -> Log Analytics workspace
└── Microsoft Sentinel + Azure Activity connector
```

## Deployed resources (Terraform: `terraform/containers.tf`)
- `azurerm_container_group.dvwa` — `vulnerables/web-dvwa:latest`, 1 vCPU / 1.5 GB, port 80
- `azurerm_container_group.juiceshop` — `bkimminich/juice-shop:latest`, 1 vCPU / 1.5 GB, port 3000
- `random_string.dns` — unique suffix for globally-unique DNS labels

## Access (from last apply — IPs/FQDN change on recreate)
- DVWA: `http://redblue-dvwa-<suffix>.westus3.azurecontainer.io/` (login `admin`/`password`)
- Juice Shop: `http://redblue-juiceshop-<suffix>.westus3.azurecontainer.io:3000/`
- Current values: `terraform output`

## Verification
- [ ] `terraform output dvwa_url` / `juiceshop_url` return FQDNs.
- [ ] Both return HTTP 200:
  ```powershell
  curl.exe -s -o NUL -w "DVWA %{http_code}`n"  <dvwa_url>login.php
  curl.exe -s -o NUL -w "Juice %{http_code}`n" <juiceshop_url>
  ```

## Cost
- ACI bills per vCPU-second + GB-second **while running**: ~a few cents/hour for both groups.
- **$0 when destroyed.** Tear down between sessions: `terraform destroy`.
- No disks, no public-IP standing charge like the VM would have had.

## Security / exposure (important)
- These apps are **deliberately vulnerable** and here they are **public** (public IP + FQDN).
- Keep sessions short; **`terraform destroy` when done**; never leave running unattended.
- Hardening option (later): VNet-integrated ACI + NSG to lock inbound to your home IP only.

## Detection note (Blue Team scope)
- ACI control-plane events (container group create/delete) appear in **AzureActivity** → queryable
  in Sentinel now.
- Application-layer attack traffic (SQLi/XSS/IDOR) is **not** captured by default; to detect those,
  enable ACI diagnostics / container logs to `law-redblue-lab` (future enhancement).

## Teardown
```powershell
terraform destroy        # removes both container groups (keeps nothing billable)
# or target just the victims:
terraform destroy -target=azurerm_container_group.dvwa -target=azurerm_container_group.juiceshop
```

## Next step
Run the attack exercises (`attacks/01`, `attacks/03`) against the ACI FQDNs, then wire ACI
container logs into Sentinel so the app-layer attacks become detectable.
