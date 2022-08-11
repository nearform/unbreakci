data "google_project" "project" {
}

#Generated secrets
resource "google_secret_manager_secret" "secret" {
  count     = length(var.secrets)
  secret_id = var.secrets[count.index].id
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_iam_member" "secret_access" {
  count     = length(var.secrets)
  secret_id = var.secrets[count.index].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
