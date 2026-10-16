# 01 — Broken Access Control (OWASP A01)

**Target app:** OWASP Juice Shop, running on the Linux victim VM (port 3000).
**Attack type:** IDOR / horizontal privilege escalation (accessing another user's data by
changing an identifier).
**Attacker:** local Kali VM (Burp Suite, `curl`), from the home IP allowlisted on the NSG.
**Defender products:** Microsoft Sentinel (Activity + collected app logs), Defender for Cloud.

> **Scope / ethics:** Juice Shop is an intentionally vulnerable app you own, reachable only from
> your home IP. No third-party systems are involved.

---

## Attack phase

**Goal:** read another user's basket / order data by manipulating an object reference, without
authorization for that object.

1. Confirm reachability from Kali:
   ```bash
   curl -s http://<victim-public-ip>:3000/ -o /dev/null -w "%{http_code}\n"
   ```
2. Register/log in as a normal user in Juice Shop; capture your JWT (the app stores it and sends
   it as `Authorization: Bearer <token>`).
3. Observe your own basket id in requests (e.g. `GET /rest/basket/<id>`), via Burp.
4. **IDOR:** change the basket id to another value and replay with *your* token:
   ```bash
   curl -s http://<victim-public-ip>:3000/rest/basket/2 \
     -H "Authorization: Bearer <your-jwt>"
   ```
   Returning another user's basket contents = broken access control confirmed.
5. Escalate: enumerate ids sequentially to harvest multiple users' data.

**Telemetry generated:**
- Repeated authenticated requests to `/rest/basket/<id>` with incrementing ids from one source
  IP (your home IP) — visible if app logs are collected to `law-redblue-lab`.
- No failed-auth events (the token is valid) — this is what makes IDOR hard to see: it looks
  like legitimate authenticated traffic.

---

## Detection phase

IDOR is **behavioral**, not signature-based — the requests are individually valid. Detect the
*pattern*: one identity accessing many distinct object ids quickly.

```kql
// Many distinct object references accessed by one source in a short window (requires app logs)
Syslog
| where TimeGenerated > ago(1h)
| where SyslogMessage has "/rest/basket/"
| extend basketId = extract(@"/rest/basket/(\d+)", 1, SyslogMessage)
| where isnotempty(basketId)
| summarize DistinctBaskets = dcount(basketId), Total = count() by HostName, bin(TimeGenerated, 5m)
| where DistinctBaskets > 5
| sort by DistinctBaskets desc
```

**MITRE ATT&CK:** T1190 (Exploit Public-Facing Application); behaviorally relates to
T1087 (Account Discovery) via object enumeration.
**OWASP:** A01:2021 Broken Access Control.

**Honest detection gap:** Without application logs that include the requested object id, Azure
has essentially **no** visibility into IDOR — NSG/flow logs only show connection volume, not which
object was accessed, and the auth is valid so there are no failures to alert on. The lesson: IDOR
is primarily prevented in code (server-side authorization checks), and detection requires
app-level logging. Document this honestly.

---

## Investigation phase

1. Confirm the source IP = your Kali/home IP (expected in lab).
2. Timeline the id enumeration: sequential/`dcount` spike over minutes.
3. Determine scope: which baskets/users were accessed → data exposure assessment.
4. Check `AzureActivity` for any attempt to pivot into Azure control-plane from the same IP/window:
   ```kql
   AzureActivity
   | where TimeGenerated > ago(2h)
   | project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ActivityStatusValue
   | sort by TimeGenerated desc
   ```

---

## Response phase

1. **Contain:** tighten NSG to cut access while investigating.
2. **Eradicate:** invalidate exposed sessions/JWTs; treat accessed accounts' data as exposed.
3. **Harden (the real lesson):**
   - Enforce **server-side authorization** on every object reference (the actual fix for IDOR).
   - Use unpredictable identifiers (GUIDs) instead of sequential ints to blunt enumeration.
   - Collect application logs so object-level access is *visible* to Sentinel.
4. **Detect better:** turn the `dcount(basketId)` KQL into a scheduled analytics rule
   (Phase 14), entity map HostName/SrcIP, severity Medium–High.

---

## Lab-specific KQL (quick reference)

```kql
// Rate of basket-object access per source (requires app logs)
Syslog
| where TimeGenerated > ago(24h)
| where SyslogMessage has "/rest/basket/"
| summarize Requests = count() by bin(TimeGenerated, 10m)
| render timechart
```

> Status: playbook ready. Execution steps run during Phase 11–13 once the victim VM is deployed
> (currently blocked on the Bsv2 vCPU quota). The AzureActivity queries already return live data.
