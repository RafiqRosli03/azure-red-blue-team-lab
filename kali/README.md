# Kali (Red Team) — local

Kali runs locally in VirtualBox/VMware, not in Azure. Attacks target only the lab's
intentionally vulnerable Azure assets, and only from your home public IP (NSG-allowlisted).

Tool purpose, telemetry generated, Blue Team indicators, Microsoft detection product, and a
KQL starting query for each tool are documented per attack under `../attacks/`.

Covered later (Phase 4): nmap, Burp Suite, OWASP ZAP, nikto, gobuster/dirsearch, sqlmap,
hydra, metasploit (where appropriate), curl, netcat, Wireshark, basic Linux networking tools.
