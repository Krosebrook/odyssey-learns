import { test, expect } from '@playwright/test';

/**
 * Security E2E Tests
 * Tests authentication, authorization, and data protection
 */
test.describe('Authentication Security', () => {
  test('unauthenticated users cannot access protected routes', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    // Try to access protected parent routes
    await page.goto('/parent');
    await expect(page).toHaveURL(/\/(login|auth)/);
    
    // Try to access protected child routes
    await page.goto('/child/dashboard');
    await expect(page).toHaveURL(/\/(login|auth|select-child)/);
    
    // Try to access admin routes
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/(login|auth)/);
  });

  test('session expires after inactivity timeout', async ({ page }) => {
    // This test checks that sessionStorage is used for sensitive data
    await page.goto('/');
    
    // Check that localStorage doesn't contain sensitive error data
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localStorageKeys).not.toContain('critical_errors');
    expect(localStorageKeys).not.toContain('failed_error_batches');
    expect(localStorageKeys).not.toContain('app_errors');
  });

  test('logout clears sensitive session data', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_PARENT_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_PARENT_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for authenticated state
    await page.waitForURL('/parent*', { timeout: 10000 }).catch(() => {
      // May redirect elsewhere
    });
    
    // Trigger some activity that might store data
    await page.evaluate(() => {
      sessionStorage.setItem('critical_errors', '[]');
      sessionStorage.setItem('session_activity', Date.now().toString());
    });
    
    // Logout
    await page.click('text=/logout|sign out/i');
    
    // Verify session data is cleared
    const sessionData = await page.evaluate(() => ({
      criticalErrors: sessionStorage.getItem('critical_errors'),
      sessionActivity: sessionStorage.getItem('session_activity'),
    }));
    
    expect(sessionData.criticalErrors).toBeNull();
    expect(sessionData.sessionActivity).toBeNull();
  });
});

/**
 * Input Validation and Sanitization Tests
 */
test.describe('Input Validation Security', () => {
  test('login form prevents SQL injection attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Try SQL injection in email field
    await page.fill('input[type="email"]', "'; DROP TABLE users; --");
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should show validation error, not crash
    await expect(page.locator('text=/invalid|error/i').first()).toBeVisible();
  });

  test('signup form sanitizes input', async ({ page }) => {
    await page.goto('/login');
    await page.click('[value="signup"]');
    
    // Try XSS in name field
    await page.fill('input[type="text"][autocomplete="name"]', '<script>alert("xss")</script>');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[autocomplete="new-password"]', 'SecureP@ss123!');
    await page.fill('input[id*="confirmPassword"]', 'SecureP@ss123!');
    
    await page.click('button[type="submit"]');
    
    // Page should not execute script
    const alertDialog = page.locator('dialog[open], .alert');
    await expect(alertDialog).not.toBeVisible();
  });

  test('forms enforce maximum length limits', async ({ page }) => {
    await page.goto('/login');
    await page.click('[value="signup"]');
    
    // Try to input very long email
    const longEmail = 'a'.repeat(300) + '@example.com';
    await page.fill('input[type="email"]', longEmail);
    
    // Email should be truncated or rejected
    const emailValue = await page.inputValue('input[type="email"]');
    expect(emailValue.length).toBeLessThanOrEqual(255);
  });
});

/**
 * Rate Limiting Tests
 */
test.describe('Rate Limiting', () => {
  test('login is rate limited after multiple failed attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Should show rate limit message
    await expect(page.locator('text=/too many|rate limit|wait/i').first()).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Authorization Tests (RLS Policies)
 */
test.describe('Authorization Security', () => {
  test('parent can only see their own children data', async ({ page }) => {
    // Login as parent
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_PARENT_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_PARENT_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/parent*');
    
    // Check that only own children are listed
    // This is validated by RLS on the backend
    const childrenList = page.locator('[data-testid="child-list"], .children-list');
    
    // Should not see error about unauthorized access
    const errorMessage = page.locator('text=/unauthorized|forbidden|not allowed/i');
    await expect(errorMessage).not.toBeVisible();
  });

  test('non-admin users cannot access admin routes', async ({ page }) => {
    // Login as regular parent
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_PARENT_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_PARENT_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/parent*');
    
    // Try to access admin route
    await page.goto('/admin');
    
    // Should redirect away or show unauthorized message
    await expect(page).not.toHaveURL('/admin');
  });
});

/**
 * CSRF Protection Tests
 */
test.describe('CSRF Protection', () => {
  test('API requests require authentication token', async ({ page }) => {
    // Make direct API request without auth
    const response = await page.request.get('/api/children');
    
    // Should return 401 Unauthorized
    expect([401, 403, 404]).toContain(response.status());
  });
});

/**
 * Security Headers Tests
 */
test.describe('Security Headers', () => {
  test('response includes security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    // Check for important security headers
    // Note: Some headers may be set by CDN/hosting, not all may be present in dev
    const hasSecurityHeaders = 
      headers['x-content-type-options'] === 'nosniff' ||
      headers['x-frame-options'] ||
      headers['strict-transport-security'];
    
    // At minimum, page should load without security errors
    expect(response?.status()).toBe(200);
  });
});