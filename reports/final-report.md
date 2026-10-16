# Final Report — Azure Red Team + Blue Team SOC Lab

**Author:** Rafiq Rosli · **Date:** October 2026 · **Status:** Lab complete, torn down to $0

![Lab architecture](../architecture/lab-architecture.png)

---

## 1. Executive summary

This project built an isolated, cost-controlled Azure laboratory to demonstrate **Security
Operations Center (SOC) capability across a cloud environment** — the full loop of attacking a
target, detecting the attack in a SIEM, investigating it, responding, and engineering a standing
detection. A Kali Linux attacker and two intentionally vulnerable web applications (DVWA and
OWASP Juice Shop) run as **private, VNet-integrated Azure Container Instances** with no public
ingress. Microsoft Sentinel on a Log Analytics workspace provides the Blue Team telemetry and
detection plane.

The representative exercise — **SQL injection (OWASP A03 / MITRE T1190) against DVWA** — was
executed end to end: attack, detection, investigation, response, an automatic Sentinel analytics
rule, and detection tuning. The entire environment was then torn down to **$0**.

## 2. Objectives

- Stand up a legal, isolated attack/defend range on Azure at near-zero cost.
- Demonstrate the complete SOC lifecycle on a real attack, not a simulation.
- Practice detection engineering: turn a hunting query into an automatic incident rule.
- Document honestly, including constraints and detection gaps.

## 3. Architecture

- **Resource group** `rg-redblue-lab` (westus3) — single-command teardown.
- **VNet** `vnet-redblue-lab` `10.20.0.0/16`:
  - `snet-attacker 10.20.2.0/24` — Kali ACI (`10.20.2.4`).
  - `snet-aci 10.20.1.0/24` — DVWA (`10.20.1.4:80`), Juice Shop (`10.20.1.5:3000`).
- **NSG**: inbound to victims allowed **only** from the attacker subnet; deny all else.
- **No public ingress** anywhere; analyst reaches Kali via `az container exec`.
- **Blue Team**: `law-redblue-lab` Log Analytics + Microsoft Sentinel; container logs in
  `ContainerInstanceLog_CL`; control-plane events in `AzureActivity`.

Containers were chosen over VMs because the subscription's Bsv2 vCPU quota was 0 (and a quota
increase was denied) — see Limitations.

## 4. Red Team methodology (SQLi exercise)

1. Verified reachability and the log pipeline from Kali to DVWA.
2. Initialized DVWA, authenticated, set security to Low.
3. Manual proof: `1' OR '1'='1` returned all users (injection confirmed).
4. Automated with **sqlmap**: enumerated databases (4 injection techniques; MySQL/MariaDB), then
   dumped and **cracked all 5 users' passwords** from `dvwa.users`.
5. Attack generated ~176 requests in a burst versus a ~1/min baseline.

## 5. Blue Team detection

- **Volume spike**: baseline ~1 req/min → **176 req/min** (≈176× anomaly).
- **Tool signature**: the sqlmap User-Agent appeared on the attack requests.
- **Payload signatures**: `UNION SELECT`, `EXTRACTVALUE`, `SLEEP(`, `information_schema`.
- Detections written as KQL over `ContainerInstanceLog_CL` in Sentinel.

## 6. Investigation

- **Timeline** reconstructed: probe → enumeration → dump.
- **Attribution**: single source IP `10.20.2.4` (the Kali attacker).
- **Scope**: full credential disclosure of the application user store (5 accounts).
- **Pivot check**: `AzureActivity` showed no control-plane escalation.

## 7. Detection engineering (Phase 14)

A **scheduled Sentinel analytics rule** (`SQLi / sqlmap against DVWA`, severity High, T1190) was
built from the hunting query with the source IP mapped as an entity. It fired **High-severity
incidents automatically**. The naive rule produced ~150 near-duplicate incidents (alert fatigue);
**event grouping** was applied to collapse an attack burst into a single incident.

## 8. Incident response (Phase 15)

Full IR lifecycle: **Identify/Triage** (opened the incident, confirmed the attacker entity) →
**Contain** (stopped the DVWA container) → **Eradicate** (rotate exposed credentials, reset DB)
→ **Recover** (clean state, incidents resolved True Positive) → **Lessons learned**.

## 9. Identity hardening (Phase 8)

A gap was found — MFA was **not** enforced (sign-ins showed "Conditional access: Not applied").
**Security Defaults** was enabled, enforcing MFA tenant-wide (verified "protected by security
defaults").

## 10. Mappings

- **OWASP**: A03:2021 Injection.
- **MITRE ATT&CK**: T1190 Exploit Public-Facing Application.
- **Detection engineering**: KQL hunting → Sentinel scheduled analytics rule → incident.

## 11. Lessons learned

- **Telemetry choice drives detection.** The SQLi was only visible because web access logs were
  collected to Sentinel; Defender for Cloud (posture) and Endpoint (EDR) do not see app-layer
  SQLi. (See `documentation/phase-09-defender/coverage-gap-note.md`.)
- **Detection rules must be tuned, not just enabled** — the 150-incident flood proved it.
- **The real fix is preventive**: parameterized queries, a WAF, and a least-privilege DB account.
- **Document constraints honestly** — the denied VM quota became the rationale for a
  container-based design that met the same objectives.

## 12. Limitations

- **Scope**: one representative exercise (SQLi) rather than all 10 OWASP categories — sufficient
  to demonstrate the SOC loop.
- **No endpoint/EDR layer**: the Windows VM was blocked by a denied Bsv2 quota, so Defender for
  Endpoint behaviors are out of scope.
- **Defender connectors** appeared "connected" but data flow was not fully validated.

## 13. Future improvements

- Add IDOR (A01) on Juice Shop as a contrasting behavioral-detection exercise.
- Obtain VM quota (or use another subscription) to add an endpoint + Defender for Endpoint.
- Convert more hunting queries into tuned analytics rules; add automation playbooks.
- Deploy a WAF in front of the victims and re-run the attack to show the preventive control.

## 14. Teardown & cost

Entire environment deleted via `az group delete` → verified **$0** (no resources billing; empty
subscription does not bill). Security Defaults (free) remains enabled. All evidence retained
locally and in this repository.

---

*Evidence: see `documentation/` (per-phase READMEs + screenshots) and
`documentation/phase-11-13-attack-detect-respond/screenshots/sqli/` for the full exercise.*
