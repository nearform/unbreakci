
variable project {
  type        = string
  default     = ""
  description = "GCP project name"
}

variable env {
  type        = string
  default     = ""
  description = "Environment - dev or prod"
}

variable location {
  type        = string
  default     = ""
  description = "GCP project location"
}

variable region {
  type        = string
  default     = ""
  description = "GCP region"
}

variable zone {
  type        = string
  default     = ""
  description = "GCP zone"
}

variable app_name {
  type        = string
  default     = ""
  description = "Application name"
}

variable vpc_connector_cidr {
  type        = string
  default     = ""
  description = "GCP VPC connector CIDR"
}

variable private_service_ips_range {
  type        = string
  default     = ""
  description = "Private Service IPs range"
}

variable private_service_ips_range_len {
  type        = string
  default     = ""
  description = "The prefix length of the IP range"
}
