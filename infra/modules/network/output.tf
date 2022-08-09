
output "vpc_network_id" {
  value = google_compute_network.this.id
}

output "vpc_connector_id" {
  value = google_vpc_access_connector.connector.id
}
