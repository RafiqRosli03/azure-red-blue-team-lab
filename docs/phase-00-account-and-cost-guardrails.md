# Phase 0 — Azure Account + Budget Alerts + Cost Guardrails

**Do this before deploying anything that can bill.** This phase creates no billable
resources; it only sets up the safety net that keeps the whole lab at ~RM0.

## Objective
Create (or confirm) an Azure account with the $200 free credit, install the local toolchain
(Azure CLI + Terraform), and put a hard cost guardrail (budget + alerts) in place so you are
warned long before any real money is spent.

## Architecture fit
This is the control plane for cost. The budget scopes to your subscription and emails you at
50/80/100% of a $20 ceiling — well inside the $200 credit. Everything built in later phases
lives under one resource group so it can be wiped in one command.

## Prerequisites
- A Microsoft account and a browser.
- A credit/debit card (required to verify the free account; it is **not** charged while on
  the free credit unless you convert to pay-as-you-go and exceed free limits).
- Windows host for local Kali later (VirtualBox/VMware) — not needed this phase.

---

## Step 1 — Create / confirm the Azure free account
1. Go to <https://azure.microsoft.com/en-us/free/> and sign up (or sign in if you already have
   a subscription).
2. Complete identity + card verification. You receive **$200 credit for 30 days**.
3. Note your **start date** — this is the clock for the $200 credit.

> If you already used your free trial before, you will be on pay-as-you-go. In that case the
> budget guardrail below matters even more. The lab still costs only ~$10–15 if you deallocate.

## Step 2 — Install the local toolchain (Windows / PowerShell)
Run each and confirm versions:

```powershell
winget install --id Microsoft.AzureCLI -e
winget install --id Hashicorp.Terraform -e
# open a NEW PowerShell window so PATH refreshes, then:
az version
terraform version
```

Sign in and select your subscription:

```powershell
az login
az account show --output table
# if you have more than one subscription:
az account list --output table
az account set --subscription "<YOUR-SUBSCRIPTION-ID>"
```

## Step 3 — Create the budget + alerts (Portal — recommended)
Microsoft recommends the Portal/REST API for budgets because the CLI can lag the latest API.

1. Portal → search **Cost Management** → **Budgets** → **+ Add**.
2. Scope: your **subscription**.
3. Name: `budget-redblue-lab`. Reset period: **Monthly**. Amount: **20** (USD or your currency).
4. **Alert conditions** (percent of budget):
   - 50%  → your email
   - 80%  → your email
   - 100% → your email
5. Add your email under alert recipients. **Create**.

Result: you get warned at $10, $16, and $20 — long before the $200 credit is at risk.

## Step 3 (alt) — Create the budget via CLI
CLI budgets may not reflect the newest API; use the Portal if this errors.

```powershell
# find your subscription id
az account show --query id -o tsv

# create a $20 monthly budget with 80% + 100% notifications
az consumption budget create `
  --budget-name "budget-redblue-lab" `
  --amount 20 `
  --category cost `
  --time-grain monthly `
  --start-date 2026-10-01 `
  --end-date 2027-10-01 `
  --notifications "{\"actual_80\":{\"enabled\":true,\"operator\":\"GreaterThanOrEqualTo\",\"threshold\":80,\"contactEmails\":[\"you@example.com\"]},\"actual_100\":{\"enabled\":true,\"operator\":\"GreaterThanOrEqualTo\",\"threshold\":100,\"contactEmails\":[\"you@example.com\"]}}"
```

Replace the dates and email. If the command's schema differs on your CLI version, use the
Portal method — it is authoritative.

## Step 4 — Turn on a cost anomaly / forecast habit
Portal → Cost Management → **Cost analysis**. Bookmark it. Check it at the start and end of
every lab session. The free credit balance shows under **Subscriptions → your sub → Overview**.

---

## Verification
- [ ] `az account show` returns your subscription (you are logged in).
- [ ] `terraform version` prints a version.
- [ ] Cost Management → Budgets shows `budget-redblue-lab` with 3 alert thresholds.
- [ ] You received no "action required" billing emails.

## Security considerations
- The card on file is a verification/overflow mechanism; the budget alerts are your early
  warning. They are **notifications, not hard caps** — Azure does not auto-stop resources at
  100%. The hard stop is you running `az vm deallocate` / `az group delete`.
- Do not share your subscription ID publicly in the portfolio (redact it in screenshots).

## Blue Team relevance
Cost Management + budgets are themselves a detective control: an unexpected cost spike can be
an indicator of compromise (e.g., crypto-mining from a popped VM). You will later query
`AzureActivity` for suspicious resource creation — this phase is the financial tripwire.

## Portfolio evidence (no secrets)
- Screenshot: Budgets blade showing `budget-redblue-lab` and thresholds (redact sub ID).
- Screenshot: `az version` + `terraform version` output.
- Save under `screenshots/phase-00/`.

## Cost control for this phase
Nothing billable created. Credit consumed: **$0**.

## Next step
**Phase 1 — Resource group + Terraform skeleton.** We create `rg-redblue-lab` and the
Terraform provider/backend scaffold (still ~$0), giving you the one-command teardown that
underpins all later cost control.
