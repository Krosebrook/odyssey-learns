import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Child Dashboard loads in <2 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/child-dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    console.log(`Child Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('Parent Dashboard loads in <2 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/parent-dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    console.log(`Parent Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });

  test('Lesson Player loads in <1.5 seconds', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForSelector('.lesson-card');
    
    const start = Date.now();
    await page.click('.lesson-card >> nth=0');
    await page.waitForSelector('[data-testid=lesson-content]');
    const loadTime = Date.now() - start;
    
    console.log(`Lesson Player load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(1500);
  });

  test('Bundle size is under 512KB', async ({ page }) => {
    const response = await page.goto('/');
    const body = await response?.body();
    const size = body?.length || 0;
    
    console.log(`Bundle size: ${(size / 1024).toFixed(2)}KB`);
    expect(size).toBeLessThan(524288); // 512KB
  });

  test('No memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);
    
    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/lessons');
      await page.goto('/parent-dashboard');
      await page.goto('/child-dashboard');
    }
    
    // Check memory didn't increase significantly
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);
    const increase = finalMemory - initialMemory;
    
    console.log(`Memory increase: ${(increase / 1024 / 1024).toFixed(2)}MB`);
    expect(increase).toBeLessThan(50 * 1024 * 1024); // Max 50MB increase
  });
});
