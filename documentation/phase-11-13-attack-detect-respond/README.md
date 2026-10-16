# Phase 11–13 — Attack → Detect → Investigate → Respond

**Status:** ✅ SQLi exercise COMPLETE (full A→B→C→D cycle executed and verified)

## What this phase is
The core of the lab: run a real attack from Kali against a victim app, then detect, investigate,
and respond using Log Analytics + Microsoft Sentinel. The completed exercise is **SQL injection
(OWASP A03) against DVWA**.

## Why it matters
This is where the whole build pays off and the SOC story is proven: attack safely → see it in
the logs → work it like an analyst → close it out. The focus of this lab is **SOC capability
across an Azure environment**, so one thoroughly executed exercise (rather than all 10 OWASP
categories) is the deliberate scope.

## ⭐ Log pipeline milestone (the former blocker — cleared)
DVWA's full Apache access logs reach Sentinel. Verified line:
```
10.20.2.4 - - [15/Oct/2026:09:03:12 +0000] "GET /login.php?probe=KIRO_LOGTEST_001 HTTP/1.1" 200 1937 "-" "curl/8.22.0"
```
Source IP (attribution), full URL+query (payloads visible), status, and User-Agent (sqlmap
signature) are all captured — which is what made the whole detection half possible.

---

## A — ATTACK (SQL injection on DVWA, MITRE T1190)
Screenshots: `screenshots/sqli/A01..A07`.

- **Gotcha hit + fixed:** first login failed because the DVWA database was not initialized
  (`A02`). Running `setup.php` "Create / Reset Database" fixed it (`A03`).
- **Manual proof:** `1' OR '1'='1` returned all 5 users from a single `id` — injection confirmed.
- **sqlmap stage 1 (`--dbs`):** confirmed injection via **4 techniques** (boolean-blind,
  error-based, time-based, UNION); back-end **MySQL ≥ 5.1 (MariaDB)**, Apache 2.4.25, Debian 9.
  Databases enumerated: **`dvwa`**, `information_schema`.
- **sqlmap stage 2 (`-D dvwa -T users --dump`):** dumped the users table and **cracked all 5
  passwords**:

  | user | cracked password |
  |------|------------------|
  | admin | password |
  | gordonb | abc123 |
  | 1337 | charley |
  | pablo | letmein |
  | smithy | password |

- **Attack cost:** ~176 HTTP requests in the enumeration burst (vs a baseline of ~1/min).

## B — DETECT (Sentinel hunting)
Screenshots: `screenshots/sqli/B01..B06`.

- **Volume spike:** baseline ~1 req/min → **176 req/min** during the attack (a ~176x spike).
- **Tool signature:** 176 + 17 requests carried the **sqlmap** User-Agent — a high-confidence
  signal that essentially every attack request self-identified.
- **Payload signatures:** `UNION SELECT`, `EXTRACTVALUE`, `SLEEP(`, `information_schema`, `%27`
  all present in the request URLs.
- The attack went from a Kali command to a visible, queryable event in Sentinel.

## C — INVESTIGATE
Screenshots: `screenshots/sqli/C01..C04`.

- **Timeline:** first manual probe → sqlmap enumeration burst → users dump, reconstructed in KQL.
- **Attribution:** single source IP **`10.20.2.4`** (the Kali attacker) responsible for the burst.
- **Scope:** `dvwa.users` fully exposed → **5 accounts compromised**, all passwords cracked =
  full credential disclosure.
- **Pivot check:** `AzureActivity` reviewed — no control-plane escalation from the attack window
  (only legitimate admin activity). The habit of checking matters even when clean.

## D — RESPOND + detection tuning
Screenshots: `screenshots/sqli/D01..D12`.

- **Contain:** stopped the DVWA container to cut access (lab equivalent of blocking the source
  IP / taking the app offline behind a WAF).
- **Eradicate (documented):** treat all 5 cracked credentials as compromised → rotate; reset the
  DVWA database to a clean baseline.
- **Harden (the real lesson):** parameterized queries / prepared statements (the code-level fix),
  a WAF in front of the app (Azure App Gateway / Front Door managed rules), and a least-privilege
  DB account that cannot read `information_schema`.
- **Detect better:** built a **scheduled Sentinel analytics rule** (see Phase 14) that fired
  **High-severity incidents** automatically. The naive rule produced ~**150 near-duplicate
  incidents** (alert fatigue) — tuned with **event grouping** down to a single incident per burst.
- **Close:** all incidents resolved, classified **True Positive** (it was our authorized test).

---

## Exercise tracker
| # | OWASP | App | Attack | Status |
|---|-------|-----|--------|--------|
| 03 | A03 Injection | DVWA | SQL injection | ✅ complete (A→B→C→D) |
| 01 | A01 Broken Access Control | Juice Shop | IDOR | ⬜ not pursued (out of scope — SOC goal met with SQLi) |
| 02, 04–10 | — | — | — | ⬜ not pursued |

> **Scope decision:** the lab's goal is demonstrating SOC capability across Azure, not
> exhausting the OWASP Top 10. The SQLi exercise exercises the full SOC loop end to end, so it
> stands as the representative, complete demonstration.

## Reference
Attack playbooks: `attacks/03-injection-sqli/`, `attacks/01-broken-access-control/`.
Detection KQL: `detections/kql/`. Detection engineering: Phase 14. Incident response: Phase 15.

## Next
Phase 14 (detection engineering — done) and Phase 15 (incident response — done) are the SOC
follow-through; Phase 16 packages it into the final report.
