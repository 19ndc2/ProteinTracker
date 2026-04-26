output "cloud_run_url" {
  description = "Live URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_url" {
  description = "Base URL for pushing Docker images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/protein-tracker"
}

output "workload_identity_provider" {
  description = "Full WIF provider resource name — add this as the WIF_PROVIDER GitHub Actions secret"
  value       = google_iam_workload_identity_pool_provider.github.name
}
