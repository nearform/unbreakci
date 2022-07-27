output "gen_id" {
  value = google_secret_manager_secret.gen.*.secret_id
}
