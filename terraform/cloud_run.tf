locals {
  # Cloud Run's project-number-based URL is deterministic and always valid,
  # so it can be computed up front instead of waiting on the service's own
  # (circular) .uri output. But this already-provisioned service's *actual*
  # default URL is the original hash-based one GCP assigned at creation time
  # (what `gcloud run services describe --format=value(status.url)` returns,
  # and what CI's e2e job uses as BASE_URL) — that hash isn't derivable from
  # other inputs, so it's listed as a literal. Both are allowed so CORS keeps
  # working regardless of which origin a client actually uses.
  cloud_run_url_computed = "https://protein-tracker-${data.google_project.project.number}.${var.region}.run.app"
  cloud_run_url_actual   = "https://protein-tracker-lzkghp6vta-uc.a.run.app"
  cors_allowed_origins   = "${local.cloud_run_url_computed},${local.cloud_run_url_actual}"
}

resource "google_cloud_run_v2_service" "app" {
  name     = "protein-tracker"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      # Placeholder replaced on first CI/CD pipeline run.
      # image is excluded from lifecycle management so Terraform
      # doesn't revert what GitHub Actions deploys.
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongodb_uri.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "CORS_ALLOWED_ORIGINS"
        value = local.cors_allowed_origins
      }

      env {
        name = "MISTRAL_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mistral_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.google_client_id.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "ELEVENLABS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.elevenlabs_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "ELEVENLABS_VOICE_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.elevenlabs_voice_id.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.run,
    google_secret_manager_secret_iam_member.run_sa_mongodb_uri,
    google_secret_manager_secret_iam_member.run_sa_jwt_secret,
    google_secret_manager_secret_iam_member.run_sa_mistral_api_key,
    google_secret_manager_secret_iam_member.run_sa_google_client_id,
    google_secret_manager_secret_iam_member.run_sa_elevenlabs_api_key,
    google_secret_manager_secret_iam_member.run_sa_elevenlabs_voice_id,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  name     = google_cloud_run_v2_service.app.name
  location = var.region
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}
