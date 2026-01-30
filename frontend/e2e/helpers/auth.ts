import { Page, expect } from '@playwright/test';

/**
 * Helper-Funktionen für Authentifizierung in E2E-Tests
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Standard Test-Credentials
 */
export const TEST_CREDENTIALS: LoginCredentials = {
  email: 'test@example.com',
  password: 'Password123',
};

/**
 * Führt einen Login durch
 */
export async function login(page: Page, credentials: LoginCredentials = TEST_CREDENTIALS): Promise<void> {
  // Navigiere zur Login-Seite
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  
  // Warte auf React Hook Form - warte auf Input-Felder
  await page.waitForSelector('input[type="email"]', { timeout: 30000, state: 'visible' });
  await page.waitForSelector('input[type="password"]', { timeout: 30000, state: 'visible' });
  
  // Zusätzliche Wartezeit für React Hook Form Initialisierung
  await page.waitForTimeout(2000);
  
  // Verwende direkte Selektoren - das ist am zuverlässigsten
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(credentials.email);
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(credentials.password);
  
  // Submit-Button
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Warte auf Weiterleitung oder Navbar
  await Promise.race([
    page.waitForURL(/.*(diary|befinden|verlauf|profil|kontakt)/, { timeout: 30000 }),
    page.waitForSelector('nav', { timeout: 30000 }),
  ]);
}

/**
 * Führt einen Logout durch
 */
export async function logout(page: Page): Promise<void> {
  // Suche nach Benutzer-Menü oder Logout-Button
  const userMenuButton = page.locator('button[aria-label*="Benutzer" i], button:has-text("Benutzer"), [data-testid="user-menu"]').first();
  
  if (await userMenuButton.isVisible({ timeout: 2000 })) {
    await userMenuButton.click();
    
    // Warte kurz, bis Menü geöffnet ist
    await page.waitForTimeout(500);
    
    // Klicke auf Logout
    const logoutButton = page.locator('button:has-text("Abmelden"), a:has-text("Abmelden"), [data-testid="logout"]').first();
    await logoutButton.click();
  } else {
    // Fallback: Direkt zu /login navigieren und Token löschen
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_data');
    });
  }
  
  // Warte, bis zur Login-Seite weitergeleitet wurde
  await page.waitForURL(/.*login/, { timeout: 5000 });
}

/**
 * Prüft, ob der Benutzer eingeloggt ist
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Prüfe, ob Navbar sichtbar ist (zeigt an, dass Benutzer eingeloggt ist)
  const navbar = page.locator('nav');
  return await navbar.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Registriert einen neuen Benutzer
 */
export async function register(page: Page, userData: {
  name?: string;
  email: string;
  password: string;
  role?: 'patient' | 'relative';
}): Promise<void> {
  await page.goto('/register');
  
  // Warte, bis die Seite geladen ist
  await expect(page.locator('h1, form')).toBeVisible();
  
  // Fülle Registrierungsformular aus (Pilot: kein Namensfeld)
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="E-Mail" i]').first();
  await emailInput.fill(userData.email);
  
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(userData.password);
  
  // Wähle Rolle (falls vorhanden)
  if (userData.role) {
    const roleInput = page.locator(`input[value="${userData.role}"], input[name="role"][value="${userData.role}"]`).first();
    if (await roleInput.isVisible({ timeout: 2000 })) {
      await roleInput.click();
    }
  }
  
  // Submit
  const submitButton = page.locator('button[type="submit"], button:has-text("Registrieren")').first();
  await submitButton.click();
  
  // Warte, bis Registrierung erfolgreich war
  await Promise.race([
    page.waitForURL(/.*(diary|befinden|verlauf|profil|kontakt)/, { timeout: 10000 }),
    page.waitForSelector('nav', { timeout: 10000 }),
  ]);
}
