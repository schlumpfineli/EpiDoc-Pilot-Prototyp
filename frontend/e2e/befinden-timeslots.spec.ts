import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * E2E-Test für Befinden-Zeitslot-Funktionalität
 * Testet: Symptom-Karte expandieren → Zeitslot-Chips → Morgen wählen → Rating-Skala
 */
test.describe('Befinden - Zeitslot-Funktionalität', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/befinden');
    await page.waitForLoadState('networkidle');
  });

  test('Zeitslot-Panel: Chips erscheinen und Rating-Skala bei Morgen-Klick', async ({ page }) => {
    // 1) Seite geladen
    const heading = page.locator('h1').filter({ hasText: /Wie geht es dir/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // 2) Erste Symptom-Karte (Schlaf-Wach-Rhythmus) finden und klicken
    const firstSymptom = page.locator('button').filter({ hasText: /Schlaf-Wach-Rhythmus/i }).first();
    await expect(firstSymptom).toBeVisible({ timeout: 5000 });
    await firstSymptom.click();
    await page.waitForTimeout(400);

    // 3) Zeitslot-Panel sichtbar? ("Wann war das?")
    const whenLabel = page.locator('text=Wann war das?');
    await expect(whenLabel).toBeVisible({ timeout: 3000 });

    // 4) Zeitslot-Chips (Ganzen Tag, Morgen, Mittag, Abend)
    const ganzenTag = page.locator('button').filter({ hasText: /Ganzen Tag/i }).first();
    const morgen = page.locator('button').filter({ hasText: /^Morgen$/ }).first();
    const mittag = page.locator('button').filter({ hasText: /^Mittag$/ }).first();
    const abend = page.locator('button').filter({ hasText: /^Abend$/ }).first();

    await expect(ganzenTag).toBeVisible({ timeout: 2000 });
    await expect(morgen).toBeVisible({ timeout: 2000 });
    await expect(mittag).toBeVisible({ timeout: 2000 });
    await expect(abend).toBeVisible({ timeout: 2000 });

    // 5) Morgen-Chip klicken
    await morgen.click();
    await page.waitForTimeout(300);

    // 6) Rating-Skala erscheint (Buttons 1, 3, 5, 8, 10 oder Slider)
    const ratingButton = page.locator('button').filter({ hasText: /^5$/ }).first();
    const slider = page.locator('input[type="range"][min="1"][max="10"]');
    const hasRatingScale =
      (await ratingButton.isVisible({ timeout: 2000 })) ||
      (await slider.isVisible({ timeout: 2000 }));
    expect(hasRatingScale).toBe(true);
  });
});
