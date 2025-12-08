resource "aws_msk_cluster" "main" {
  cluster_name           = var.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.broker_count

  broker_node_group_info {
    instance_type   = var.instance_type
    client_subnets  = var.subnet_ids
    security_groups = var.security_group_ids

    storage_info {
      ebs_storage_info {
        volume_size = var.volume_size
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_id = var.kms_key_id
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  client_authentication {
    sasl {
      iam = true
    }
    tls {
      certificate_authority_arns = var.certificate_authority_arns
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  enhanced_monitoring = var.enhanced_monitoring

  tags = merge(var.tags, {
    Name = var.cluster_name
  })
}

resource "aws_msk_configuration" "main" {
  kafka_versions = [var.kafka_version]
  name           = "${var.cluster_name}-config"

  server_properties = <<PROPERTIES
auto.create.topics.enable=true
default.replication.factor=3
min.insync.replicas=2
num.partitions=3
PROPERTIES
}

