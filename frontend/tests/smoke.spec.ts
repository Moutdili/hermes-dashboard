import { test, expect } from '@playwright/test';

// Smoke tests — vérifient que les pages critiques chargent sans erreur

test.describe('Smoke — Pages critiques', () => {
  test('Dashboard home charge', async ({ page }) => {
    await page.goto('/');
    // Le titre Dashboard doit être visible
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Knowledge page charge', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('h1')).toContainText('Knowledge');
  });

  test('Chat page charge', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('h1')).toContainText('Chat');
  });

  test('Skills page charge', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('h1')).toContainText('Skills');
  });

  test('Cron page charge', async ({ page }) => {
    await page.goto('/cron');
    await expect(page.locator('h1')).toContainText('Cron');
  });

  test('Sessions page charge', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page.locator('h1')).toContainText('Sessions');
  });

  test('Graph page charge', async ({ page }) => {
    await page.goto('/graph');
    await expect(page.locator('h1')).toContainText('Graph');
  });

  test('Settings page charge', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
  });
});

test.describe('Smoke — Navigation', () => {
  test('Sidebar contient tous les liens', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Knowledge' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skills' })).toBeVisible();
  });

  test('Navigation Dashboard → Knowledge', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Knowledge' }).first().click();
    await expect(page).toHaveURL('/knowledge');
  });
});

test.describe('Smoke — Dark theme', () => {
  test('Background sombre appliqué', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    const bg = await body.evaluate((el) => getComputedStyle(el).backgroundColor);
    // bg-root = #060b14 → rgb(6, 11, 20)
    expect(bg).toContain('rgb(6');
  });
});