# SQLi Exercise — Screenshot Index (OWASP A03, DVWA)

24 screenshots documenting the full attack → detect → investigate → respond cycle for the SQL
injection exercise against the DVWA container. Named by phase (A/B/C/D) + sequence.

## A — Attack (Red Team)
| File | What it shows |
|------|---------------|
| `A01-setup-csrf-token-ok.png` | CSRF token + session extracted successfully |
| `A02-login-fail-db-not-setup.png` | Login failed — DVWA database not yet initialized (the footgun) |
| `A03-login-ok-manual-injection.png` | After DB setup: login OK + manual `' OR '1'='1` returns all 5 users |
| `A04-sqlmap-stage1-run.png` | sqlmap stage 1 launched (`--dbs`) |
| `A05-sqlmap-stage1-databases.png` | sqlmap confirmed injection + enumerated databases (`dvwa`, `information_schema`) |
| `A06-sqlmap-stage2-run.png` | sqlmap stage 2 launched (`-D dvwa -T users --dump`) |
| `A07-sqlmap-users-dumped-cracked.png` | **Impact:** all 5 users dumped + passwords cracked |

## B — Detect (Blue Team hunting)
| File | What it shows |
|------|---------------|
| `B01-detect-overview.png` | Blue Team detection overview |
| `B02-detect-attack-surface-view.png` | Alternate view of the attack surface |
| `B03-detect-sentinel-kql-logs.png` | Sentinel Logs — KQL detection over ContainerInstanceLog_CL |
| `B04-defender-incident-response.png` | Defender portal — incident response view |
| `B05-defender-incidents-detected.png` | Defender — incidents detected from the rule |
| `B06-incident-sample-list.png` | Sample list of generated incidents |

## C — Investigate
| File | What it shows |
|------|---------------|
| `C01-investigate-timeline.png` | Attack timeline built in KQL (probe → enumeration → dump) |
| `C02-investigate-attribution-srcip.png` | Attribution — source IP confirmed |
| `C03-investigate-azureactivity-pivot.png` | Pivot check — did the attacker touch the Azure control plane? |
| `C04-incident-detail-kali-ip.png` | Incident detail showing the Kali attacker IP (10.20.2.4) |

## D — Respond + detection tuning
| File | What it shows |
|------|---------------|
| `D01-respond-contain-stop-dvwa.png` | Containment — DVWA container stopped |
| `D02-respond-close-incidents.png` | Closing the incident queue |
| `D03-respond-incidents-updated.png` | Incidents being updated/resolved |
| `D04-respond-incidents-resolved.png` | Incidents resolved (True Positive) — queue cleared |
| `D10-rule-tuning-1.png` | Tuning the analytics rule — event grouping (1/2) |
| `D11-rule-tuning-2.png` | Tuning the analytics rule — event grouping (2/2) |
| `D12-rule-tuned-single-incident.png` | Result: rule now produces 1 unified incident instead of 150 |

## Key results captured
- Injection confirmed via 4 techniques (boolean/error/time-based/UNION); back-end MySQL/MariaDB.
- `dvwa.users` fully dumped; all 5 passwords cracked (password, abc123, charley, letmein, password).
- Volume spike: baseline ~1 req/min → 176 req/min during the sqlmap burst.
- Automatic Sentinel analytics rule fired High-severity incidents (T1190).
- Alert-fatigue lesson: initial rule produced ~150 incidents; tuned with event grouping to 1.
