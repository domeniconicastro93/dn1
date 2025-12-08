variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "versioning" {
  description = "Versioning configuration"
  type = object({
    enabled = bool
  })
  default = {
    enabled = false
  }
}

variable "lifecycle_rules" {
  description = "Lifecycle rules"
  type = list(object({
    id      = string
    enabled = bool
    transitions = list(object({
      days          = number
      storage_class = string
    }))
  }))
  default = []
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["https://strike.gg", "https://www.strike.gg"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

