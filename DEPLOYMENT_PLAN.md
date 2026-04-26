# Protein Tracker: Google Cloud Run Deployment Plan

## Context
Deploy the existing full-stack monorepo (Angular 18 + Spring Boot 3.3, single container on port 8080) to Google Cloud Run. A complete multi-stage Dockerfile already exists. Infrastructure is managed via Terraform; anything Terraform can't bootstrap uses the gcloud CLI. GitHub Actions handles CI/CD, triggering on every push to `main` to test, build (via Google Cloud Build — no local Docker required), and deploy.

**Docker Desktop is NOT needed at any step.** All image building is delegated to Google Cloud Build, which runs entirely in GCP. Your Mac only needs the `gcloud` and `terraform` CLIs.

**Cost profile: near-free.** No always-on VMs. GitHub Actions runners are free (public repo) or use the free tier (2,000 min/month for private). Cloud Run scales to zero. Cloud Build gets 120 free build-minutes/day. Expected monthly cost: <$1.

---

## Phase 1: Local Tooling (one-time)

Install via Homebrew:
```bash
brew install --cask google-cloud-sdk
brew tap hashicorp/tap && brew install hashicorp/tap/terraform
```

---

## Phase 2: GCP Bootstrap via gcloud (Terraform can't do these first)

```bash
gcloud auth login
gcloud auth application-default login

gcloud projects create protein-tracker-prod --name="Protein Tracker"
gcloud config set project protein-tracker-prod

# Link billing (get BILLING_ID from: gcloud billing accounts list)
gcloud billing projects link protein-tracker-prod --billing-account=BILLING_ID

# Bootstrap APIs needed before Terraform can run
gcloud services enable cloudresourcemanager.googleapis.com serviceusage.googleapis.com

# Remote state bucket
gcloud storage buckets create gs://protein-tracker-tf-state \
  --project=protein-tracker-prod --location=us-central1 \
  --uniform-bucket-level-access
```

---

## Phase 3: Terraform Infrastructure

### Directory structure (add to repo root, commit to `main`)
```
terraform/
  main.tf       — provider, GCS backend, API enablement
  variables.tf  — project_id, region, github_repo
  outputs.tf    — Cloud Run URL, registry URL, WIF provider name
  iam.tf        — service accounts, WIF pool/provider, IAM bindings
  secrets.tf    — 7 Secret Manager secret containers (empty shells)
  artifact.tf   — Artifact Registry Docker repo
  cloud_run.tf  — Cloud Run service with secret env var references
```

No `jenkins_vm.tf` — no VM needed.

### Key resources per file

**main.tf**
- Provider: `google ~> 5.0`
- Backend: `gcs { bucket = "protein-tracker-tf-state" prefix = "terraform/state" }`
- `google_project_service` (one each, `disable_on_destroy = false`) for:
  `artifactregistry`, `run`, `cloudbuild`, `secretmanager`, `iam`, `iamcredentials`
  (no `compute` API needed — no VMs)

**variables.tf** — declare with defaults:
- `project_id` (required)
- `region = "us-central1"`
- `github_repo = "19ndc2/ProteinTracker"` — used to scope WIF to this repo only
- `cloud_run_min_instances = 0`, `cloud_run_max_instances = 3`

**iam.tf** — two service accounts + Workload Identity Federation:

*Service account 1: Cloud Run runtime*
- `account_id = "protein-tracker-run-sa"`
- Bindings: `roles/secretmanager.secretAccessor` on each of the 7 secrets; `roles/artifactregistry.reader` on the registry

*Service account 2: GitHub Actions deployer*
- `account_id = "protein-tracker-gha-sa"`
- Bindings at project level: `roles/cloudbuild.builds.editor`, `roles/run.developer`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` on the run SA

*Workload Identity Federation (keyless auth — no JSON keys stored anywhere):*
- `google_iam_workload_identity_pool` — `id = "github-pool"`
- `google_iam_workload_identity_pool_provider` — OIDC, issuer: `https://token.actions.githubusercontent.com`, attribute mapping: `google.subject = assertion.sub`, attribute condition: `assertion.repository == '${var.github_repo}'`
- `google_service_account_iam_member` — allow the WIF pool to impersonate `gha-sa`:
  `member = "principalSet://iam.googleapis.com/${pool.name}/attribute.repository/${var.github_repo}"`
  `role = "roles/iam.workloadIdentityUser"`

