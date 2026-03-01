import { test, expect } from '@playwright/test';

const mockHealthResponse = {
  status: 'healthy',
  azure_openai_endpoint: true,
  azure_openai_deployment: true,
  credential_valid: true,
};

test.beforeEach(async ({ page }) => {
  // Intercept the backend health endpoint so E2E tests run without needing
  // the Python backend at :8000 to be running.
  await page.route('**/api/health', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockHealthResponse),
    });
  });
});

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

    // Verify the app header is present
    await expect(page.locator('.app-header')).toBeVisible();

    // Verify the status indicator is shown
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

  test('should load chat UI components', async ({ page }) => {
    await page.goto('/');

    // Check for the app header and main heading
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Azure OpenAI Realtime Chat');

    // Verify the status indicator is present
    await expect(page.locator('.status-indicator')).toBeVisible();

    // Verify the main content area is present
  test('should show backend ready status when health check passes', async ({ page }) => {
    await page.goto('/');

    // Verify the status indicator shows backend is ready
    await expect(page.locator('.status-indicator')).toContainText('Backend ready');
  });

  test('should show error state when backend is unreachable', async ({ page }) => {
    // Override the beforeEach mock to simulate an unreachable backend
    await page.route('**/api/health', (route) => route.abort());

    await page.goto('/');

    // Verify the UI shows the backend error state
    await expect(page.locator('.status-indicator')).toContainText('Backend unreachable');
    await expect(page.locator('.error-state')).toContainText('Cannot reach the backend server');
  });

  test('should show auth error when credential_valid is false', async ({ page }) => {
    // Override the beforeEach mock to return an auth failure response
    await page.route('**/api/health', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'unhealthy',
          credential_valid: false,
          credential_error: 'Token expired',
        }),
      });
    });

    await page.goto('/');

    // Verify the UI shows the auth error state
    await expect(page.locator('.status-indicator')).toContainText('Auth error');
    await expect(page.locator('.error-state')).toContainText('Azure authentication failed');
  test('should load app layout components', async ({ page }) => {
    await page.goto('/');

    // Check for the app header and main content areas
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-main')).toBeVisible();
  });
});
