import { test, expect } from '@playwright/test';

test.describe('Parent Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement test user login helper
    // await loginAsParent(page);
    await page.goto('/parent-dashboard');
  });

  test('Parent can add multiple children', async ({ page }) => {
    await page.goto('/parent-setup');

    // Add first child
    await page.fill('[name=childName]', 'Alice');
    await page.selectOption('[name=gradeLevel]', '2');
    await page.click('button:has-text("Add Child")');

    // Add second child
    await page.fill('[name=childName]', 'Bob');
    await page.selectOption('[name=gradeLevel]', '5');
    await page.click('button:has-text("Add Child")');

    // Should show both children
    await expect(page.locator('text=Alice')).toBeVisible();
    await expect(page.locator('text=Bob')).toBeVisible();
  });

  test('Parent can view weekly report', async ({ page }) => {
    await page.goto('/parent-dashboard');

    // Click on weekly report
    await page.click('button:has-text("Weekly Report")');

    // Should show report content
    await expect(page.locator('[data-testid=weekly-report]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/lessons completed/i')).toBeVisible();
  });

  test('Parent can set screen time limits', async ({ page }) => {
    await page.goto('/settings');

    // Navigate to screen time settings
    await page.click('button:has-text("Screen Time")');

    // Set daily limit
    await page.fill('[name=dailyLimit]', '60');
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 3000 });
  });

  test('Parent can create custom rewards', async ({ page }) => {
    await page.goto('/rewards');

    // Click create reward button
    await page.click('button:has-text("Create Reward")');

    // Fill reward form
    await page.fill('[name=rewardName]', 'Extra 30 minutes screen time');
    await page.fill('[name=pointsCost]', '100');
    await page.click('button[type=submit]');

    // Should show new reward
    await expect(page.locator('text=Extra 30 minutes screen time')).toBeVisible({ timeout: 5000 });
  });

  test('Parent can approve child lesson share request', async ({ page }) => {
    // Navigate to pending approvals
    await page.goto('/parent-dashboard');
    await page.click('button:has-text("Pending Approvals")');

    // Should show pending requests
    const pendingCount = await page.locator('[data-testid=pending-approval]').count();
    
    if (pendingCount > 0) {
      // Approve first request
      await page.click('[data-testid=approve-button]');

      // Should show success message
      await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('Parent can send message to child', async ({ page }) => {
    await page.goto('/parent-dashboard');

    // Open messaging
    await page.click('button:has-text("Send Message")');

    // Write message
    await page.fill('[name=message]', 'Great job on your lessons today!');
    await page.click('button:has-text("Send")');

    // Should show sent confirmation
    await expect(page.locator('text=/sent/i')).toBeVisible({ timeout: 3000 });
  });
});
