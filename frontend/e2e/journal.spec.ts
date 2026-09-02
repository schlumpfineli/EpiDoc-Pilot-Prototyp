import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Gedankentagebuch', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/diary/gedanken');
    await page.waitForLoadState('networkidle');
  });

  test('Benutzer kann einen freien Tagebucheintrag speichern', async ({ page }) => {
    const heading = page.locator('h1').filter({ hasText: /Gedankentagebuch/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const draft = page.locator('[data-testid="journal-draft"]');
    await expect(draft).toBeVisible();
    await draft.fill('Heute habe ich mich ruhiger gefühlt.');

    await page.locator('[data-testid="journal-save"]').click();

    await expect(page.getByText(/erfolgreich|gespeichert/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="journal-entry"]').first()).toContainText('Heute habe ich mich ruhiger gefühlt.');
  });
});
