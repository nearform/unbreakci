
#Generated secrets
resource "google_secret_manager_secret" "secret" {
  count     = length(var.secrets)
  secret_id = var.secrets[count.index].id
  replication {
    automatic = true
  }
}
