import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Landing page is accessible', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Child Dashboard is accessible', async ({ page }) => {
    await page.goto('/child-dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.third-party-widget') // Exclude third-party widgets
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Parent Dashboard is accessible', async ({ page }) => {
    await page.goto('/parent-dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(focusedElement);
    
    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should reach main content
    focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check if focus outline is visible
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(outline).toBeTruthy();
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });
});
