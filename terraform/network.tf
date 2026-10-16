# Phase 2 — VNet, subnets, NSG  (Option A: private isolation)
#
# Design:
#   VNet 10.20.0.0/16
#     - snet-aci       10.20.1.0/24  delegated to Microsoft.ContainerInstance (victim apps)
#     - snet-attacker  10.20.2.0/24  delegated to Microsoft.ContainerInstance (Kali)
#   NSG on snet-aci: allow inbound ONLY from snet-attacker (10.20.2.0/24); deny all other inbound.
#
# Why delegation: ACI with a private IP requires its subnet to be delegated to
# Microsoft.ContainerInstance/containerGroups. A delegated subnet can host ACI only.
# Hence TWO delegated subnets — one for victims, one for the attacker — so the NSG can
# enforce attacker->victim traffic and nothing else.
#
# Cost: VNet, subnets, and NSG are free. Only the running containers bill (per second).

resource "azurerm_virtual_network" "lab" {
  name                = "vnet-${var.prefix}-lab"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  address_space       = ["10.20.0.0/16"]
  tags                = var.tags
}

# ---- Victim subnet (delegated to ACI) --------------------------------------
resource "azurerm_subnet" "aci" {
  name                 = "snet-aci"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.lab.name
  address_prefixes     = ["10.20.1.0/24"]

  delegation {
    name = "aci-delegation"
    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# ---- Attacker subnet (delegated to ACI) ------------------------------------
resource "azurerm_subnet" "attacker" {
  name                 = "snet-attacker"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.lab.name
  address_prefixes     = ["10.20.2.0/24"]

  delegation {
    name = "aci-delegation"
    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# ---- NSG for the victim subnet ---------------------------------------------
# Least privilege: only the attacker subnet may reach the victim apps. This is the
# core isolation control — the deliberately vulnerable apps are unreachable from the
# internet and from anything other than the Kali attacker container.
resource "azurerm_network_security_group" "aci" {
  name                = "nsg-${var.prefix}-aci"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  tags                = var.tags

  security_rule {
    name                       = "Allow-Attacker-Subnet-Inbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "3000"]
    source_address_prefix      = "10.20.2.0/24"
    destination_address_prefix = "10.20.1.0/24"
  }

  security_rule {
    name                       = "Deny-All-Other-Inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "aci" {
  subnet_id                 = azurerm_subnet.aci.id
  network_security_group_id = azurerm_network_security_group.aci.id
}

# ---- NSG for the attacker subnet (defense in depth) ------------------------
# Kali needs no inbound at all (reached via `az container exec`, not the network).
# Deny every inbound connection to the attacker subnet; outbound stays open so Kali
# can reach the victims and pull tooling.
resource "azurerm_network_security_group" "attacker" {
  name                = "nsg-${var.prefix}-attacker"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  tags                = var.tags

  security_rule {
    name                       = "Deny-All-Inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "attacker" {
  subnet_id                 = azurerm_subnet.attacker.id
  network_security_group_id = azurerm_network_security_group.attacker.id
}
