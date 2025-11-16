import { Page } from '@playwright/test';

export async function loginAsParent(page: Page, email?: string, password?: string) {
  const testEmail = email || `test-parent-${Date.now()}@example.com`;
  const testPassword = password || 'TestPass123!';

  await page.goto('/login');
  await page.fill('[name=email]', testEmail);
  await page.fill('[name=password]', testPassword);
  await page.click('button[type=submit]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(parent-dashboard|parent-setup)/, { timeout: 10000 });
  
  return { email: testEmail, password: testPassword };
}

export async function signupParent(page: Page) {
  const testEmail = `test-parent-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  await page.goto('/login');
  await page.click('button:has-text("Sign Up")');
  
  await page.fill('[name=fullName]', 'Test Parent');
  await page.fill('[name=email]', testEmail);
  await page.fill('[name=password]', testPassword);
  await page.fill('[name=confirmPassword]', testPassword);
  
  await page.click('button[type=submit]');
  await page.waitForURL('/parent-setup', { timeout: 10000 });
  
  return { email: testEmail, password: testPassword };
}

export async function selectChild(page: Page, childName: string) {
  await page.goto('/parent-dashboard');
  await page.click(`text=${childName}`);
  await page.waitForURL('/child-dashboard', { timeout: 5000 });
}

export async function createTestChild(page: Page, name: string, gradeLevel: string) {
  await page.goto('/parent-setup');
  await page.fill('[name=childName]', name);
  await page.selectOption('[name=gradeLevel]', gradeLevel);
  await page.click('button:has-text("Add Child")');
  
  // Wait for child to be created
  await page.waitForSelector(`text=${name}`, { timeout: 5000 });
}
