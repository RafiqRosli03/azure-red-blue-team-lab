# Phase 4 — Kali Attacker + Connectivity

## Objective
Stand up the attacker toolset and confirm it can reach the Azure victim apps.

## Design change from the original plan
The original Phase 4 was a **local Kali VM** connecting to the Azure **victim VM** through an
**NSG home-IP allowlist**. The architecture changed:
- Victim is now **ACI containers with public FQDNs** (no VM, no NSG).
- So there is no home-IP allowlist to configure; the attacker reaches the victim over the public
  internet directly.

Because full Kali-VM installs and large image pulls were unreliable in this environment, the
attacker is a **Kali Docker container** (`kalilinux/kali-rolling`) with the core tools installed.
Same tools, far less friction. A full Kali VM remains a valid alternative for portfolio polish.

## What was built
- Container `kali-attacker` from `kalilinux/kali-rolling` (kept alive with `sleep infinity`).
- Installed tools (verified): **nmap 7.991, sqlmap 1.10.9, nikto 2.6.1, hydra 9.7**, plus curl.

## Setup (reproduce)
```powershell
docker pull kalilinux/kali-rolling
docker run -d --name kali-attacker kalilinux/kali-rolling sleep infinity
docker exec kali-attacker bash -c "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y nmap sqlmap nikto hydra curl"
```

## Using the attacker
Open a shell inside Kali:
```powershell
docker exec -it kali-attacker bash
```
Then run tools against the ACI victim FQDNs (get current values with `terraform output`):
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://<dvwa-fqdn>/login.php
nmap -Pn -p 80,3000 <victim-fqdn>
```

## Verification (connectivity — the Phase 4 gate)
From inside the Kali container, both Azure victims returned HTTP 200:
```
DVWA:      200   (http://<dvwa-fqdn>/login.php)
JuiceShop: 200   (http://<juiceshop-fqdn>:3000/)
```
This confirms the attacker -> Azure victim path works end to end.

## Blue Team relevance
- Scanning/attack traffic from the Kali container hits the public ACI apps. App-layer traffic is
  not captured by Azure by default (see Phase 3 ACI doc) — enabling ACI container logs to
  `law-redblue-lab` is the enhancement that makes these attacks visible in Sentinel.
- Control-plane events (container create/delete) are already in `AzureActivity`.

## Lifecycle / cost
- The Kali container is local (free). Stop it with `docker stop kali-attacker`, restart with
  `docker start kali-attacker` (tools persist). Remove with `docker rm -f kali-attacker`.
- Remember: the **ACI victim** bills while running — `terraform destroy` the container groups
  when you finish a session.

## Next step
Phase 11–13: run the attack playbooks (`attacks/01` IDOR on Juice Shop, `attacks/03` SQLi on
DVWA) from the Kali container against the ACI FQDNs.
