import { test, expect } from '@playwright/test';

// Unique email per test run so re-runs don't hit "already registered"
const email = `e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'E2E Tester';

test.describe('Registration', () => {
  test('creates account and lands on dashboard', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Protein Tracker');

    await page.fill('#displayName', displayName);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    await expect(page.locator('.header-title')).toContainText('Protein Tracker');
  });

  test('shows error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#displayName', displayName);
    await page.fill('#email', email); // same email as above
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.alert-error')).toContainText('already exists');
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');

    // Touch all fields by tabbing through them
    await page.focus('#displayName');
    await page.focus('#email');
    await page.focus('#password');
    await page.focus('button[type="submit"]');

    await expect(page.locator('.field-error').first()).toBeVisible();
  });
});

test.describe('Login', () => {
  test('signs in with correct credentials and lands on dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Protein Tracker');

    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.alert-error')).toContainText('Invalid email or password');
  });

  test('shows error for unknown email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nobody@nowhere.com');
    await page.fill('#password', 'anypassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.alert-error')).toContainText('Invalid email or password');
  });
});

test.describe('Logout', () => {
  test('logs out and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });

    // Logout
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
