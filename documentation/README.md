# Project Documentation — Azure Red/Blue Team Lab

Easy-to-follow record of the whole lab, organized by the **project phases (0–16)**.
Each phase has its own folder with a `README.md` explaining, in plain English:
**what it is, why it matters, the commands, and how we know it works.**

## Lab in one sentence

An isolated, private Azure lab where a **Kali attacker container** attacks two intentionally
vulnerable apps (**DVWA** + **OWASP Juice Shop**) running as **private ACI containers**, while
the **Blue Team** detects, investigates, and responds using **Log Analytics + Microsoft
Sentinel** fed by container logs.

## Architecture (as built)

```
                 Azure subscription (rg-redblue-lab, westus3)
   VNet vnet-redblue-lab  10.20.0.0/16
   ┌─────────────────────────────┐        ┌──────────────────────────────┐
   │ snet-attacker 10.20.2.0/24   │  NSG   │ snet-aci 10.20.1.0/24         │
   │   aci-redblue-kali 10.20.2.4 │ ─────► │   aci-redblue-dvwa  10.20.1.4 │ :80
   │   (nmap, sqlmap, hydra,      │ only   │   aci-redblue-juice 10.20.1.5 │ :3000
   │    nikto, curl)              │ attacker│                              │
   └─────────────────────────────┘ →victim└──────────────────────────────┘
                   │                                      │
                   └──────── stdout/stderr logs ──────────┘
                                     ▼
              Log Analytics  law-redblue-lab  (ContainerInstanceLog_CL)
                                     ▼
                       Microsoft Sentinel (detection / hunting KQL)
                                     +
                       AzureActivity (control-plane events)
```

## Phase status (current state)

Legend: ✅ done · 🟡 partial · ⏳ in progress · ⛔ blocked · ⬜ pending

| Phase | Topic | Status | Plain-English meaning |
|------|-------|--------|-----------------------|
| [0](phase-00-account-and-cost/) | Azure account + budget alerts + cost guardrails | ✅ done | Account set up with a spending cap so the lab can't surprise-bill. |
| [1](phase-01-resource-group-and-terraform/) | Resource group + Terraform skeleton | ✅ done | One container (`rg-redblue-lab`) holds everything; built as code. |
| [2](phase-02-network/) | VNet / subnets / NSGs (private, Option A) | ✅ done | Private net `10.20.0.0/16`; firewall lets **only** Kali reach the victims. |
| [3](phase-03-victim-apps/) | Victim apps (DVWA + Juice Shop) on ACI | ✅ done | The two hackable apps run as private containers (`10.20.1.4` / `.5`). |
| [4](phase-04-kali-attacker/) | Kali attacker + connectivity | ✅ done | Attacker box `10.20.2.4`; shell access + reachability verified. |
| [5](phase-05-windows-endpoint/) | Windows endpoint VM (JIT, no public IP) | ⛔ blocked (quota denied) | VM quota is 0; increase request **denied by Azure**. This is exactly why the lab uses containers. Not needed for the web-app attacks. |
| [6](phase-06-log-analytics/) | Log Analytics workspace + logs | ✅ done | Central log store `law-redblue-lab`; container + activity logs flowing. |
| [7](phase-07-sentinel/) | Microsoft Sentinel + connectors | 🟡 partial | Sentinel + Azure Activity live; Defender connectors still to add. |
| [8](phase-08-entra-id/) | Entra ID: RBAC / MFA / Conditional Access | 🟡 partial | **MFA now enforced via Security Defaults** (found it was off, turned it on). RBAC review + granular Conditional Access still pending. |
| [9](phase-09-defender/) | Defender for Cloud + Defender for Endpoint/XDR | ⬜ pending | Free CSPM tier works without a VM; not wired in yet. |
| [10](phase-10-kql-foundations/) | KQL foundations | ✅ done | Activity-Log hunting queries written + verified. |
| [11-13](phase-11-13-attack-detect-respond/) | Attack → detect → investigate → respond exercise | ✅ done | **SQLi exercise COMPLETE** — full A→B→C→D cycle, verified. (Scope: one representative exercise, per the SOC goal.) |
| [14](phase-14-detection-engineering/) | Sentinel detection engineering | ✅ done | Built a scheduled analytics rule that fired High incidents automatically, then tuned it (150→1). |
| [15](phase-15-incident-response/) | Incident response + remediation | ✅ done | Full IR lifecycle executed on the SQLi incident: triage → contain → eradicate → recover → lessons. |
| [16](phase-16-portfolio/) | Portfolio packaging + final report | ⬜ pending | Package the evidence into a shareable write-up. |

> **Change from the earlier plan:** Phases 11–13 were listed as *"blocked on ACI log pipeline."*
> That blocker is now **cleared** — we proved DVWA's web logs reach Sentinel this session (see
> Phase 11–13 folder, "Log pipeline verification"). The attack exercises are running.

## Where the work is today

- Phases **0–10** = the **build** (lab infrastructure) — done, bar the quota-denied Windows VM (5).
- Phases **11–13** = the **use** (attack + defend) — **SQLi exercise complete (full A→B→C→D)**.
- Phase **14** (detection engineering) and **15** (incident response) — **done** off the SQLi exercise.
- Phase **16** (portfolio packaging + final report) — the remaining step.

**The SOC loop is fully demonstrated:** telemetry → hunting (KQL) → detection engineering
(analytics rule + tuning) → incident → investigation → response. Phase 16 packages it.

## How to read any phase folder

Each phase folder contains three things:
- `README.md` — the write-up (what / why / commands / verified result / next).
- `screenshot-guideline.txt` — the exact shots to capture for that phase + redaction rules.
- `screenshots/` — where you save the actual images for that phase.

Every phase README follows the same shape:
1. **What this phase is** — one plain sentence.
2. **Why it matters** — the reason behind it.
3. **Commands** — exact PowerShell (host) or bash (inside Kali), each block labelled.
4. **Verified result / Results to fill in** — the real evidence it worked.
5. **Next** — where to go next.

Shared placeholders:
- `$ws` = Log Analytics workspace GUID (`5f251dad-c3ae-4cbf-ae8c-88ec26ff4be0`).
- Private IPs: DVWA `10.20.1.4`, Juice Shop `10.20.1.5`, Kali `10.20.2.4`.
- Everything lives in resource group `rg-redblue-lab`, region `westus3`.

## Safety / ethics (applies to every phase)

All offensive actions target intentionally vulnerable apps the lab owner built and owns,
inside a private VNet with **no public ingress**. Nothing here touches third-party or
production systems.
