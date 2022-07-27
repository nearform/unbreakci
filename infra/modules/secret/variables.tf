variable "region" {}
variable "secrets" {
  type = list(object({
    id   = string
    size = number
  }))
}
