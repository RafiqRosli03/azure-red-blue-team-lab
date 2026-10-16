# Terraform — Infrastructure as Code

Primary deployment method for the lab. State is local (gitignored). Each phase adds files;
`terraform destroy` tears the whole lab down for cost control.

## Files
- `versions.tf` — Terraform + azurerm provider pinning.
- `variables.tf` — prefix, location (default `southeastasia`), tags, optional subscription.
- `main.tf`      — resources (Phase 1: resource group only; grows each phase).
- `outputs.tf`   — useful values after apply.
- `terraform.tfvars.example` — copy to `terraform.tfvars` to override defaults.

## Usage
```powershell
# from the terraform/ folder
az login                     # if not already
terraform init               # downloads the azurerm provider
terraform fmt                # format check
terraform validate           # schema check
terraform plan -out tfplan   # preview (Phase 1 adds only a resource group = $0)
terraform apply tfplan       # create
terraform output             # show resource group name + location
```

## Teardown (cost control)
```powershell
terraform destroy            # removes everything Terraform created
```
Equivalent fast nuke of the whole RG (also removes anything created outside Terraform):
```powershell
az group delete -n rg-redblue-lab --yes --no-wait
```

## Cost note
Phase 1 creates only a resource group, which is **free**. Billable resources (VMs, disks,
public IPs) begin in Phase 3. Always `terraform destroy` or `az vm deallocate` when done.
