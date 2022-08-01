output "secret_random" {
  value = random_password.secret.*.result
}
