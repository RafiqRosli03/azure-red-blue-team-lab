# KQL Foundations — Azure Activity Log

These queries run against the **`AzureActivity`** table in `law-redblue-lab`, which is already
being fed by the subscription Activity Log diagnostic setting (Phase 7). They work **right now**
— no victim VM required — so they are the first hands-on detection content in the lab.

> **How to run:** Portal → Microsoft Sentinel → `law-redblue-lab` → **Logs**, paste a query, Run.
> First data can take ~5–15 minutes to appear after the diagnostic setting is created.

`AzureActivity` records **control-plane** events — who did what to which Azure resource. It is
the Blue Team baseline for spotting suspicious infrastructure changes (a popped account creating
VMs, opening NSGs, or assigning roles).

Key fields used below:
- `TimeGenerated` — when the event happened (UTC).
- `OperationNameValue` — the ARM operation, e.g. `MICROSOFT.COMPUTE/VIRTUALMACHINES/WRITE`.
- `ActivityStatusValue` — `Success`, `Failure`, `Start`, `Accept`.
- `Caller` — the identity (UPN or object ID) that performed the action.
- `CallerIpAddress` — source IP of the request.
- `ResourceGroup`, `_ResourceId` — the target resource.

---

## 1. Beginner — "What happened in my subscription?"
Baseline situational awareness. Run this first to see what normal looks like.

```kql
AzureActivity
| where TimeGenerated > ago(24h)
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ActivityStatusValue, ResourceGroup
| sort by TimeGenerated desc
```
**Detects:** nothing by itself — it establishes your baseline. Note the normal `Caller`
(your own account) and `CallerIpAddress` (your home IP). Anything else later is suspicious.

---

## 2. Beginner — Resource creation events
Attackers who gain access often create resources (VMs for crypto-mining, storage for
exfiltration).

```kql
AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue endswith "WRITE"
| where ActivityStatusValue == "Success"
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, _ResourceId
| sort by TimeGenerated desc
```
**Detects:** any successful create/update. In the lab, you will see your own
`MICROSOFT.NETWORK/...` and `MICROSOFT.COMPUTE/...WRITE` events — the legitimate baseline you
recorded while building. An unexpected VM create from an unknown caller/IP is the alert.
**MITRE:** T1578 (Modify Cloud Compute Infrastructure).

---

## 3. Intermediate — NSG / firewall rule changes
The lab's perimeter is the home-IP NSG allowlist. An attacker widening it (e.g. to `0.0.0.0/0`)
is a strong compromise signal.

```kql
AzureActivity
| where TimeGenerated > ago(7d)
| where OperationNameValue has "NETWORKSECURITYGROUPS" or OperationNameValue has "SECURITYRULES"
| where ActivityStatusValue in ("Success", "Start")
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ResourceGroup, _ResourceId
| sort by TimeGenerated desc
```
**Detects:** NSG or security-rule writes/deletes. Correlate `Caller`/`CallerIpAddress` against
your known values. **MITRE:** T1562.007 (Impair Defenses: Disable or Modify Cloud Firewall).

---

## 4. Intermediate — Failed control-plane operations (recon / probing)
A burst of `Failure` events from one caller can indicate an attacker probing permissions
(enumerating what they can do with stolen creds).

```kql
AzureActivity
| where TimeGenerated > ago(24h)
| where ActivityStatusValue == "Failure"
| summarize FailCount = count(), Ops = make_set(OperationNameValue, 10) by Caller, CallerIpAddress
| where FailCount > 5
| sort by FailCount desc
```
**Detects:** permission-enumeration / authorization failures at volume. Threshold `> 5` is a
lab starting point — tune to your baseline. **MITRE:** T1087 / T1526 (Account & Cloud Discovery).

---

## 5. Advanced — Role assignment changes (privilege escalation)
Granting a role is how an attacker makes access persistent. In a tiny lab this should be
almost never, so any hit deserves attention.

```kql
AzureActivity
| where TimeGenerated > ago(7d)
| where OperationNameValue has "ROLEASSIGNMENTS/WRITE" or OperationNameValue has "ROLEASSIGNMENTS/DELETE"
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ActivityStatusValue, _ResourceId
| sort by TimeGenerated desc
```
**Detects:** RBAC role grants/removals. **MITRE:** T1098 (Account Manipulation),
T1078 (Valid Accounts). Pair with an Entra ID sign-in query (Phase 8) for full context.

---

## 6. Advanced — New source IP for an existing caller
Catches a known account suddenly acting from an unfamiliar IP — a classic sign of stolen
credentials being used from elsewhere.

```kql
let knownIps =
    AzureActivity
    | where TimeGenerated between (ago(14d) .. ago(1d))
    | summarize by CallerIpAddress;
AzureActivity
| where TimeGenerated > ago(1d)
| where isnotempty(CallerIpAddress)
| where CallerIpAddress !in (knownIps)
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ResourceGroup
| sort by TimeGenerated desc
```
**Detects:** control-plane activity from an IP not seen in the prior 14-day baseline.
**MITRE:** T1078 (Valid Accounts). In this lab your baseline IP is your home IP — a hit means
either your ISP IP rotated (benign) or someone else is using your identity (not benign).

---

## Notes for turning these into Sentinel analytics rules (Phase 14)
- Queries 2, 3, 5, 6 map cleanly to **scheduled analytics rules** (run every 1h, lookback 1h/1d).
- Add **entity mappings**: `Caller` → Account, `CallerIpAddress` → IP, `_ResourceId` → Azure resource.
- Set severity by blast radius: role assignment / NSG-open = High; failed-ops burst = Medium.
- Suppress your own known IP + account to cut false positives (document the suppression).
