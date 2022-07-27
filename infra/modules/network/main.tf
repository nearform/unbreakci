
resource "google_compute_network" "this" {
  name                    = "${var.app_name}-${var.env}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "private" {
  name          = "${var.app_name}-${var.env}-private"
  ip_cidr_range = var.vpc_connector_cidr
  region        = var.region
  network       = google_compute_network.this.id
}

resource "google_compute_global_address" "private_ip_allocation" {
  name          = "${var.app_name}-${var.env}-private-cidr-allocation"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  address       = var.private_service_ips_range
  prefix_length = var.private_service_ips_range_len
  network       = google_compute_network.this.id
}

resource "google_service_networking_connection" "private_connections_vpc_attachment" {
  network                 = google_compute_network.this.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_allocation.name]
}

resource "google_vpc_access_connector" "connector" {
  provider = google-beta
  name     = "${var.app_name}-${var.env}-vpc-conn"
  region   = var.region
  project  = var.project
  subnet {
    name = google_compute_subnetwork.private.name
  }
}
