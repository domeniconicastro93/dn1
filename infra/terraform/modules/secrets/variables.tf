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

