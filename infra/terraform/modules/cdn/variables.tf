variable "origin_domain" {
  description = "Origin domain name (S3 bucket domain)"
  type        = string
}

variable "aliases" {
  description = "CloudFront aliases (custom domains)"
  type        = list(string)
  default     = []
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

