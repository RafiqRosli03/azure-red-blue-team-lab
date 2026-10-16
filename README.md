# Azure Red Team + Blue Team Cybersecurity Lab

An isolated, legal, cost-controlled Azure laboratory for hands-on Red Team (attack) and
Blue Team (detect / investigate / respond) learning using the Microsoft security stack.

> **Authorized lab only.** Every offensive action in this project targets intentionally
> vulnerable systems that I built and own inside this lab. Nothing here is intended for,
> or to be used against, any third-party or production system.

![Azure Red Team and Blue Team private ACI lab architecture](architecture/lab-architecture.png)

*Private VNet-integrated ACI attack, telemetry, Microsoft Sentinel, and SOC workflow architecture.*

## What this lab demonstrates

- **Red Team:** reconnaissance and web-app exploitation from a local Kali Linux VM against
  intentionally vulnerable apps (DVWA + OWASP Juice Shop) running in Azure.
- **Blue Team:** detection, investigation, and response using Microsoft Defender for Cloud,
  Defender for Endpoint, Defender XDR, Microsoft Sentinel, Entra ID logs, and KQL.
- **Detection engineering:** turning hunting queries into Sentinel analytics rules with
  MITRE ATT&CK and OWASP mappings.

## Tier & cost model

- **Tier B** build: one Linux victim VM (Docker: DVWA + Juice Shop) + one Windows endpoint VM.
- **Kali runs locally** (VirtualBox/VMware) — kept off Azure billing and off Azure's
  offensive-use surface.
- Target cost over a few days of disciplined use: **~RM0** (approx. $10–15 of the $200 free
  credit). See `docs/00-cost-and-licensing.md`.

## Architecture

The rendered diagram is shown above. See the [architecture notes](architecture/README.md),
[editable draw.io source](architecture/lab-architecture.drawio), and
[scalable SVG](architecture/lab-architecture.svg).

## Build order (phases)

> **Architecture note:** the lab uses **container-based (ACI)** victims because this PAYG
> subscription has a VM-family (Bsv2) vCPU quota of 0. Option A hardening is now applied: all
> containers are **private, VNet-integrated**, with no public ingress. The Kali attacker runs
> inside the VNet and is reached via `az container exec`. See `docs/phase-02-03-...`.

| Phase | Topic | Status |
|------|-------|--------|
| 0 | Azure account + budget alerts + cost guardrails | done |
| 1 | Resource group + Terraform skeleton | done |
| 2 | VNet / subnets / NSGs (private, Option A) | done — VNet 10.20.0.0/16, delegated subnets, NSG attacker→victim only |
| 3 | Victim apps (DVWA + Juice Shop) on ACI | done — private IPs 10.20.1.4 / 10.20.1.5 |
| 4 | Kali attacker + connectivity | done — in-VNet ACI 10.20.2.4, exec access, reachability verified |
| 5 | Windows endpoint VM (JIT, no public IP) | blocked — VM quota (deferred; not needed for web-app attacks) |
| 6 | Log Analytics workspace + logs | done — ACI diagnostics + Activity Log flowing |
| 7 | Microsoft Sentinel + connectors | Sentinel + Azure Activity done; Defender connectors pending |
| 8 | Entra ID: RBAC / MFA / Conditional Access | pending (MFA enabled manually; phase not built) |
| 9 | Defender for Cloud + Defender for Endpoint/XDR | pending (DfC free CSPM tier works without a VM) |
| 10 | KQL foundations | Activity Log queries done + verified |
| 11–13 | 10 attack → detect → investigate → respond exercises | playbooks 01 + 03 drafted; **execution blocked on ACI log pipeline** |
| 14 | Sentinel detection engineering | pending |
| 15 | Incident response + remediation | pending |
| 16 | Portfolio packaging + final report | pending |

### Minimum path to "ready to attack" (current focus)
1. ✅ Honest status (this table)
2. ⏳ Wire ACI container logs → Log Analytics (so attacks are visible to Sentinel)
3. ⏳ Verify a victim request lands in a queryable table
4. ⏳ (recommended) Enable Defender for Cloud free CSPM tier

## Repository structure

```
azure-red-blue-team-lab/
├── README.md
├── docs/                  # cost, licensing, phase guides, troubleshooting
├── architecture/          # diagrams and design notes
├── terraform/             # Infrastructure-as-Code (primary deployment method)
├── azure-cli/             # equivalent CLI scripts
├── kali/                  # local Kali setup and tool notes
├── vulnerable-app/        # DVWA / Juice Shop setup and reset procedures
├── attacks/               # 01..10 OWASP attack mini-exercises
├── detections/            # sentinel/ defender/ kql/
├── incident-response/     # IR playbooks
├── screenshots/           # portfolio evidence (NO secrets)
├── reports/               # final project report
└── lessons-learned/
```

## Safety rules

- All offensive activity is confined to this lab's intentionally vulnerable assets.
- No real credentials, secrets, tokens, or personal data are committed to this repo.
- The vulnerable Linux VM's public IP is restricted by NSG to a single home IP address.