*Cloud Build SA:*
- `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com` → `roles/artifactregistry.writer` on the registry (Cloud Build pushes the built image)

**outputs.tf**
- `cloud_run_url` — `google_cloud_run_v2_service.app.uri`
- `artifact_registry_url` — `"${var.region}-docker.pkg.dev/${var.project_id}/protein-tracker"`
- `workload_identity_provider` — full WIF provider resource name (needed as a GitHub Actions secret)

**secrets.tf** — 7 `google_secret_manager_secret` resources (auto replication, values left empty):
`mongodb-uri`, `jwt-secret`, `google-client-id`, `google-client-secret`,
`mistral-api-key`, `elevenlabs-api-key`, `elevenlabs-voice-id`

**artifact.tf**
- `google_artifact_registry_repository` — `repository_id = "protein-tracker"`, `format = "DOCKER"`, `location = var.region`

**cloud_run.tf**
- `google_cloud_run_v2_service` — port 8080, SA = run SA, placeholder image (`us-docker.pkg.dev/cloudrun/container/hello`) on first apply; GitHub Actions will overwrite on first pipeline run
- All 7 env vars sourced from Secret Manager via `value_source.secret_key_ref { version = "latest" }`
- `google_cloud_run_v2_service_iam_member` — `allUsers` → `roles/run.invoker` (public access)

---

## Phase 4: Populate Secrets (after `terraform apply`)

```bash
# -n flag prevents a trailing newline from corrupting key values
echo -n "mongodb+srv://..." | gcloud secrets versions add mongodb-uri --data-file=-
echo -n "YOUR_JWT_SECRET"   | gcloud secrets versions add jwt-secret --data-file=-
echo -n "YOUR_VALUE"        | gcloud secrets versions add google-client-id --data-file=-
echo -n "YOUR_VALUE"        | gcloud secrets versions add google-client-secret --data-file=-
echo -n "YOUR_VALUE"        | gcloud secrets versions add mistral-api-key --data-file=-
echo -n "YOUR_VALUE"        | gcloud secrets versions add elevenlabs-api-key --data-file=-
echo -n "YOUR_VALUE"        | gcloud secrets versions add elevenlabs-voice-id --data-file=-
```

---

## Phase 5: GitHub Actions Secrets

After `terraform apply`, add two secrets to the GitHub repo (Settings → Secrets and variables → Actions):

| Secret name | Value |
|---|---|
| `WIF_PROVIDER` | `terraform output -raw workload_identity_provider` |
| `GCP_SA_EMAIL` | `protein-tracker-gha-sa@protein-tracker-prod.iam.gserviceaccount.com` |

No JSON keys, no long-lived credentials.

---

## Phase 6: Testing Strategy

### What runs where and why

| Test type | Runs in | Env vars needed | Notes |
|---|---|---|---|
| Backend unit tests (`mvn test`) | GitHub Actions runner | None | Flapdoodle embedded MongoDB handles data; no real secrets touched |
| Frontend unit tests (`ng test`) | GitHub Actions runner | None | Karma mocks all Angular services via `TestBed`; no API calls made |
| Playwright e2e tests | GitHub Actions runner (post-deploy) | None | Tests hit the live Cloud Run URL; the deployed app already has all secrets via Secret Manager |

**No secrets are ever exposed to the GitHub Actions runner.** Unit tests don't need them, and e2e tests hit the already-deployed app rather than booting it locally.

One prerequisite: `playwright.config.ts` must read `baseURL` from an environment variable so the post-deploy job can point it at Cloud Run:
```ts
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:4200',
}
```
This is a one-line change to the existing config file.

---

## Phase 7: GitHub Actions Workflow (add to repo)

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main]

