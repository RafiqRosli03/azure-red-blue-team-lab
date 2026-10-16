# Vulnerable Applications

Primary targets, both in Docker on the Linux victim VM (Phase 3):
- **DVWA** (Damn Vulnerable Web Application) — classic, tunable OWASP exercises (SQLi, XSS,
  brute force, file inclusion). Port 8080.
- **OWASP Juice Shop** — modern SPA covering the full OWASP Top 10 incl. broken access control,
  JWT/crypto issues, SSRF. Port 3000.

Using both is justified: DVWA gives clean, isolated classic vulns with a difficulty slider;
Juice Shop covers modern categories DVWA lacks (A01 IDOR, A08 integrity, A10 SSRF).

Install, networking, reset, restore, and verification procedures land here in Phase 3.
