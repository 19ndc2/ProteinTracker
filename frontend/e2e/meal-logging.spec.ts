import { type Page, test, expect } from '@playwright/test';

const email = `meal_e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'Meal E2E Tester';

async function enterMeal(page: Page, text: string) {
  await expect(page.locator('.meal-input')).toBeVisible({ timeout: 10000 });
  await page.locator('.meal-input').fill(text);
  await expect(page.locator('.btn-log')).toBeEnabled({ timeout: 5000 });
}

test.describe('Meal Logging', () => {
  test.describe.configure({ timeout: 60000 });
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

  test('typing a meal and clicking Estimate shows a protein preview', async ({ page }) => {
    await enterMeal(page, '2 chicken breasts');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.preview-confirmation')).not.toBeEmpty();

    const gramsText = await page.locator('.preview-grams .grams-value').textContent();
    expect(Number(gramsText?.trim())).toBeGreaterThan(0);
  });

  test("confirming an estimate logs the meal and shows it in Today's meals", async ({ page }) => {
    await enterMeal(page, '2 chicken breasts');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 20000 });

    const expectedGrams = (await page.locator('.preview-grams .grams-value').textContent())?.trim();

    await page.locator('.preview-actions .btn-primary').click();

    await expect(page.locator('.success-card')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.success-card')).toContainText('Meal logged!');

    // entries list refreshes while the success card is still visible
    await expect(page.locator('.entries-card')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.entry-name').first()).not.toBeEmpty();
    await expect(page.locator('.entry-grams').first()).toContainText(`${expectedGrams}g`);
  });

  test('clicking Try again discards the estimate and returns to the input', async ({ page }) => {
    await enterMeal(page, '1 cup of Greek yogurt');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 20000 });

    await page.locator('.preview-actions .btn-secondary').click();

    await expect(page.locator('.preview-card')).not.toBeVisible();
    await expect(page.locator('.meal-input')).toBeVisible();
  });

  test('explicit "Ng protein" suffix uses that value as the estimate', async ({ page }) => {
    await enterMeal(page, 'chickpea salad 30g protein');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 10000 });
    const gramsText = await page.locator('.preview-grams .grams-value').textContent();
    expect(Number(gramsText?.trim())).toBe(30);
  });

  test('trailing "Ng" suffix uses that value as the estimate', async ({ page }) => {
    await enterMeal(page, 'chicken salad 50g');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 10000 });
    const gramsText = await page.locator('.preview-grams .grams-value').textContent();
    expect(Number(gramsText?.trim())).toBe(50);
  });

  test('confirming a meal updates the daily protein ring total', async ({ page }) => {
    const gramsBefore = Number((await page.locator('.ring-total').textContent())?.trim() ?? '0');

    await enterMeal(page, '3 eggs');
    await page.locator('.btn-log').click();

    await expect(page.locator('.preview-card')).toBeVisible({ timeout: 20000 });
    const estimatedGrams = Number(
      (await page.locator('.preview-grams .grams-value').textContent())?.trim(),
    );

    await page.locator('.preview-actions .btn-primary').click();
    await expect(page.locator('.success-card')).toBeVisible({ timeout: 8000 });

    await expect(page.locator('.ring-total')).toHaveText(String(gramsBefore + estimatedGrams), {
      timeout: 8000,
    });
  });
});
