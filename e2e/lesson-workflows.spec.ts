import { test, expect } from '@playwright/test';

test.describe('Lesson Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement child login helper
    await page.goto('/child-dashboard');
  });

  test('Child can browse and filter lessons', async ({ page }) => {
    await page.goto('/lessons');

    // Wait for lessons to load
    await page.waitForSelector('[data-testid=lesson-card]', { timeout: 10000 });

    // Filter by subject
    await page.click('button:has-text("Math")');

    // Should show filtered lessons
    const lessonCount = await page.locator('[data-testid=lesson-card]').count();
    expect(lessonCount).toBeGreaterThan(0);
  });

  test('Child can complete lesson quiz', async ({ page }) => {
    await page.goto('/lessons');

    // Click first lesson
    await page.click('[data-testid=lesson-card]');
    await page.click('button:has-text("Start Lesson")');

    // Wait for lesson content
    await page.waitForSelector('[data-testid=lesson-content]');

    // Scroll to quiz
    await page.click('button:has-text("Take Quiz")');

    // Answer quiz questions
    await page.click('[data-testid=quiz-answer-a]');
    await page.click('button:has-text("Next")');

    // Submit quiz
    await page.click('button:has-text("Submit")');

    // Should show results
    await expect(page.locator('[data-testid=quiz-results]')).toBeVisible({ timeout: 5000 });
  });

  test('Child can save lesson for later', async ({ page }) => {
    await page.goto('/lessons');

    // Save first lesson
    await page.click('[data-testid=lesson-card] >> button:has-text("Save")');

    // Should show success toast
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 3000 });

    // Navigate to saved lessons
    await page.goto('/child-dashboard');
    await page.click('button:has-text("Saved Lessons")');

    // Should see saved lesson
    await expect(page.locator('[data-testid=lesson-card]')).toBeVisible();
  });

  test('Child can request to share lesson', async ({ page }) => {
    await page.goto('/lessons');

    // Open share dialog
    await page.click('[data-testid=lesson-card] >> button:has-text("Share")');

    // Select peer to share with
    await page.click('[data-testid=peer-selector]');
    await page.click('[data-testid=peer-option]');

    // Submit share request
    await page.click('button:has-text("Request Share")');

    // Should show pending status
    await expect(page.locator('text=/pending approval/i')).toBeVisible({ timeout: 3000 });
  });

  test('Challenge mode increases difficulty', async ({ page }) => {
    await page.goto('/settings');

    // Enable challenge mode
    await page.click('[data-testid=challenge-mode-toggle]');

    // Navigate to lessons
    await page.goto('/lessons');

    // Should show challenge indicator
    await expect(page.locator('text=/challenge/i')).toBeVisible();
  });

  test('Child earns points after lesson completion', async ({ page }) => {
    // Note initial points
    await page.goto('/child-dashboard');
    const initialPoints = await page.locator('[data-testid=total-points]').textContent();

    // Complete a lesson
    await page.goto('/lessons');
    await page.click('[data-testid=lesson-card]');
    await page.click('button:has-text("Start Lesson")');
    await page.click('button:has-text("Complete")');

    // Return to dashboard
    await page.goto('/child-dashboard');
    const newPoints = await page.locator('[data-testid=total-points]').textContent();

    // Points should have increased
    expect(parseInt(newPoints || '0')).toBeGreaterThan(parseInt(initialPoints || '0'));
  });
});
