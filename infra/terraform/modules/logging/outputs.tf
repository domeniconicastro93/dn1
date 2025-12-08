output "fluent_bit_daemonset_name" {
  description = "Name of the Fluent Bit DaemonSet"
  value       = kubernetes_daemonset.fluent_bit.metadata[0].name
}

output "loki_service_endpoint" {
  description = "Loki service endpoint"
  value       = "http://loki.monitoring.svc.cluster.local:3100"
}

