resource "google_artifact_registry_repository" "registry" {
  repository_id = "protein-tracker"
  location      = var.region
  format        = "DOCKER"
  project       = var.project_id

  depends_on = [google_project_service.artifactregistry]
}
