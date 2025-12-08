# VPC Module (simplified - would use terraform-aws-modules/vpc/aws in production)
# This is a placeholder structure

output "vpc_id" {
  value = "vpc-placeholder"
}

output "private_subnets" {
  value = var.private_subnets
}

output "public_subnets" {
  value = var.public_subnets
}

output "default_security_group_id" {
  value = "sg-placeholder"
}

