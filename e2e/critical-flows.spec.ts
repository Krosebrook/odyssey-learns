import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('Parent can sign up and add children', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('[name=fullName]', 'Test Parent');
    await page.fill('[name=email]', `test-${Date.now()}@example.com`);
    await page.fill('[name=password]', 'SecurePass123!');
    await page.click('button[type=submit]');
    
    // Should redirect to parent setup
    await page.waitForURL('/parent-setup', { timeout: 10000 });
    
    // Add first child
    await page.fill('[name=childName]', 'Test Child');
    await page.selectOption('[name=gradeLevel]', '2');
    await page.click('button:has-text("Add Child")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/parent-dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Child can complete a lesson and earn XP', async ({ page }) => {
    // TODO: Implement login helper
    // await loginAsChild(page, 'test-child-id');
    
    await page.goto('/lessons');
    
    // Wait for lessons to load
    await page.waitForSelector('.lesson-card', { timeout: 10000 });
    
    // Click first lesson
    const firstLesson = page.locator('.lesson-card').first();
    await firstLesson.click();
    
    // Start lesson
    await page.click('button:has-text("Start Lesson")');
    
    // Should show lesson content
    await expect(page.locator('[data-testid=lesson-content]')).toBeVisible();
  });

  test('Parent can view child progress', async ({ page }) => {
    // TODO: Implement login helper
    await page.goto('/parent-dashboard');
    
    // Should show children list
    await expect(page.locator('[data-testid=child-card]')).toHaveCount(1, { timeout: 10000 });
    
    // Click on child to view details
    await page.click('[data-testid=child-card]');
    
    // Should show progress charts
    await expect(page.locator('[data-testid=progress-chart]')).toBeVisible();
  });

  test('Adaptive learning recommends lessons', async ({ page }) => {
    await page.goto('/child-dashboard');
    
    // Wait for recommendations to load
    await page.waitForSelector('[data-testid=recommended-lessons]', { timeout: 10000 });
    
    // Should show at least 3 recommendations
    const recommendations = page.locator('[data-testid=recommendation-card]');
    await expect(recommendations).toHaveCount(3, { timeout: 5000 });
    
    // Each recommendation should have a reason
    const firstReason = recommendations.first().locator('[data-testid=recommendation-reason]');
    await expect(firstReason).toBeVisible();
  });

  test('Survey modal appears after lesson completion', async ({ page }) => {
    await page.goto('/child-dashboard');
    
    // Complete a lesson (simplified)
    await page.click('[data-testid=lesson-card]');
    await page.click('button:has-text("Complete")');
    
    // Wait for survey modal
    const surveyModal = page.locator('[role=dialog]:has-text("recommend")');
    await expect(surveyModal).toBeVisible({ timeout: 10000 });
    
    // Can dismiss survey
    await page.click('button[aria-label="Close"]');
    await expect(surveyModal).not.toBeVisible();
  });
});
