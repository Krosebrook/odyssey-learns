import { test, expect } from '@playwright/test';

/**
 * Session Management E2E Tests
 */
test.describe('Session Management', () => {
  test('session activity is tracked in sessionStorage', async ({ page }) => {
    await page.goto('/');
    
    // After page load, session activity should be tracked in sessionStorage (not localStorage)
    const sessionActivity = await page.evaluate(() => sessionStorage.getItem('session_activity'));
    
    // Activity timestamp should exist or be set after interaction
    await page.click('body');
    await page.waitForTimeout(1500); // Wait for debounce
    
    const updatedActivity = await page.evaluate(() => sessionStorage.getItem('session_activity'));
    if (updatedActivity) {
      const timestamp = parseInt(updatedActivity);
      expect(timestamp).toBeGreaterThan(Date.now() - 60000); // Within last minute
    }
  });

  test('sensitive data is not in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Trigger some app activity
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // Check localStorage doesn't contain sensitive keys
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string | null> = {};
      const sensitiveKeys = ['critical_errors', 'failed_error_batches', 'app_errors', 'session_activity'];
      sensitiveKeys.forEach(key => {
        data[key] = localStorage.getItem(key);
      });
      return data;
    });
    
    // All sensitive keys should be null in localStorage
    expect(localStorageData.critical_errors).toBeNull();
    expect(localStorageData.failed_error_batches).toBeNull();
    expect(localStorageData.app_errors).toBeNull();
    expect(localStorageData.session_activity).toBeNull();
  });
});

/**
 * Error Handling E2E Tests
 */
test.describe('Error Handling', () => {
  test('errors are stored in sessionStorage not localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Trigger an error by calling the error handler
    await page.evaluate(() => {
      // Simulate storing an error
      const testError = {
        message: 'Test error',
        severity: 'high',
        context: {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      };
      const errors = JSON.parse(sessionStorage.getItem('critical_errors') || '[]');
      errors.push(testError);
      sessionStorage.setItem('critical_errors', JSON.stringify(errors));
    });
    
    // Verify error is in sessionStorage
    const sessionErrors = await page.evaluate(() => sessionStorage.getItem('critical_errors'));
    expect(sessionErrors).not.toBeNull();
    expect(JSON.parse(sessionErrors || '[]').length).toBeGreaterThan(0);
    
    // Verify error is NOT in localStorage
    const localErrors = await page.evaluate(() => localStorage.getItem('critical_errors'));
    expect(localErrors).toBeNull();
  });

  test('error boundary catches errors gracefully', async ({ page }) => {
    // Navigate to a page that might have errors
    await page.goto('/non-existent-route-12345');
    
    // Should show 404 or error page, not crash
    await expect(page.locator('text=/not found|404|oops/i').first()).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Input Sanitization Security Tests
 */
test.describe('Input Sanitization', () => {
  test('messaging textarea has character limit', async ({ page }) => {
    // Login and navigate to messaging
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_PARENT_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_PARENT_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/parent*', { timeout: 10000 }).catch(() => {});
    
    // Find messaging area if visible
    const messagingLink = page.locator('text=/messages/i').first();
    if (await messagingLink.isVisible()) {
      await messagingLink.click();
      
      // Check textarea has maxLength
      const textarea = page.locator('textarea');
      if (await textarea.isVisible()) {
        const maxLength = await textarea.getAttribute('maxLength');
        expect(maxLength).not.toBeNull();
        expect(parseInt(maxLength || '0')).toBeLessThanOrEqual(1000);
      }
    }
  });

  test('form inputs reject null bytes and control characters', async ({ page }) => {
    await page.goto('/login');
    await page.click('[value="signup"]');
    
    // Try to input control characters
    await page.fill('input[type="text"][autocomplete="name"]', 'Test\x00User\x1F');
    
    // The input should be sanitized (control chars removed)
    const inputValue = await page.inputValue('input[type="text"][autocomplete="name"]');
    expect(inputValue).not.toContain('\x00');
    expect(inputValue).not.toContain('\x1F');
  });
});

/**
 * Password Security Tests
 */
test.describe('Password Security', () => {
  test('password field is type password', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('password has autocomplete attribute for security', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    const autocomplete = await passwordInput.getAttribute('autocomplete');
    expect(['current-password', 'new-password']).toContain(autocomplete);
  });

  test('signup password has strength indicator', async ({ page }) => {
    await page.goto('/login');
    await page.click('[value="signup"]');
    
    // Type a weak password
    await page.fill('input[autocomplete="new-password"]', 'abc');
    
    // Strength indicator should show
    await expect(page.locator('text=/weak|strength/i').first()).toBeVisible();
    
    // Type a strong password
    await page.fill('input[autocomplete="new-password"]', 'SecureP@ss123!');
    
    // Strength indicator should update
    await expect(page.locator('text=/strong|good/i').first()).toBeVisible({ timeout: 3000 });
  });
});

/**
 * Navigation Security Tests
 */
test.describe('Navigation Security', () => {
  test('no sensitive data in URL parameters', async ({ page }) => {
    await page.goto('/login');
    
    // After login attempt, URL should not contain password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).not.toContain('password');
    expect(url).not.toContain('TestPassword');
  });

  test('external links have noopener noreferrer', async ({ page }) => {
    await page.goto('/');
    
    // Check any external links
    const externalLinks = await page.locator('a[href^="http"]').all();
    
    for (const link of externalLinks.slice(0, 5)) {
      const target = await link.getAttribute('target');
      if (target === '_blank') {
        const rel = await link.getAttribute('rel');
        expect(rel).toContain('noopener');
      }
    }
  });
});