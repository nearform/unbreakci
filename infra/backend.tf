terraform {
  required_version = "~> 1.2.7"
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "4.27.0"
    }
  }
  backend "gcs" {
  }
}
