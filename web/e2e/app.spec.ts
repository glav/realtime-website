import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the homepage without hanging', async ({ page }) => {
    // Set a reasonable timeout
    test.setTimeout(10000);

    // Navigate to the app
    await page.goto('/');

    // Wait for the root element to be visible
    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });

    // Check that the page title is correct
    await expect(page).toHaveTitle('web');

    // Verify the main heading is visible
    await expect(page.locator('h1')).toContainText('Vite + React');

    // Verify the button is visible and functional
    const button = page.locator('button');
    await expect(button).toBeVisible();
    await expect(button).toContainText('count is 0');

    // Click the button and verify it updates
    await button.click();
    await expect(button).toContainText('count is 1');
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for errors
    expect(errors).toHaveLength(0);
  });

  test('should load React components', async ({ page }) => {
    await page.goto('/');

    // Check for React logos
    await expect(page.locator('img[alt="React logo"]')).toBeVisible();
    await expect(page.locator('img[alt="Vite logo"]')).toBeVisible();

    // Verify links are present
    await expect(page.locator('a[href*="react.dev"]')).toBeVisible();
    await expect(page.locator('a[href*="vite.dev"]')).toBeVisible();
  });
});
