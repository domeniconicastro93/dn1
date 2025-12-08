variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type    = string
  default = "1.28"
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "node_groups" {
  type = map(any)
}

variable "tags" {
  type    = map(string)
  default = {}
}

