output "resource_group_name" {
  description = "Name of the lab resource group."
  value       = azurerm_resource_group.lab.name
}

output "location" {
  description = "Region all lab resources are deployed to."
  value       = azurerm_resource_group.lab.location
}

# ---------------------------------------------------------------------------
# Victim apps on ACI (PRIVATE — reachable only from the Kali attacker container)
# ---------------------------------------------------------------------------

output "dvwa_private_ip" {
  description = "DVWA private IP inside the VNet. Attack from Kali as http://<ip>/"
  value       = azurerm_container_group.dvwa.ip_address
}

output "juiceshop_private_ip" {
  description = "Juice Shop private IP inside the VNet. Attack from Kali as http://<ip>:3000/"
  value       = azurerm_container_group.juiceshop.ip_address
}

output "kali_private_ip" {
  description = "Kali attacker private IP inside the VNet."
  value       = azurerm_container_group.kali.ip_address
}

output "kali_exec_command" {
  description = "Open an interactive shell on the Kali attacker container."
  value       = "az container exec -g ${azurerm_resource_group.lab.name} -n ${azurerm_container_group.kali.name} --exec-command \"/bin/bash\""
}

# ---------------------------------------------------------------------------
# Log Analytics + Sentinel (Blue Team backbone)
# ---------------------------------------------------------------------------

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace (Sentinel + detection backbone)."
  value       = azurerm_log_analytics_workspace.lab.name
}

output "log_analytics_workspace_id" {
  description = "Resource ID of the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.lab.id
}

output "sentinel_onboarded_workspace" {
  description = "Workspace ID that Microsoft Sentinel is enabled on."
  value       = azurerm_sentinel_log_analytics_workspace_onboarding.lab.workspace_id
}
