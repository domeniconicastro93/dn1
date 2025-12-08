# Alertmanager Configuration
# Handles alert routing and notifications

resource "kubernetes_config_map" "alertmanager_config" {
  metadata {
    name      = "alertmanager-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "alertmanager.yml" = yamlencode({
      global = {
        resolve_timeout = "5m"
      }

      route = {
        group_by      = ["alertname", "cluster", "service"]
        group_wait    = "10s"
        group_interval = "10s"
        repeat_interval = "12h"
        receiver = "default"
        routes = [
          {
            match = {
              severity = "critical"
            }
            receiver = "critical-alerts"
          },
          {
            match = {
              severity = "warning"
            }
            receiver = "warning-alerts"
          }
        ]
      }

      receivers = [
        {
          name = "default"
          webhook_configs = [
            {
              url = var.alertmanager_webhook_url
            }
          ]
        },
        {
          name = "critical-alerts"
          webhook_configs = [
            {
              url = var.alertmanager_critical_webhook_url
            }
          ]
          # TODO: Add PagerDuty, Slack, email integrations
        },
        {
          name = "warning-alerts"
          webhook_configs = [
            {
              url = var.alertmanager_warning_webhook_url
            }
          ]
        }
      ]

      inhibit_rules = [
        {
          source_match = {
            severity = "critical"
          }
          target_match = {
            severity = "warning"
          }
          equal = ["alertname", "cluster", "service"]
        }
      ]
    })
  }
}

resource "kubernetes_deployment" "alertmanager" {
  metadata {
    name      = "alertmanager"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      matchLabels = {
        app = "alertmanager"
      }
    }

    template {
      metadata {
        labels = {
          app = "alertmanager"
        }
      }

      spec {
        container {
          name  = "alertmanager"
          image = "prom/alertmanager:latest"

          args = [
            "--config.file=/etc/alertmanager/alertmanager.yml",
            "--storage.path=/alertmanager"
          ]

          port {
            container_port = 9093
            name           = "http"
          }

          volume_mount {
            name       = "config"
            mount_path = "/etc/alertmanager"
          }

          volume_mount {
            name       = "storage"
            mount_path = "/alertmanager"
          }

          resources {
            requests = {
              memory = "128Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "256Mi"
              cpu    = "200m"
            }
          }
        }

        volume {
          name = "config"
          config_map {
            name = kubernetes_config_map.alertmanager_config.metadata[0].name
          }
        }

        volume {
          name = "storage"
          empty_dir {}
        }
      }
    }
  }
}

resource "kubernetes_service" "alertmanager" {
  metadata {
    name      = "alertmanager"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  spec {
    selector = {
      app = "alertmanager"
    }

    port {
      port        = 9093
      target_port = 9093
      name        = "http"
    }
  }
}

