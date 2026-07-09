# Testing Guide

This project has two **parallel, independently maintained** end-to-end suites covering the
exact same 19 scenarios (registration/login/logout, protein goal editing, meal logging) —
one in Playwright, one in Cypress. This is a deliberate side-by-side duplication to
demonstrate hands-on familiarity with both major e2e frameworks, not a migration. Neither
suite depends on the other, and changes to one are not expected to be mirrored in the other
automatically.

| | Playwright | Cypress |
|---|---|---|
| Location | `frontend/e2e/` | `frontend/cypress/e2e/` |
| Config | `frontend/playwright.config.ts` | `frontend/cypress.config.ts` |
| Run (headless) | `npm run e2e` | `npm run cy:run` |
| Run (interactive/headed) | `npm run e2e:headed` | `npm run cy:open` |
| Base URL override | `BASE_URL` env var | `CYPRESS_BASE_URL` env var |
| Runs in CI? | **Yes** — `.github/workflows/deploy.yml`'s `e2e` job, against the live Cloud Run URL, on every push to `main` | **No** — manual-only, see below |

## Shared local setup

Both suites test the same running app, so the setup is identical:

```bash
# 1. Backend — embedded in-memory MongoDB, no Docker needed
cd backend
SPRING_PROFILES_ACTIVE=e2e mvn spring-boot:run

# 2. Frontend, in a second terminal
cd frontend
ng serve --port 4201
```

Both `playwright.config.ts` and `cypress.config.ts` default their base URL to
`http://localhost:4201`, matching the port above — no env vars needed for a local run.

## Running the Playwright suite

```bash
cd frontend
npm run e2e            # headless
npm run e2e:headed     # watch it run in a real browser window
```

## Running the Cypress suite

```bash
cd frontend
npm run cy:open        # interactive test runner — pick a spec, watch it live
npm run cy:run         # headless, single run, exits with a pass/fail summary
```

`cy:run` is pinned to `--browser chrome` (matching Playwright's Chromium-only scope), so a
local install of Google Chrome is required to run it headlessly. `cy:open` lets you pick any
browser Cypress detects on your machine.

## Why Cypress isn't in CI

This is intentional, not an oversight. Playwright already covers this app's e2e testing in
the automated pipeline (`.github/workflows/deploy.yml`), running against the real live
deployment after every push. Cypress is kept as a separate, manual-only suite purely to
showcase framework versatility — adding it to CI would just run the same 19 assertions twice
on every deploy for no additional coverage. Nothing needed to be excluded or disabled to
achieve this: the CI workflow simply never installs or invokes Cypress anywhere.
