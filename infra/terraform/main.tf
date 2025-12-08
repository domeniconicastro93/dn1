terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket = "strike-terraform-state"
    key    = "strike/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  token                  = data.aws_eks_auth.cluster.token
}

data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.cluster_name
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  name = "strike-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = var.cluster_name
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    main = {
      desired_size = 3
      max_size     = 10
      min_size     = 3
      instance_types = ["t3.medium"]
    }
  }
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# RDS PostgreSQL
module "postgres" {
  source = "./modules/postgres"
  
  identifier = "strike-postgres"
  engine_version = "15.4"
  
  instance_class = var.postgres_instance_class
  allocated_storage = 100
  max_allocated_storage = 500
  
  db_name  = "strike"
  username = "strike_admin"
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.vpc.default_security_group_id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  cluster_id = "strike-redis"
  engine_version = "7.0"
  
  node_type       = var.redis_node_type
  num_cache_nodes = 1
  
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.vpc.default_security_group_id]
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# MSK (Kafka)
module "kafka" {
  source = "./modules/kafka"
  
  cluster_name = "strike-kafka"
  kafka_version = "3.5.1"
  
  instance_type = var.kafka_instance_type
  broker_count  = 3
  
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.vpc.default_security_group_id]
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# S3 Object Storage
module "s3" {
  source = "./modules/s3"
  
  bucket_name = "strike-media-${var.environment}"
  
  versioning = {
    enabled = true
  }
  
  lifecycle_rules = [
    {
      id      = "transition-to-ia"
      enabled = true
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
    }
  ]
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# CloudFront CDN
module "cdn" {
  source = "./modules/cdn"
  
  origin_domain = module.s3.bucket_domain_name
  
  aliases = ["cdn.strike.gg"]
  
  price_class = "PriceClass_100" # US, Canada, Europe
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# Monitoring Stack
module "monitoring" {
  source = "./modules/monitoring"
  
  cluster_name = var.cluster_name
  
  prometheus_retention              = "30d"
  grafana_admin_password            = var.grafana_admin_password
  alertmanager_webhook_url          = var.alertmanager_webhook_url
  alertmanager_critical_webhook_url = var.alertmanager_critical_webhook_url
  alertmanager_warning_webhook_url = var.alertmanager_warning_webhook_url
  
  tags = {
    Environment = var.environment
    Project     = "strike"
  }
}

# Logging Stack
module "logging" {
  source = "./modules/logging"
  
  retention_period = var.log_retention_period
  retention_size   = var.log_retention_size
}

# Secrets Management
module "secrets" {
  source = "./modules/secrets"
  
  database_url          = var.database_url
  redis_password        = var.redis_password
  jwt_secret            = var.jwt_secret
  jwt_refresh_secret    = var.jwt_refresh_secret
  stripe_secret_key     = var.stripe_secret_key
  stripe_webhook_secret = var.stripe_webhook_secret
  s3_access_key_id     = var.s3_access_key_id
  s3_secret_access_key = var.s3_secret_access_key
  kafka_username        = var.kafka_username
  kafka_password        = var.kafka_password
}

