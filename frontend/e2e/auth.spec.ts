import { test, expect } from '@playwright/test';
import { register, login, logout } from './helpers/auth';

/**
 * E2E-Tests für Authentifizierung
 * Testet: Registrierung, Login, Logout, Passwort-Reset
 */

test.describe('Authentifizierung', () => {
  test('Benutzer kann sich registrieren', async ({ page }) => {
    // Navigiere direkt zur Registrierungsseite
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    await page.waitForLoadState('networkidle');

    // Fülle Registrierungsformular aus (Pilot: kein Namensfeld, nur E-Mail/Passwort/Rolle)
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="E-Mail" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(`test-${Date.now()}@example.com`);
    await passwordInput.fill('Password123');
    
    // Wähle Rolle (Patient)
    const roleInput = page.locator('input[value="patient"], input[type="radio"][value="patient"]').first();
    if (await roleInput.isVisible()) {
      await roleInput.click();
    }

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Prüfe, ob erfolgreich registriert wurde
    // (Nach erfolgreicher Registrierung sollte der Benutzer eingeloggt sein)
    await page.waitForURL(/.*(befinden|diary|verlauf|einstellungen|kontakt)/, { timeout: 10000 });
    await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });
  });

  test('Benutzer kann sich einloggen', async ({ page }) => {
    // Verwende Login-Helper
    await login(page, 'test@example.com', 'Password123');

    // Prüfe, ob erfolgreich eingeloggt wurde
    await expect(page).toHaveURL(/.*(befinden|diary|verlauf|einstellungen|kontakt)/);
    
    // Prüfe, ob Navbar sichtbar ist (zeigt an, dass Benutzer eingeloggt ist)
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Benutzer kann sich ausloggen', async ({ page }) => {
    // Voraussetzung: Benutzer muss eingeloggt sein
    await login(page);
    
    // Verwende Logout-Helper
    await logout(page);

    // Prüfe, ob zur Login-Seite weitergeleitet wurde
    await expect(page).toHaveURL(/.*login/);
  });

  test('Benutzer kann Passwort zurücksetzen', async ({ page }) => {
    // Navigiere direkt zur "Passwort vergessen" Seite
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/.*forgot-password/);
    await page.waitForLoadState('networkidle');

    // Fülle E-Mail-Feld aus
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="E-Mail" i]').first();
    await emailInput.fill('test@example.com');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Warte auf Antwort (kann Reset-Link oder Erfolgsmeldung sein)
    await page.waitForTimeout(2000);
    
    // Prüfe, ob Reset-Link oder Erfolgsmeldung angezeigt wird (im Prototyp-Modus)
    const resetLink = page.locator('text=/Reset-Link|Token|reset_token|reset_url/i');
    const successMessage = page.locator('text=/erfolgreich|gesendet|versendet/i');
    
    // Eines von beiden sollte sichtbar sein
    const hasResetLink = await resetLink.isVisible({ timeout: 3000 }).catch(() => false);
    const hasSuccessMessage = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasResetLink || hasSuccessMessage).toBeTruthy();
  });

  test('Ungültige Login-Daten werden abgelehnt', async ({ page }) => {
    // Navigiere zur Login-Seite
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fülle Login-Formular mit ungültigen Daten aus
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="E-Mail" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPassword123');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Warte auf Antwort
    await page.waitForTimeout(2000);

    // Prüfe, ob Fehlermeldung angezeigt wird
    const errorMessage = page.locator('text=/Ungültig|Fehler|falsch|invalid|error/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    
    // Prüfe, ob Benutzer auf Login-Seite bleibt
    await expect(page).toHaveURL(/.*login/);
  });

  test('Passwort-Stärke-Validierung funktioniert', async ({ page }) => {
    // Navigiere zur Registrierungsseite
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Versuche mit schwachem Passwort zu registrieren (Pilot: kein Namensfeld)
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="E-Mail" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(`test-${Date.now()}@example.com`);
    await passwordInput.fill('weak'); // Zu schwach
    
    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Warte auf Validierung
    await page.waitForTimeout(1000);

    // Prüfe, ob Validierungsfehler angezeigt wird
    const validationError = page.locator('text=/mindestens 8 Zeichen|Großbuchstabe|Kleinbuchstabe|Zahl|8 Zeichen/i');
    await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    
    // Prüfe, ob Benutzer auf Registrierungsseite bleibt
    await expect(page).toHaveURL(/.*register/);
  });
});

