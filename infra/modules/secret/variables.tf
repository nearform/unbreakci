variable region {
  type        = string
  default     = ""
  description = "GCP region"
}

variable "secrets" {
  type = list(object({
    id   = string
    size = number
  }))
  description = "List of secrets"
}
