variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "strike-cluster"
}

variable "postgres_instance_class" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "kafka_instance_type" {
  description = "MSK Kafka instance type"
  type        = string
  default     = "kafka.m5.large"
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

variable "log_retention_period" {
  description = "Log retention period"
  type        = string
  default     = "30d"
}

variable "log_retention_size" {
  description = "Log retention size"
  type        = string
  default     = "50Gi"
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "s3_access_key_id" {
  description = "S3 access key ID"
  type        = string
  sensitive   = true
}

variable "s3_secret_access_key" {
  description = "S3 secret access key"
  type        = string
  sensitive   = true
}

variable "kafka_username" {
  description = "Kafka username"
  type        = string
  sensitive   = true
}

variable "kafka_password" {
  description = "Kafka password"
  type        = string
  sensitive   = true
}

