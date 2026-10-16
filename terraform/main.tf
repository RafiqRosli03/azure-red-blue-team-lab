# Phase 1 — Resource Group only.
# One resource group holds the entire lab so the whole environment can be torn
# down with a single `terraform destroy` (or `az group delete`) for cost control.

resource "azurerm_resource_group" "lab" {
  name     = "rg-${var.prefix}-lab"
  location = var.location
  tags     = var.tags
}

# Networking (VNet, subnets, NSGs) is added in Phase 2.
# VMs, Docker apps, Log Analytics, and Sentinel follow in later phases.
