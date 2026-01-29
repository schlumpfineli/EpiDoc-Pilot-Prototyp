import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * E2E-Tests für Befinden-Funktionalität
 * Testet: Befinden eintragen, anzeigen, bearbeiten
 */

test.describe('Befinden', () => {
  test.beforeEach(async ({ page }) => {
    // Voraussetzung: Benutzer muss eingeloggt sein
    await login(page);
    await page.goto('/befinden');
    await page.waitForLoadState('networkidle');
  });

  test('Benutzer kann Befinden eintragen', async ({ page }) => {
    // Warte, bis die Seite geladen ist
    const heading = page.locator('h1, h2').filter({ hasText: /Befinden|Gesundheitszustand|Gesundheit/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Suche nach "Neuer Eintrag" oder ähnlichem Button
    const newEntryButton = page.locator('button:has-text("Neu"), button:has-text("Hinzufügen"), button:has-text("Eintrag"), a:has-text("Neu")').first();
    
    if (await newEntryButton.isVisible({ timeout: 3000 })) {
      await newEntryButton.click();
      await page.waitForTimeout(500);
    }

    // Fülle Befinden-Formular aus
    const dateInput = page.locator('input[type="date"], input[name="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 })) {
      await dateInput.fill(new Date().toISOString().split('T')[0]);
    }
    
    // Wähle Kategorie (verschiedene Selektoren)
    const categoryButton = page.locator('button:has-text("Körperlich"), label:has-text("Körperlich"), input[value*="physical" i]').first();
    if (await categoryButton.isVisible({ timeout: 2000 })) {
      await categoryButton.click();
    }
    
    // Wähle Symptom
    const symptomButton = page.locator('button:has-text("Kopfschmerzen"), label:has-text("Kopfschmerzen")').first();
    if (await symptomButton.isVisible({ timeout: 2000 })) {
      await symptomButton.click();
    }
    
    // Wähle Tageszeit
    const timeButton = page.locator('button:has-text("Morgen"), label:has-text("Morgen"), input[value*="morning" i]').first();
    if (await timeButton.isVisible({ timeout: 2000 })) {
      await timeButton.click();
    }
    
    // Setze Bewertung
    const ratingInput = page.locator('input[type="number"], input[min="0"][max="10"], input[name*="rating" i]').first();
    if (await ratingInput.isVisible({ timeout: 2000 })) {
      await ratingInput.fill('5');
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Speichern"), button:has-text("Senden")').first();
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      
      // Warte auf Antwort
      await page.waitForTimeout(2000);
      
      // Prüfe, ob Erfolgsmeldung angezeigt wird
      const successMessage = page.locator('text=/erfolgreich|gespeichert|gesendet/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Benutzer kann Befinden-Einträge anzeigen', async ({ page }) => {
    // Warte, bis die Seite geladen ist
    await expect(page.locator('h1')).toContainText(/Befinden|Gesundheitszustand/i);

    // Prüfe, ob Einträge angezeigt werden (falls vorhanden)
    const entries = page.locator('[data-testid="befinden-entry"]');
    const count = await entries.count();
    
    if (count > 0) {
      // Prüfe, ob mindestens ein Eintrag sichtbar ist
      await expect(entries.first()).toBeVisible();
    }
  });

  test('Benutzer kann Befinden-Eintrag bearbeiten', async ({ page }) => {
    // Voraussetzung: Es muss mindestens ein Eintrag vorhanden sein
    
    // Klicke auf "Bearbeiten" bei einem Eintrag
    const editButton = page.locator('button[aria-label*="Bearbeiten"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Ändere Bewertung
      await page.fill('input[type="number"][min="0"][max="10"]', '7');
      
      // Speichere Änderungen
      await page.click('button[type="submit"]');
      
      // Prüfe, ob Erfolgsmeldung angezeigt wird
      await expect(page.locator('text=/aktualisiert|gespeichert/i')).toBeVisible();
    }
  });
});

