# Phase 8 — Entra ID: RBAC / MFA / Conditional Access

**Status:** 🟡 partial — MFA now ENFORCED via Security Defaults; Conditional Access + RBAC review pending

## What this phase is
Hardening the identity layer: multi-factor authentication (MFA), least-privilege role
assignments (RBAC), and (later) Conditional Access policies.

## Why it matters
Most cloud breaches are identity breaches. This phase is the Blue Team's preventive control —
making stolen credentials far less useful (MFA) and limiting what any one identity can do
(RBAC). It also generates sign-in/audit logs that pair with the `AzureActivity` hunting from
Phase 10.

## What we found and fixed (this session — honest record)
1. **Initial finding:** the account had **no MFA enforced**. Evidence:
   - Authentication methods page was empty ("No default", no registered methods).
   - Sign-in logs showed **"Conditional access: Not applied"** on every sign-in (single-factor).
   So the earlier note "MFA enabled manually" was INACCURATE — MFA was not actually on.
2. **Action taken:** enabled **Security Defaults** (Entra ID → Overview → Properties →
   Manage security defaults → Enabled).
3. **Result (verified):** the portal now shows **"Your organization is protected by security
   defaults"** with a green check. MFA is now enforced tenant-wide.
   Evidence: `phase08-02-security-defaults-enabled.png`.

## Current state
- ✅ **MFA enforced via Security Defaults** (tenant-wide; applies to all sign-ins).
- ✅ Sign-in logging verified (Entra → Sign-in logs returns events).
- ⬜ On next sign-in, register MFA in the Microsoft Authenticator app, then capture a sign-in
   showing **"Multifactor authentication"** in the Authentication requirement column.
- ⬜ RBAC least-privilege review not yet formalized.
- ⬜ Custom Conditional Access policies not built (Security Defaults covers the basics; granular
   CA needs Entra ID P1/P2 via the M365 E5 30-day trial — see `docs/00-cost-and-licensing.md`).

## Security Defaults vs Conditional Access (why this is "partial" not "done")
Security Defaults is the free, all-or-nothing MFA baseline — it's the right choice for a
personal-account lab tenant and genuinely enforces MFA. Granular **Conditional Access**
(per-app, per-location, risk-based) is the paid, enterprise-grade version and remains a future
extension. So MFA = done; full CA engineering = pending.

## What to do next when you build it out
1. Sign out and back in → register MFA (Authenticator) → screenshot the MFA challenge + the
   resulting "Multifactor authentication" sign-in log.
2. Review role assignments: `az role assignment list --all -o table` — remove anything broader
   than needed.
3. (If you take the E5 trial) replace Security Defaults with a Conditional Access policy for
   finer control, and add a sign-in-logs query to the detection set (pairs with Phase 10).

## Reference
`docs/00-cost-and-licensing.md` (trial windows for Entra P2).

## Next
Phase 9 — Defender for Cloud + Defender for Endpoint/XDR.
