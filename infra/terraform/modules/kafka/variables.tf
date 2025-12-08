variable "cluster_name" {
  description = "MSK cluster name"
  type        = string
}

variable "kafka_version" {
  description = "Kafka version"
  type        = string
  default     = "3.5.1"
}

variable "instance_type" {
  description = "Kafka broker instance type"
  type        = string
}

variable "broker_count" {
  description = "Number of broker nodes"
  type        = number
  default     = 3
}

variable "subnet_ids" {
  description = "Subnet IDs for Kafka brokers"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for Kafka"
  type        = list(string)
}

variable "volume_size" {
  description = "EBS volume size per broker in GB"
  type        = number
  default     = 100
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "certificate_authority_arns" {
  description = "Certificate authority ARNs for TLS"
  type        = list(string)
  default     = []
}

variable "enhanced_monitoring" {
  description = "Enhanced monitoring level"
  type        = string
  default     = "PER_TOPIC_PER_PARTITION"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

