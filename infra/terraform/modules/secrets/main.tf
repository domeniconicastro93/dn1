# Secrets Management Module
# In production, use external secret management (AWS Secrets Manager, HashiCorp Vault)

# External Secrets Operator (optional - for AWS Secrets Manager integration)
# resource "helm_release" "external_secrets" {
#   name       = "external-secrets"
#   repository = "https://charts.external-secrets.io"
#   chart      = "external-secrets"
#   namespace  = "kube-system"
# }

# Kubernetes Secrets (for development/testing)
# In production, these should be managed externally

resource "kubernetes_secret" "database" {
  metadata {
    name      = "database-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    url = base64encode(var.database_url)
  }
}

resource "kubernetes_secret" "redis" {
  metadata {
    name      = "redis-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    password = base64encode(var.redis_password)
  }
}

resource "kubernetes_secret" "jwt" {
  metadata {
    name      = "jwt-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    secret         = base64encode(var.jwt_secret)
    refresh_secret  = base64encode(var.jwt_refresh_secret)
  }
}

resource "kubernetes_secret" "stripe" {
  metadata {
    name      = "stripe-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    secret_key      = base64encode(var.stripe_secret_key)
    webhook_secret  = base64encode(var.stripe_webhook_secret)
  }
}

resource "kubernetes_secret" "s3" {
  metadata {
    name      = "s3-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    access_key_id     = base64encode(var.s3_access_key_id)
    secret_access_key = base64encode(var.s3_secret_access_key)
  }
}

resource "kubernetes_secret" "kafka" {
  metadata {
    name      = "kafka-secret"
    namespace = "strike"
  }

  type = "Opaque"

  data = {
    username = base64encode(var.kafka_username)
    password = base64encode(var.kafka_password)
  }
}

# Secret rotation policy (documentation)
resource "kubernetes_config_map" "secret_rotation_policy" {
  metadata {
    name      = "secret-rotation-policy"
    namespace = "strike"
  }

  data = {
    "rotation_period" = "90d"
    "rotation_method" = "external-secrets-operator"
    "backup_enabled"  = "true"
  }
}

