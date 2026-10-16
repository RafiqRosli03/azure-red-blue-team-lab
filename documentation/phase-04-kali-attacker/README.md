# Phase 4 — Kali Attacker + Connectivity

**Status:** ✅ done — in-VNet ACI `10.20.2.4`, exec access, reachability verified

## What this phase is
Standing up the attacker — a Kali Linux container inside the attacker subnet — and confirming
it can actually reach the victim apps.

## Why it matters
This is the Red Team box. It needs the attack tools installed and a working path to the
victims, or no attack exercise can run. Because VNet-integrated ACI has no public IP, you reach
Kali with `az container exec` (a shell), not SSH.

## What was built (Terraform `containers.tf`)
- `aci-redblue-kali` — image `kalilinux/kali-rolling`, private `10.20.2.4`.
- Boots with the web-attack toolset installed: nmap, sqlmap, hydra, nikto, gobuster, ffuf, curl.
- Exposes a dummy port only to satisfy the ACI API — nothing listens, no NSG rule allows it in.

## Daily use

Open a Kali shell (PowerShell on host):
```powershell
az container exec -g rg-redblue-lab -n aci-redblue-kali --exec-command "/bin/bash"
```

Confirm tools (inside Kali):
```bash
command -v nmap sqlmap hydra nikto curl
```

Confirm reachability to both victims (inside Kali):
```bash
curl -s -o /dev/null -w "DVWA  %{http_code}\n"  http://10.20.1.4/login.php
curl -s -o /dev/null -w "JUICE %{http_code}\n"  http://10.20.1.5:3000/
```

## Verified result (this session)
```
tools: /usr/bin/nmap /usr/bin/sqlmap /usr/bin/hydra /usr/bin/nikto /usr/bin/curl
DVWA  200
JUICE 200
```
Full attack path confirmed: Kali (10.20.2.4) → NSG → victims (10.20.1.4 / .5).

## Gotcha
A plain `az container stop` can wipe Kali's tools (they come from the boot command). If
`command -v` shows them missing after a restart, reinstall:
```bash
apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y nmap sqlmap hydra nikto gobuster ffuf curl
```

## Reference
`docs/phase-04-kali-attacker.md`, `terraform/containers.tf`.

## Next
Phase 6 — Log Analytics workspace (Phase 5 is blocked; see its folder).
