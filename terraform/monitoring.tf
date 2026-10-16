# Phase 6 — Log Analytics workspace (Blue Team telemetry backbone).
#
# This workspace is the central store that later phases attach to:
#   - Phase 7: Microsoft Sentinel is enabled ON this workspace (free for first 31 days).
#   - VM diagnostics / AMA data collection rules send guest + security logs here.
#   - Phase 10+: all hunting/detection KQL runs against the tables in this workspace.
#
# Cost: the workspace itself is free. Ingestion is pay-per-GB, but a home lab stays well
# under ~1 GB/day; Sentinel's first 31 days are free. PerGB2018 is the standard pricing SKU.
# retention_in_days = 30 keeps data on the free retention tier (no extra retention charge).

resource "azurerm_log_analytics_workspace" "lab" {
  name                = "law-${var.prefix}-lab"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

# ---------------------------------------------------------------------------
# Phase 7 — Microsoft Sentinel (SIEM) on top of the Log Analytics workspace.
#
# Sentinel is free for the first 31 days on the workspace. Enabling it is the
# onboarding step; analytics rules and data connectors build on top of this.
# ---------------------------------------------------------------------------

resource "azurerm_sentinel_log_analytics_workspace_onboarding" "lab" {
  workspace_id                 = azurerm_log_analytics_workspace.lab.id
  customer_managed_key_enabled = false
}

# Azure Activity Log → Log Analytics (the key FREE telemetry source for this lab).
#
# In current azurerm there is NO `azurerm_sentinel_data_connector_azure_activity_log`
# resource. The modern way to get the subscription Activity Log into Sentinel is a
# subscription-scoped diagnostic setting that streams it to the workspace. Sentinel then
# surfaces it as the "Azure Activity" data source. This captures control-plane events
# (resource create/delete, role assignments, NSG changes) that the Blue Team phases query.

data "azurerm_subscription" "current" {}

resource "azurerm_monitor_diagnostic_setting" "activity_log" {
  name                       = "activity-to-law"
  target_resource_id         = data.azurerm_subscription.current.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.lab.id

  enabled_log {
    category = "Administrative"
  }
  enabled_log {
    category = "Security"
  }
  enabled_log {
    category = "Alert"
  }
  enabled_log {
    category = "Policy"
  }

  depends_on = [azurerm_sentinel_log_analytics_workspace_onboarding.lab]
}
