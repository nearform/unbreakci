data "google_project" "project" {
}

resource "google_cloud_run_service" "this" {

  name     = "${var.project}-${var.env}"
  location = var.region

  template {
    spec {
      containers {
        image = "us-central1-docker.pkg.dev/unbreak-ci/cloud-run-source-deploy/unbreakci-dev@sha256:4d7d7ff7f5bef5b3e8ff8c6fa28e8a7ed6601825e1e9aa67f46f688414ba49de"

        dynamic "env" {
          for_each = var.env_vars
          content {
            name  = env.value.name
            value = env.value.value
          }
        }

        dynamic "env" {
          for_each = var.secret_refs
          content {
            name = env.value.name
            value_from {
              secret_key_ref {
                name = env.value.secret_id
                key  = env.value.key
              }
            }
          }
        }

        dynamic "ports" {
          for_each = var.ports
          content {
            name           = ports.value.name
            container_port = ports.value.container_port
          }
        }
      }
    }

    metadata {
      annotations = merge(
        var.annotations,
        {
          # "run.googleapis.com/ingress"              = var.public_access ? "all" : "internal"
          "run.googleapis.com/vpc-access-egress"    = "all-traffic"
          "autoscaling.knative.dev/minScale"        = var.min_scale
          "autoscaling.knative.dev/maxScale"        = var.max_scale
          "run.googleapis.com/vpc-access-connector" = var.vpc_connector_id
        }
      )
    }
  }
  metadata {
    annotations = merge(
      var.annotations,
      {
        "run.googleapis.com/ingress"              = var.public_access ? "all" : "internal"
      }
    )
  }

  autogenerate_revision_name = true

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      metadata.0.annotations,
    ]
  }
}

resource "google_cloud_run_service_iam_member" "allUsers" {
  service  = google_cloud_run_service.this.name
  location = google_cloud_run_service.this.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_secret_manager_secret_iam_member" "secret_access" {
  count     = length(var.secret_refs)
  secret_id = var.secret_refs[count.index].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
