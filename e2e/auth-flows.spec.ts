import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';

  test('Complete signup and login flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('/');
    await page.click('a[href="/login"]');
    await page.click('button:has-text("Sign Up")');

    // Fill signup form
    await page.fill('[name=fullName]', 'Test Parent');
    await page.fill('[name=email]', testEmail);
    await page.fill('[name=password]', testPassword);
    await page.fill('[name=confirmPassword]', testPassword);

    // Submit signup
    await page.click('button[type=submit]');

    // Should redirect to parent setup
    await page.waitForURL('/parent-setup', { timeout: 10000 });
    expect(page.url()).toContain('/parent-setup');
  });

  test('Login validation shows errors', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type=submit]');

    // Should show validation errors
    await expect(page.locator('text=/email/i')).toBeVisible();
    await expect(page.locator('text=/password/i')).toBeVisible();
  });

  test('Password reset flow', async ({ page }) => {
    await page.goto('/login');
    await page.click('a:has-text("Forgot password")');

    // Should navigate to reset password page
    await page.waitForURL('/reset-password');

    // Fill email
    await page.fill('[name=email]', 'test@example.com');
    await page.click('button[type=submit]');

    // Should show success message
    await expect(page.locator('text=/check your email/i')).toBeVisible({ timeout: 5000 });
  });

  test('Signup validates password strength', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Sign Up")');

    // Try weak password
    await page.fill('[name=fullName]', 'Test User');
    await page.fill('[name=email]', testEmail);
    await page.fill('[name=password]', '12345');

    // Should show password strength warning
    await expect(page.locator('text=/weak/i')).toBeVisible();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name=email]', 'invalid@example.com');
    await page.fill('[name=password]', 'wrongpassword');
    await page.click('button[type=submit]');

    // Should show error message
    await expect(page.locator('text=/invalid/i')).toBeVisible({ timeout: 5000 });
  });
});
