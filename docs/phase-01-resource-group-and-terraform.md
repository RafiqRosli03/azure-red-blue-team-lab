# Phase 1 — Resource Group + Terraform Skeleton

## Objective
Create the single resource group that holds the entire lab, and stand up the Terraform IaC
skeleton (provider, variables, outputs) so every later phase is reproducible and the whole
lab tears down in one command.

## Architecture fit
`rg-redblue-lab` in `southeastasia` is the container for all later resources (VNet, VMs,
Log Analytics, Sentinel). One RG = one-command teardown = cost control.

## Prerequisites
- Phase 0 complete: `az login` works, budget alert set, Terraform + Azure CLI installed.
- You are in the `terraform/` folder for Terraform commands.

## Cost
Resource groups are **free**. This phase consumes **$0**. Billable resources start in Phase 3.

---

## Method A — Terraform (primary)
```powershell
# from: ...\Attacking and Defending with Azure\terraform
az account show -o table          # confirm correct subscription
terraform init                    # downloads azurerm provider (~v4)
terraform fmt                     # tidy formatting
terraform validate                # schema check -> "Success!"
terraform plan -out tfplan        # should show: 1 to add (azurerm_resource_group.lab)
terraform apply tfplan            # type is not needed; plan file is pre-approved
terraform output                  # resource_group_name = rg-redblue-lab, location = southeastasia
```

To override defaults, copy `terraform.tfvars.example` to `terraform.tfvars` and edit
(it is gitignored).

## Method B — Azure CLI
```powershell
az group create --name rg-redblue-lab --location southeastasia `
  --tags project=azure-red-blue-team-lab environment=lab owner=self
az group show --name rg-redblue-lab -o table
```
> Do not run both A and B against the same name, or Terraform will try to manage a group it
> did not create. Pick one. (If you ran CLI first and want Terraform to own it, use
> `terraform import azurerm_resource_group.lab /subscriptions/<id>/resourceGroups/rg-redblue-lab`.)

## Method C — Azure Portal
1. Portal → **Resource groups** → **+ Create**.
2. Subscription: your free subscription. Name: `rg-redblue-lab`. Region: **Southeast Asia**.
3. Tags: `project=azure-red-blue-team-lab`, `environment=lab`. → **Review + create** → **Create**.

---

## Verification
- [ ] `terraform output` prints `rg-redblue-lab` / `southeastasia` (Method A), or
      `az group show -n rg-redblue-lab -o table` returns `Succeeded`.
- [ ] Portal → Resource groups shows `rg-redblue-lab` with your tags.

## Security considerations
- No network, identity, or compute exists yet — zero attack surface.
- Tags enable cost tracking and make orphaned-resource cleanup easy later.
- Keep `terraform.tfstate` local and gitignored; it can contain resource metadata.

## Blue Team relevance
Creating the RG generates an `AzureActivity` event
(`Microsoft.Resources/subscriptions/resourceGroups/write`). In Phase 7 you will query exactly
this table to detect suspicious resource creation — so note what a *legitimate* create looks
like now; it is your baseline.

## Portfolio evidence (no secrets)
- `terraform plan` output (1 to add) and `terraform output`.
- Portal screenshot of the resource group (redact subscription ID).
- Save under `screenshots/phase-01/`.

## Cost control
- Nothing to deallocate yet. If you want a clean slate: `terraform destroy` or
  `az group delete -n rg-redblue-lab --yes`.

## Teardown (end of a session, optional this phase)
```powershell
terraform destroy        # Method A
az group delete -n rg-redblue-lab --yes --no-wait   # Method B/C
```

## Next step
**Phase 2 — VNet, subnets, NSGs.** We add `10.10.0.0/16` with a public subnet (for the Linux
victim VM) and an internal subnet (for the Windows endpoint), plus NSGs that restrict inbound
to your home IP only. Still ~$0 (VNets/NSGs are free; charges begin with the VM in Phase 3).
Have your **home public IP** ready (`curl ifconfig.me` or https://whatismyip.com) for the NSG rule.
