output "database_secret_name" {
  description = "Name of the database secret"
  value       = kubernetes_secret.database.metadata[0].name
}

output "redis_secret_name" {
  description = "Name of the Redis secret"
  value       = kubernetes_secret.redis.metadata[0].name
}

output "jwt_secret_name" {
  description = "Name of the JWT secret"
  value       = kubernetes_secret.jwt.metadata[0].name
}

output "stripe_secret_name" {
  description = "Name of the Stripe secret"
  value       = kubernetes_secret.stripe.metadata[0].name
}

output "s3_secret_name" {
  description = "Name of the S3 secret"
  value       = kubernetes_secret.s3.metadata[0].name
}

output "kafka_secret_name" {
  description = "Name of the Kafka secret"
  value       = kubernetes_secret.kafka.metadata[0].name
}

