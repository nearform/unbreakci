variable "project" {}
variable "region" {}
variable "min_scale" {}
variable "max_scale" {}
variable "app_name" {}
variable "env" {}
variable "vpc_connector_id" {}
variable "public_access" {
  type    = bool
  default = false
}
variable "env_vars" {
  type = list(object({
    name  = string
    value = string
  }))

  default = []
}
variable "secret_refs" {
  type = list(object({
    name      = string
    secret_id = string
    key       = string
  }))
  default = []
}
variable "ports" {
  type = list(object({
    name           = string
    container_port = number
  }))

  default = []
}
variable "annotations" {
  type    = map(string)
  default = {}
}
