# ProteinTracker

A full-stack web application for tracking daily protein intake. Log meals by voice or text, get AI-powered protein estimates, and monitor your progress against a personal daily goal.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Running Tests](#running-tests)
- [Docker](#docker)
- [Deployment](#deployment)
- [API Reference](#api-reference)

---

## Features

- **Voice meal logging** — Record audio in the browser; ElevenLabs transcribes it to text
- **AI protein estimation** — Mistral AI (via LangChain4j) parses the food description and returns a protein estimate with a confirmation prompt before saving
- **Daily progress ring** — Visual ring showing grams consumed vs. your personal daily goal (default 150 g, editable)
- **Meal history** — Browse past daily logs and delete individual entries
- **Monthly statistics** — 30-day view with per-day protein totals and a daily average
- **Authentication** — Email/password registration or Google OAuth sign-in; API secured with JWT
- **Progressive Web App** — Angular service worker included for offline-capable access

---

## Architecture

The application is a monorepo with a single deployable container. The Spring Boot backend serves the compiled Angular SPA from its `static/` resources directory, so there is one process and one port at runtime.

```
Browser
  |
  |-- /api/*   --> Spring Boot (REST controllers, JWT auth)
  |-- /*       --> Angular SPA (served as static files by Spring Boot)

Spring Boot
  |-- ProteinController   (parse, confirm, today, history, stats, delete)
  |-- AuthController      (register, login, Google OAuth, goal)
  |-- ConfigController    (vends ElevenLabs credentials to the frontend)
  |-- ProteinAgent        (LangChain4j AI service → Mistral API)
  |-- MongoDB             (DailyLog, User, FoodReference documents)
```

The multi-stage Dockerfile builds the Angular app first, copies the output into `backend/src/main/resources/static`, then packages everything into a single JAR. All CI/CD image builds run on Google Cloud Build — no local Docker daemon is required in production.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Java 21 |
| Backend framework | Spring Boot 3.3 (Web, Security, Data MongoDB) |
| AI / LLM | LangChain4j 0.36 + Mistral AI (`mistral-small-latest`) |
| Speech-to-text | ElevenLabs Scribe v1 |
| Auth | JWT (jjwt 0.12) + Google ID token verification |
| Database | MongoDB 7 |
| Frontend framework | Angular 18 (standalone components, lazy-loaded routes) |
| Frontend language | TypeScript 5.4 |
| Frontend testing | Karma/Jasmine (unit), Playwright 1.56 (E2E) |
| Backend testing | JUnit 5, MockMvc, Flapdoodle embedded MongoDB |
| Container | Docker (multi-stage build) |
| Infrastructure | Terraform, Google Cloud Run, Artifact Registry, Secret Manager |
| CI/CD | GitHub Actions + Google Cloud Build |

---

## Local Development

### Prerequisites

- Java 21 (Temurin recommended)
- Maven 3.9+
- Node.js 20 and npm
- Docker and Docker Compose (for MongoDB)
- A [Mistral AI](https://console.mistral.ai/) API key
- An [ElevenLabs](https://elevenlabs.io/) API key and Voice ID
- A Google OAuth 2.0 Client ID (and Client Secret) for Google sign-in

### Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://localhost:27017/protein_tracker`) |
| `JWT_SECRET` | Secret used to sign JWTs (any long random string) |
| `MISTRAL_API_KEY` | API key from the Mistral AI console |
| `ELEVENLABS_API_KEY` | API key from the ElevenLabs dashboard |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID used for confirmation readback |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console |

> `GOOGLE_CLIENT_SECRET` is required by the backend for Google token verification but is not present in `.env.example` — add it manually.

### Running the Backend

Start MongoDB with Docker Compose:

```bash
docker-compose up -d
```

Then start the Spring Boot application:

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

The API is available at `http://localhost:8080`.

### Running the Frontend

In a separate terminal:

```bash
cd frontend
npm ci
npm start
```

The Angular dev server runs at `http://localhost:4200` and proxies `/api` requests to `localhost:8080`.

---

## Running Tests

**Backend unit tests** — uses Flapdoodle embedded MongoDB, so no running database is needed:

```bash
cd backend
mvn test
```

**Frontend unit tests** (Karma/Jasmine):

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

**Frontend E2E tests** (Playwright — requires the app to be running):

```bash
# Install Playwright browsers once
cd frontend
npx playwright install --with-deps chromium

# Run against the local dev server (default BASE_URL: http://localhost:4201)
npm run e2e

# Run in headed mode for debugging
npm run e2e:headed
```

E2E tests cover auth flows, meal logging, and goal setting.

---

## Docker

Build the production image (Angular + Spring Boot in a single container):

```bash
docker build -t protein-tracker:latest .
```

Run the container:

```bash
docker run -p 8080:8080 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/protein_tracker \
  -e JWT_SECRET=your_secret \
  -e MISTRAL_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -e ELEVENLABS_VOICE_ID=your_voice_id \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GOOGLE_CLIENT_SECRET=your_client_secret \
  protein-tracker:latest
```

The app is served at `http://localhost:8080`.

---

## Deployment

The project deploys to **Google Cloud Run** (serverless, scales to zero). Infrastructure is managed with Terraform and CI/CD runs through GitHub Actions + Google Cloud Build.

The pipeline (`.github/workflows/deploy.yml`) triggers on every push to `main`:

1. Backend unit tests
2. Frontend unit tests
3. Build and push image via Cloud Build
4. Deploy to Cloud Run using Workload Identity Federation (no long-lived service account keys)
5. Playwright E2E tests against the live Cloud Run URL

For the full walkthrough — GCP project bootstrap, Terraform setup, Workload Identity Federation configuration, and Secret Manager population — see [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md).

---

## API Reference

All endpoints except `/api/auth/register`, `/api/auth/login`, and `/api/auth/google` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with email, password, and display name |
| `POST` | `/api/auth/login` | Login with email and password; returns JWT |
| `POST` | `/api/auth/google` | Login or register via Google ID token |
| `GET` | `/api/auth/me` | Return the authenticated user's profile |
| `PATCH` | `/api/auth/goal` | Update the authenticated user's daily protein goal |

### Protein Logging

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/protein/parse` | Send a food description to the AI agent; returns estimated protein grams and a confirmation message |
| `POST` | `/api/protein/confirm` | Save a confirmed meal entry to the daily log |
| `GET` | `/api/protein/today` | Retrieve today's meal entries and running total |
| `GET` | `/api/protein/history` | Retrieve all past daily logs, newest first |
| `GET` | `/api/protein/stats/monthly` | Per-day protein totals and average for the last 30 days |
| `DELETE` | `/api/protein/entry/{date}/{entryId}` | Remove a single entry (`date` format: `YYYY-MM-DD`) |

### Config

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/config/voice-key` | Returns the ElevenLabs API key and voice ID for use by the frontend |
