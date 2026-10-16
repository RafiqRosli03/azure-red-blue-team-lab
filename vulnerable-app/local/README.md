# Local Victim Stack (fallback for the Azure VM)

When the Azure victim VM is blocked (new-subscription compute quota pending Microsoft review),
run the identical vulnerable apps locally in Docker so the attack/detect/respond exercises can
proceed. The Azure Blue Team stack (Sentinel + Log Analytics + Activity Log) stays live and keeps
covering the cloud control-plane detections.

## What you get
- **DVWA** → http://localhost:8081  (login `admin` / `password`, set security to Low to start)
- **OWASP Juice Shop** → http://localhost:3000

> Note: DVWA uses host port **8081** (8080 was already in use on this machine). Adjust in
> `docker-compose.yml` if you prefer a different port.

Both bind to `127.0.0.1` only — they are intentionally vulnerable and must not be exposed to
your LAN or the internet.

## Prerequisites
- Docker Desktop installed and **running** (whale icon → "Engine running").
- Verify: `docker version` shows both Client and Server.

## Start / stop / reset
```powershell
# from: ...\Attacking and Defending with Azure\vulnerable-app\local
docker compose up -d        # pull images (first run) and start both apps
docker compose ps           # both should show "running"
docker compose down         # stop and remove containers
docker compose down -v      # full reset (wipes DVWA database to defaults)
```

First run downloads the images (DVWA ~1 GB, Juice Shop ~300 MB), so give it a few minutes.

## Verify the apps are up
```powershell
curl.exe -s -o NUL -w "DVWA: %{http_code}`n"      http://localhost:8080/login.php
curl.exe -s -o NUL -w "Juice: %{http_code}`n"     http://localhost:3000/
```
Expect `200` (or a 302 redirect for DVWA login) for both.

## DVWA first-time setup
1. Browse to http://localhost:8080 → login `admin` / `password`.
2. Click **Create / Reset Database** on the setup page.
3. **DVWA Security → Low** (for the first exercises).

## How the exercises map in local mode
| Attack | App | URL |
|---|---|---|
| 01 Broken Access Control (IDOR) | Juice Shop | http://localhost:3000 |
| 03 SQL Injection | DVWA | http://localhost:8080/vulnerabilities/sqli/ |
| XSS, brute force, file inclusion | DVWA | http://localhost:8080 |

In the attack playbooks (`../../attacks/`), substitute `<victim-public-ip>` with:
- `localhost:8080` for DVWA
- `localhost:3000` for Juice Shop

## Detection in local mode — honest scope
- **Application-layer attacks (SQLi, XSS, IDOR)** against these local apps are **not** visible to
  Azure Sentinel, because the traffic never touches Azure. To detect those locally you would ship
  the container/host logs somewhere (out of scope for the quick fallback) or inspect them directly.
- **Azure control-plane detections remain fully live**: the `AzureActivity` KQL in
  `../../detections/kql/00-azure-activity-foundations.md` works against the Sentinel workspace now.
- When the Azure VM quota is approved, switch back to the Azure victim (the Terraform is ready) to
  get the full in-cloud detection story. This local stack is the bridge, not the final design.

## Teardown
```powershell
docker compose down -v      # removes containers + volumes; frees disk
```
