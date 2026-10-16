# Phase 3 — Victim Apps (DVWA + Juice Shop) on ACI

**Status:** ✅ done — private IPs `10.20.1.4` / `10.20.1.5`

## What this phase is
Deploying the two intentionally vulnerable web apps as private Azure Container Instances inside
the victim subnet.

## Why it matters
These are the targets. Two apps are used on purpose because they cover different ground:
- **DVWA** `10.20.1.4:80` — classic, tunable vulns with a difficulty slider (SQLi, XSS, brute
  force, file inclusion).
- **OWASP Juice Shop** `10.20.1.5:3000` — a modern SPA covering categories DVWA lacks (IDOR,
  JWT/crypto, SSRF).

Both are **private** — no public IP — so they can only be attacked from inside the VNet.

## Why containers instead of VMs
The subscription's VM quota (Bsv2) is **0**, so victim VMs can't be deployed. ACI runs the same
apps with no VM quota, and bills only per second while running.

## What was built (Terraform `containers.tf`)
- `aci-redblue-dvwa` — image `vulnerables/web-dvwa`, private `10.20.1.4`, port 80.
- `aci-redblue-juiceshop` — image `bkimminich/juice-shop`, private `10.20.1.5`, port 3000.
- Both stream stdout/stderr to `law-redblue-lab` via the `diagnostics` block (this is what makes
  Phase 11–13 detection possible).

## Verify
```powershell
az container list -g rg-redblue-lab --query "[].{name:name, ip:ipAddress.ip, type:ipAddress.type}" -o table
```
Expect DVWA and Juice Shop both `Private`.

## Reference
`docs/phase-03-victim-aci-containers.md`, `docs/phase-02-03-network-and-victims.md`, `terraform/containers.tf`.

## Next
Phase 4 — the Kali attacker + connectivity.
