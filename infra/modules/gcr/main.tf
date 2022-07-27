resource "google_container_registry" "registry" {
  project  = var.name
  location = var.region
}
