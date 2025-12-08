output "prometheus_service_endpoint" {
  description = "Prometheus service endpoint"
  value       = "http://prometheus.monitoring.svc.cluster.local:9090"
}

output "grafana_service_endpoint" {
  description = "Grafana service endpoint"
  value       = "http://grafana.monitoring.svc.cluster.local:3000"
}

output "loki_service_endpoint" {
  description = "Loki service endpoint"
  value       = "http://loki.monitoring.svc.cluster.local:3100"
}

output "otel_collector_service_endpoint" {
  description = "OpenTelemetry Collector service endpoint"
  value       = "http://otel-collector.monitoring.svc.cluster.local:4317"
}

output "alertmanager_service_endpoint" {
  description = "Alertmanager service endpoint"
  value       = "http://alertmanager.monitoring.svc.cluster.local:9093"
}

