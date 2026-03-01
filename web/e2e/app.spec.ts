import { test, expect } from '@playwright/test';

const healthyBackend = {
  status: 'ok',
  azure_openai_endpoint: true,
  azure_openai_deployment: true,
  credential_valid: true,
};

test.describe('App Loading', () => {
  test('should load the homepage with the chat UI', async ({ page }) => {
    test.setTimeout(15000);

    // Mock the health endpoint so tests don't require the backend to be running
    await page.route('**/api/health', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(healthyBackend),
      })
    );

    await page.goto('/');

    // Root element should be visible
    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });

    // Page title
    await expect(page).toHaveTitle('web');

    // Main heading reflects the chat app
    await expect(page.locator('h1')).toContainText('Azure OpenAI Realtime Chat');

    // Status indicator shows backend is ready
    await expect(page.locator('.status-indicator')).toContainText('Backend ready');

    // Chat UI is rendered
    await expect(page.locator('.chat-container-wrapper')).toBeVisible();

    // Connect button is present
    await expect(page.locator('button.connect-button')).toContainText('Connect');
  });

  test('should show error state when backend is unreachable', async ({ page }) => {
    test.setTimeout(15000);

    // Simulate backend being unreachable
    await page.route('**/api/health', route => route.abort());

    await page.goto('/');

    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });

    // Status indicator shows backend is unreachable
    await expect(page.locator('.status-indicator')).toContainText('Backend unreachable', { timeout: 8000 });

    // Error state message is displayed
    await expect(page.locator('.error-state')).toBeVisible();
    await expect(page.locator('.error-state')).toContainText('Cannot reach the backend server');
  });

  test('should not have unexpected console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Mock health so no fetch failures pollute the error list
    await page.route('**/api/health', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(healthyBackend),
      })
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out browser-level favicon 404s which are not app errors
    const unexpectedErrors = errors.filter(e => !e.toLowerCase().includes('favicon'));
    expect(unexpectedErrors).toHaveLength(0);
  });
});
