variable "retention_period" {
  description = "Log retention period"
  type        = string
  default     = "30d"
}

variable "retention_size" {
  description = "Log retention size"
  type        = string
  default     = "50Gi"
}

