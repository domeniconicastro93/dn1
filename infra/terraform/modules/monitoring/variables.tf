variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "prometheus_retention" {
  description = "Prometheus retention period"
  type        = string
  default     = "30d"
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "alertmanager_webhook_url" {
  description = "Alertmanager webhook URL for default alerts"
  type        = string
  default     = ""
}

variable "alertmanager_critical_webhook_url" {
  description = "Alertmanager webhook URL for critical alerts"
  type        = string
  default     = ""
}

variable "alertmanager_warning_webhook_url" {
  description = "Alertmanager webhook URL for warning alerts"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

