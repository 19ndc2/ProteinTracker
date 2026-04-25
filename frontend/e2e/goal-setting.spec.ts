import { test, expect } from '@playwright/test';

const email = `goal_e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'Goal E2E Tester';

test.describe('Protein Goal Setting', () => {
  test.describe.configure({ timeout: 30000 });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/register');
    await page.fill('#displayName', displayName);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 8000 });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 8000 });
  });

  test('dashboard shows the default goal of 150g', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.ring-label')).toContainText('150');
  });

  test('clicking the edit button enters goal-edit mode', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await expect(page.locator('.goal-input')).toBeVisible({ timeout: 5000 });
  });

  test('saving a new goal updates the displayed goal', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await page.locator('.goal-input').fill('200');
    await page.locator('.btn-goal-save').click();

    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ring-label')).toContainText('200');
  });

  test('pressing Enter saves the goal', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await page.locator('.goal-input').fill('180');
    await page.locator('.goal-input').press('Enter');

    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ring-label')).toContainText('180');
  });

  test('pressing Escape cancels without changing the goal', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    const originalText = await page.locator('.ring-label').textContent();

    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await page.locator('.goal-input').fill('999');
    await page.locator('.goal-input').press('Escape');

    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ring-label')).toHaveText(originalText!.trim());
  });

  test('cancel button restores the original goal', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    const originalText = await page.locator('.ring-label').textContent();

    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await page.locator('.goal-input').fill('999');
    await page.locator('.btn-goal-cancel').click();

    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ring-label')).toHaveText(originalText!.trim());
  });

  test('goal persists after page reload', async ({ page }) => {
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await page.locator('.ring-text').hover();
    await page.locator('.btn-edit-goal').click();

    await page.locator('.goal-input').fill('220');
    await page.locator('.btn-goal-save').click();

    await expect(page.locator('.ring-label')).toContainText('220', { timeout: 5000 });

    await page.reload();
    await expect(page.locator('.ring-label')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.ring-label')).toContainText('220');
  });
});
