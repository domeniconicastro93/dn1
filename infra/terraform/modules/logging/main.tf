# Centralized Logging Setup
# Uses Loki for log aggregation and Grafana for visualization

# Loki is already deployed via Helm in monitoring module
# This module adds additional logging configurations

# Fluent Bit DaemonSet for log collection
resource "kubernetes_daemonset" "fluent_bit" {
  metadata {
    name      = "fluent-bit"
    namespace = "kube-system"
    labels = {
      app = "fluent-bit"
    }
  }

  spec {
    selector {
      matchLabels = {
        app = "fluent-bit"
      }
    }

    template {
      metadata {
        labels = {
          app = "fluent-bit"
        }
      }

      spec {
        container {
          name  = "fluent-bit"
          image = "fluent/fluent-bit:latest"

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

          volume_mount {
            name       = "varlog"
            mount_path = "/var/log"
            read_only  = true
          }

          volume_mount {
            name       = "varlibdockercontainers"
            mount_path = "/var/lib/docker/containers"
            read_only  = true
          }

          volume_mount {
            name       = "fluent-bit-config"
            mount_path = "/fluent-bit/etc"
          }
        }

        volume {
          name = "varlog"
          host_path {
            path = "/var/log"
          }
        }

        volume {
          name = "varlibdockercontainers"
          host_path {
            path = "/var/lib/docker/containers"
          }
        }

        volume {
          name = "fluent-bit-config"
          config_map {
            name = kubernetes_config_map.fluent_bit_config.metadata[0].name
          }
        }

        tolerations {
          effect = "NoSchedule"
          key    = "node-role.kubernetes.io/master"
        }
      }
    }
  }
}

# Fluent Bit Configuration
resource "kubernetes_config_map" "fluent_bit_config" {
  metadata {
    name      = "fluent-bit-config"
    namespace = "kube-system"
  }

  data = {
    "fluent-bit.conf" = <<-EOT
      [SERVICE]
          Flush         1
          Log_Level     info
          Daemon        off
          Parsers_File  parsers.conf
          HTTP_Server   On
          HTTP_Listen   0.0.0.0
          HTTP_Port     2020

      [INPUT]
          Name              tail
          Path              /var/log/containers/*.log
          Parser            docker
          Tag               kube.*
          Refresh_Interval  5
          Mem_Buf_Limit     50MB
          Skip_Long_Lines   On

      [FILTER]
          Name                kubernetes
          Match               kube.*
          Kube_URL            https://kubernetes.default.svc:443
          Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
          Kube_Tag_Prefix     kube.var.log.containers.
          Merge_Log           On
          Keep_Log            Off
          K8S-Logging.Parser  On
          K8S-Logging.Exclude Off

      [FILTER]
          Name                modify
          Match               kube.*
          Add                 cluster_name strike
          Add                 environment production

      [OUTPUT]
          Name        loki
          Match       kube.*
          Host        loki.monitoring.svc.cluster.local
          Port        3100
          Labels      job=fluent-bit
          Label_keys  $filename,stream,namespace,container_name,pod_name
          Remove_keys kubernetes,stream
    EOT

    "parsers.conf" = <<-EOT
      [PARSER]
          Name        docker
          Format      json
          Time_Key    time
          Time_Format %Y-%m-%dT%H:%M:%S.%L
          Time_Keep   On
    EOT
  }
}

# Log retention policy
resource "kubernetes_config_map" "loki_retention" {
  metadata {
    name      = "loki-retention"
    namespace = "monitoring"
  }

  data = {
    "retention_period" = "30d"
    "retention_size"   = "50Gi"
  }
}

