import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * E2E-Tests für Navigation
 * Testet: Navigation zwischen Seiten, geschützte Routen
 */

test.describe('Navigation', () => {
  test('Benutzer kann zwischen Seiten navigieren', async ({ page }) => {
    // Voraussetzung: Benutzer muss eingeloggt sein
    await login(page);

    // Navigiere zu Befinden
    const befindenLink = page.locator('nav a[href*="befinden"], a:has-text("Befinden")').first();
    await befindenLink.click();
    await expect(page).toHaveURL(/.*befinden/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Seite geladen ist (h1 oder Hauptinhalt)
    const befindenHeading = page.locator('h1, h2').filter({ hasText: /Befinden|Gesundheitszustand|Gesundheit/i }).first();
    await expect(befindenHeading).toBeVisible({ timeout: 5000 });

    // Navigiere zu Tagebuch
    const diaryLink = page.locator('nav a[href*="diary"], a:has-text("Tagebuch"), a:has-text("Anfall")').first();
    await diaryLink.click();
    await expect(page).toHaveURL(/.*diary/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const diaryHeading = page.locator('h1, h2').filter({ hasText: /Tagebuch|Anfall|Anfälle/i }).first();
    await expect(diaryHeading).toBeVisible({ timeout: 5000 });

    // Navigiere zu Verlauf
    const verlaufLink = page.locator('nav a[href*="verlauf"], a:has-text("Verlauf"), a:has-text("Analyse")').first();
    await verlaufLink.click();
    await expect(page).toHaveURL(/.*verlauf/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const verlaufHeading = page.locator('h1, h2').filter({ hasText: /Verlauf|Analyse/i }).first();
    await expect(verlaufHeading).toBeVisible({ timeout: 5000 });
  });

  test('Geschützte Routen leiten nicht-authentifizierte Benutzer um', async ({ page }) => {
    // Gehe direkt zu einer geschützten Route (ohne Login)
    await page.goto('/befinden');
    await page.waitForLoadState('networkidle');

    // Prüfe, ob zur Login-Seite weitergeleitet wurde
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Navbar ist auf geschützten Seiten sichtbar', async ({ page }) => {
    // Voraussetzung: Benutzer muss eingeloggt sein
    await login(page);
    await page.goto('/befinden');
    await page.waitForLoadState('networkidle');

    // Prüfe, ob Navbar sichtbar ist
    await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });
  });

  test('Navbar ist auf öffentlichen Seiten nicht sichtbar', async ({ page }) => {
    // Gehe zu Login-Seite
    await page.goto('/login');

    // Prüfe, ob Navbar nicht sichtbar ist
    await expect(page.locator('nav')).not.toBeVisible();
  });
});

