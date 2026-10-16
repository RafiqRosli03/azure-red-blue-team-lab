# Phase 3 (Option A) — victim apps + Kali attacker on Azure Container Instances,
# all PRIVATE and VNet-integrated. Nothing is reachable from the internet.
#
#   Victims (snet-aci):   DVWA :80, Juice Shop :3000  — private IPs only
#   Attacker (snet-attacker): Kali — private IP, reached via `az container exec`
#
# The NSG on snet-aci (see network.tf) permits inbound ONLY from the attacker subnet.
#
# NOTE: VNet-integrated ACI cannot have a public IP or a dns_name_label. Containers get
# private IPs inside the VNet. Attack from the in-VNet Kali container, not from the internet.
#
# Billing is per vCPU-second + GB-second WHILE RUNNING; a few cents/hour total. $0 when
# destroyed. Tear down with `terraform destroy` between sessions, or stop with
# `az container stop` to pause (storage of the group definition is free).

# ---------------------------------------------------------------------------
# DVWA — Damn Vulnerable Web Application (SQLi, XSS, brute force, LFI). Port 80.
# ---------------------------------------------------------------------------
resource "azurerm_container_group" "dvwa" {
  name                = "aci-${var.prefix}-dvwa"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  os_type             = "Linux"
  ip_address_type     = "Private"
  subnet_ids          = [azurerm_subnet.aci.id]
  restart_policy      = "Always"
  tags                = var.tags

  container {
    name   = "dvwa"
    image  = "vulnerables/web-dvwa:latest"
    cpu    = "1"
    memory = "1.5"

    ports {
      port     = 80
      protocol = "TCP"
    }
  }

  diagnostics {
    log_analytics {
      workspace_id  = azurerm_log_analytics_workspace.lab.workspace_id
      workspace_key = azurerm_log_analytics_workspace.lab.primary_shared_key
    }
  }

  depends_on = [azurerm_subnet_network_security_group_association.aci]
}

# ---------------------------------------------------------------------------
# OWASP Juice Shop — modern SPA, full OWASP Top 10 (IDOR, JWT, SSRF). Port 3000.
# ---------------------------------------------------------------------------
resource "azurerm_container_group" "juiceshop" {
  name                = "aci-${var.prefix}-juiceshop"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  os_type             = "Linux"
  ip_address_type     = "Private"
  subnet_ids          = [azurerm_subnet.aci.id]
  restart_policy      = "Always"
  tags                = var.tags

  container {
    name   = "juiceshop"
    image  = "bkimminich/juice-shop:latest"
    cpu    = "1"
    memory = "1.5"

    ports {
      port     = 3000
      protocol = "TCP"
    }
  }

  diagnostics {
    log_analytics {
      workspace_id  = azurerm_log_analytics_workspace.lab.workspace_id
      workspace_key = azurerm_log_analytics_workspace.lab.primary_shared_key
    }
  }

  depends_on = [azurerm_subnet_network_security_group_association.aci]
}

# ---------------------------------------------------------------------------
# Kali attacker — in-VNet, private IP, no exposed ports. You get a shell via:
#   az container exec -g rg-redblue-lab -n aci-redblue-kali --exec-command "/bin/bash"
#
# The container stays alive with `sleep infinity`. On first shell, install tooling:
#   apt update && apt install -y nmap sqlmap hydra nikto gobuster ffuf curl netcat-traditional dnsutils
# (kali-rolling ships minimal; install the web-attack set on demand to keep startup fast.)
#
# Targets are reachable by the victims' PRIVATE IPs (see outputs) over the NSG-permitted path.
# ---------------------------------------------------------------------------
resource "azurerm_container_group" "kali" {
  name                = "aci-${var.prefix}-kali"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  os_type             = "Linux"
  ip_address_type     = "Private"
  subnet_ids          = [azurerm_subnet.attacker.id]
  restart_policy      = "Always"
  tags                = var.tags

  container {
    name   = "kali"
    image  = "kalilinux/kali-rolling:latest"
    cpu    = "1"
    memory = "1.5"
    # Install the web-attack toolset on boot so the container always comes up ready,
    # then stay alive. Reached via `az container exec ... --exec-command bash`.
    # Tools cover all 10 OWASP web scenarios: recon, fuzzing, injection, brute force.
    commands = [
      "/bin/bash", "-c",
      "export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get install -y curl wget nmap sqlmap hydra nikto gobuster ffuf netcat-traditional dnsutils iputils-ping jq python3 && echo KALI_TOOLS_READY && sleep infinity"
    ]

    # ACI requires a VNet container group to expose >=1 port (MissingIpAddressPorts).
    # Nothing listens on this port and no NSG rule permits inbound to snet-attacker,
    # so it is unreachable — it exists only to satisfy the ACI API. Access is via exec.
    ports {
      port     = 8080
      protocol = "TCP"
    }
  }

  diagnostics {
    log_analytics {
      workspace_id  = azurerm_log_analytics_workspace.lab.workspace_id
      workspace_key = azurerm_log_analytics_workspace.lab.primary_shared_key
    }
  }

  depends_on = [azurerm_subnet.attacker]
}
