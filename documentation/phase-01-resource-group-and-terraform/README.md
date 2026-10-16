# Phase 1 — Resource Group + Terraform Skeleton

**Status:** ✅ done

## What this phase is
Creating one resource group to hold the entire lab, and defining everything as code with
Terraform.

## Why it matters
- **One resource group** (`rg-redblue-lab`) means the whole lab can be torn down in a single
  command for cost control — nothing gets orphaned and left billing.
- **Terraform (infrastructure-as-code)** means the lab is reproducible: destroy it tonight,
  rebuild it identically tomorrow.

## What was done
- Resource group `rg-redblue-lab` in region `westus3`.
- Terraform project under `terraform/` with:
  - `main.tf` — the resource group.
  - `network.tf`, `containers.tf`, `monitoring.tf` — added in later phases.
  - `variables.tf`, `outputs.tf`, `versions.tf`, `terraform.tfvars`.

## Commands
```powershell
cd "c:\Users\User\OneDrive\Desktop\LAB AWS Rafiq\Attacking and Defending with Azure\terraform"
terraform init
terraform plan -out tfplan
terraform apply tfplan
terraform output          # shows IPs, workspace name, exec command
```

## Verify
```powershell
az group show -n rg-redblue-lab --query "{name:name, location:location, state:properties.provisioningState}" -o table
```

## Reference
`docs/phase-01-resource-group-and-terraform.md`, `terraform/main.tf`.

## Next
Phase 2 — private network (VNet, subnets, NSGs).
