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
    await expect(page.locator('h1')).toContainText('Azure OpenAI Realtime Chat');

    // Verify the status indicator is present
    await expect(page.locator('.status-indicator')).toBeVisible();
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

  test('should load app layout components', async ({ page }) => {
    await page.goto('/');

    // Check for the app header and main content areas
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-main')).toBeVisible();
  });
});
