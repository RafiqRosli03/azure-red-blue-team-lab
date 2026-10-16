variable "prefix" {
  description = "Short name prefix for all resources."
  type        = string
  default     = "redblue"
}

variable "location" {
  description = "Azure region. westus3 — ACI containers deploy here fine (bypasses the Bsv2 VM quota block)."
  type        = string
  default     = "westus3"
}

variable "tags" {
  description = "Tags applied to every resource for cost tracking and cleanup."
  type        = map(string)
  default = {
    project     = "azure-red-blue-team-lab"
    environment = "lab"
    owner       = "self"
    cost-center = "personal-learning"
  }
}

# Optional: pin a subscription. Leave empty to use the CLI's active subscription.
variable "subscription_id" {
  description = "Azure subscription ID (optional)."
  type        = string
  default     = ""
}
