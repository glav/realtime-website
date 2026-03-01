import { test, expect } from '@playwright/test';

const healthyBackend = {
  status: 'ok',
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
    // Verify the main heading is visible
    await expect(page.locator('h1')).toContainText('Azure OpenAI Realtime Chat');

    // Verify the app header is present
    await expect(page.locator('.app-header')).toBeVisible();

    // Verify the status indicator is shown
    // Verify the status indicator is present
    await expect(page.locator('.status-indicator')).toBeVisible();
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

    // Check for errors
    expect(errors).toHaveLength(0);
  });

  test('should load chat UI components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out browser-level favicon 404s which are not app errors
    const unexpectedErrors = errors.filter(e => !e.toLowerCase().includes('favicon'));
    expect(unexpectedErrors).toHaveLength(0);
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
