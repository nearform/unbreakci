resource "google_sql_user" "unbreakci_db_user" {
  instance = google_sql_database_instance.unbreakci_db_instance.id

  name     = var.db_username
  password = var.db_password
}

resource "google_sql_database" "unbreakci_db" {
  name     = var.name
  instance = google_sql_database_instance.unbreakci_db_instance.name
}

resource "google_sql_database_instance" "unbreakci_db_instance" {
  name             = var.name
  region           = var.region
  database_version = var.db_version
  settings {
    tier = var.db_tier
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.compute_private_network
    }
  }

  deletion_protection = var.deletion_protection
}
