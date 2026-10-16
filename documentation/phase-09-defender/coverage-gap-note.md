# Honest Coverage-Gap Note — What Defender Does NOT Catch

> This note is deliberate portfolio evidence. Knowing the limits of your tooling is a core
> Blue Team skill. Screenshot this file (or include it directly) as Phase 9 shot 5.

## The gap in one sentence

**Microsoft Defender for Cloud does NOT detect application-layer SQL injection against the DVWA
container — it only reports the resource's posture, not the malicious web requests. The SQLi is
only visible because the web access logs are collected into Log Analytics / Sentinel.**

## Why Defender for Cloud misses app-layer SQLi

Defender for Cloud (the free CSPM tier running in this lab) works at the **cloud resource
posture** level. It answers questions like:
- Is this resource exposed to the internet?
- Is encryption / logging / a WAF configured?
- Does the configuration match security best practice?

It does **not** read the HTTP request bodies hitting an app inside a container. A payload like
`?id=1' OR '1'='1` is invisible to it — that is application-layer traffic, not a control-plane
or posture signal. Defender for Cloud will happily report the DVWA container's posture while an
active SQLi runs through it unnoticed.

## Why Defender for Endpoint also misses it (here)

Defender for Endpoint (EDR) detects malicious behavior **on a device's operating system**
(process trees, suspicious binaries, on-host activity). Two reasons it doesn't help with this
attack:
1. There is **no onboarded endpoint** — the Windows VM was blocked by the Bsv2 quota denial
   (see Phase 5), so there is no device sending EDR telemetry at all.
2. Even if a device existed, SQLi is a **web-request** attack against an app, not host-level
   malware — it is outside what EDR is designed to catch.

## What DOES catch the SQLi (and why)

The attack is detectable in this lab **only** because of the telemetry pipeline built in
Phases 3 and 6:
- DVWA's Apache **access logs** are written to the container's stdout.
- ACI ships stdout to **Log Analytics** as `ContainerInstanceLog_CL`.
- **Sentinel** (Phase 7) hunts those logs with KQL for SQLi payloads, the sqlmap User-Agent,
  and request-volume spikes (Phase 11-13 detection step).

Proof the pipeline works (captured this session):
```
10.20.2.4 - - [15/Oct/2026:09:03:12 +0000] "GET /login.php?probe=KIRO_LOGTEST_001 HTTP/1.1" 200 1937 "-" "curl/8.22.0"
```
The full request path, query string, and User-Agent are all present — that is what makes SQLi
detectable here.

## The lesson (the point of documenting this)

| Layer | Tool | Catches the SQLi? |
|-------|------|-------------------|
| Cloud posture | Defender for Cloud (CSPM) | ❌ No — reports config, not payloads |
| Endpoint / OS | Defender for Endpoint (EDR) | ❌ No — and no endpoint exists anyway |
| Application logs | Log Analytics + Sentinel KQL | ✅ Yes — only because web logs are collected |

**Takeaway:** detection coverage is only as good as the telemetry you collect. Defender is
powerful at posture and endpoint layers, but **app-layer attacks require app-layer logging**.
The defensive fix (beyond logging) is a **WAF** in front of the app and **parameterized
queries** in the code — both documented in the Phase 11-13 response step.

---

*MITRE ATT&CK: T1190 (Exploit Public-Facing Application). OWASP: A03:2021 Injection.*