env:
  PROJECT_ID:   protein-tracker-prod
  REGION:       us-central1
  SERVICE_NAME: protein-tracker
  IMAGE:        us-central1-docker.pkg.dev/protein-tracker-prod/protein-tracker/protein-tracker-app

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: temurin
          cache: maven
      - run: mvn test -q
        working-directory: backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npx ng test --watch=false --browsers=ChromeHeadless
        working-directory: frontend

  build-and-deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write   # required for WIF keyless auth
    outputs:
      cloud_run_url: ${{ steps.get-url.outputs.url }}

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SA_EMAIL }}

      - uses: google-github-actions/setup-gcloud@v2

      # Docker Desktop NOT used. Cloud Build runs the Dockerfile entirely in GCP.
      - name: Build & push image via Cloud Build
        run: |
          gcloud builds submit . \
            --tag=${{ env.IMAGE }}:${{ github.sha }} \
            --project=${{ env.PROJECT_ID }} \
            --timeout=20m

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image=${{ env.IMAGE }}:${{ github.sha }} \
            --region=${{ env.REGION }} \
            --project=${{ env.PROJECT_ID }} \
            --platform=managed \
            --quiet

      - name: Get Cloud Run URL
        id: get-url
        run: |
          URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} \
            --region=${{ env.REGION }} --project=${{ env.PROJECT_ID }} \
            --format='value(status.url)')
          echo "url=$URL" >> "$GITHUB_OUTPUT"

  e2e:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: frontend
      - name: Run e2e tests against live Cloud Run
        run: npx playwright test
        working-directory: frontend
        env:
          BASE_URL: ${{ needs.build-and-deploy.outputs.cloud_run_url }}
```

Pipeline flow: `test-backend` and `test-frontend` run in parallel → `build-and-deploy` runs only if both pass → `e2e` runs against the freshly deployed Cloud Run URL.

---

## Execution Order (zero to live)

1. Install gcloud + Terraform locally (Phase 1)
2. Run Phase 2 bootstrap commands
3. Add `terraform/` directory to repo, commit to `main`
4. `terraform init && terraform apply -var="project_id=protein-tracker-prod"`
5. Populate secrets (Phase 4)
6. Add `WIF_PROVIDER` and `GCP_SA_EMAIL` as GitHub Actions secrets (Phase 5)
7. Update `playwright.config.ts` to read `baseURL` from `process.env.BASE_URL` (Phase 6)
8. Add `.github/workflows/deploy.yml` to repo, commit and push to `main`
9. Watch the Actions tab — all four jobs trigger automatically
10. After first successful deploy, update `cloud_run.tf` to replace placeholder image with real image → `terraform apply` once more
11. Verify: `curl https://CLOUD_RUN_URL/` (200) and `curl https://CLOUD_RUN_URL/api/auth/me` (401)

---

## Post-Deploy: Update Google OAuth

Once you know the Cloud Run URL, add it to your Google OAuth client in Google Cloud Console:
- APIs & Services → Credentials → your OAuth client
- Add the Cloud Run URL to **Authorized JavaScript origins**
- Without this, Google login will be blocked in production

---

## Critical Files
- `Dockerfile` — already complete; Cloud Build executes this as-is
- `backend/src/main/resources/application.yml` — confirms the 7 env var names Terraform must match exactly
- `backend/pom.xml` — `flapdoodle.embed.mongo` is test-scoped, so `mvn test` works in CI without a real MongoDB
- `frontend/package.json` — `"test": "ng test"` is the command the workflow runs; ChromeHeadless is available on `ubuntu-latest` GitHub runners by default (no extra install needed)
- `frontend/playwright.config.ts` — requires a one-line change: `baseURL: process.env.BASE_URL || 'http://localhost:4200'` so the post-deploy e2e job can point Playwright at the live Cloud Run URL

---

## Cost Breakdown
| Resource | Cost |
|---|---|
| Cloud Run | ~$0 (scales to zero; pay per request) |
| GitHub Actions | Free (public repo) or free tier 2,000 min/month (private) |
| Cloud Build | Free up to 120 min/day; each build ~4–6 min |
| Artifact Registry | Free up to 0.5 GB/month |
| Secret Manager | Free up to 6 secret versions/month |
| GCE VM | $0 — none needed |
| **Total** | **< $1/month** |
