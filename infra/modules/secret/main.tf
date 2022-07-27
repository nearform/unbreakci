
#Generated secrets
resource "google_secret_manager_secret" "secret" {
  count     = length(var.secrets)
  secret_id = var.secrets[count.index].id
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secret" {
  count       = length(var.secrets)
  secret      = google_secret_manager_secret.secret[count.index].id
  secret_data = random_password.secret[count.index].result
}

resource "random_password" "secret" {
  count   = length(var.secrets)
  length  = var.secrets[count.index].size
  special = false
}
