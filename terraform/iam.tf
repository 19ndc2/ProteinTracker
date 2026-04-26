# ── Service account: Cloud Run runtime ───────────────────────────────────────

resource "google_service_account" "run_sa" {
  account_id   = "protein-tracker-run-sa"
  display_name = "Protein Tracker Cloud Run SA"
  project      = var.project_id
}

resource "google_secret_manager_secret_iam_member" "run_sa_mongodb_uri" {
  secret_id = google_secret_manager_secret.mongodb_uri.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_jwt_secret" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_cors_allowed_origins" {
  secret_id = google_secret_manager_secret.cors_allowed_origins.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_mistral_api_key" {
  secret_id = google_secret_manager_secret.mistral_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_google_client_id" {
  secret_id = google_secret_manager_secret.google_client_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_elevenlabs_api_key" {
  secret_id = google_secret_manager_secret.elevenlabs_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "run_sa_elevenlabs_voice_id" {
  secret_id = google_secret_manager_secret.elevenlabs_voice_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_artifact_registry_repository_iam_member" "run_sa_reader" {
  location   = var.region
  repository = google_artifact_registry_repository.registry.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.run_sa.email}"
}

# ── Service account: GitHub Actions deployer ─────────────────────────────────

resource "google_service_account" "gha_sa" {
  account_id   = "protein-tracker-gha-sa"
  display_name = "Protein Tracker GitHub Actions SA"
  project      = var.project_id
}

resource "google_project_iam_member" "gha_sa_cloudbuild" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${google_service_account.gha_sa.email}"
}

resource "google_project_iam_member" "gha_sa_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.gha_sa.email}"
}

resource "google_artifact_registry_repository_iam_member" "gha_sa_writer" {
  location   = var.region
  repository = google_artifact_registry_repository.registry.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.gha_sa.email}"
}

resource "google_service_account_iam_member" "gha_sa_act_as_run_sa" {
  service_account_id = google_service_account.run_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.gha_sa.email}"
}

# ── Workload Identity Federation (keyless auth from GitHub Actions) ───────────

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions pool"
  project                   = var.project_id

  depends_on = [google_project_service.iam]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC provider"
  project                            = var.project_id

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == '${var.github_repo}'"
}

resource "google_service_account_iam_member" "gha_wif_binding" {
  service_account_id = google_service_account.gha_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# ── Cloud Build default SA: push images to Artifact Registry ─────────────────

resource "google_artifact_registry_repository_iam_member" "cloudbuild_sa_writer" {
  location   = var.region
  repository = google_artifact_registry_repository.registry.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  depends_on = [google_project_service.cloudbuild]
}
