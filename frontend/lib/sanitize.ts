/**
 * Utility-Funktionen zur Sanitization von Benutzereingaben im Frontend
 * Verhindert XSS-Angriffe durch Escaping von HTML/JavaScript
 */

/**
 * Escaped HTML-Sonderzeichen, um XSS zu verhindern.
 * React escaped standardmäßig alle Werte in JSX, aber diese Funktion kann
 * für explizite Sanitization verwendet werden.
 *
 * @param input - Der zu bereinigende String
 * @returns Bereinigter String mit escaped HTML-Zeichen
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // Erstelle ein temporäres Element, um Text zu escaped
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Entfernt alle HTML-Tags aus einem String.
 *
 * @param input - Der zu bereinigende String
 * @returns String ohne HTML-Tags
 */
export function stripHtmlTags(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  const div = document.createElement('div');
  div.innerHTML = input;
  return div.textContent || div.innerText || '';
}

/**
 * Bereinigt einen String, der in einem URL-Parameter verwendet werden soll.
 *
 * @param input - Der zu bereinigende String
 * @returns Bereinigter String für URL
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // Entferne alle Zeichen außer alphanumerisch, Bindestrich, Punkt, Schrägstrich, Underscore
  return input.replace(/[^a-zA-Z0-9\-._\/]/g, '');
}

/**
 * Bereinigt einen String für die Verwendung in einem HTML-Attribut.
 *
 * @param input - Der zu bereinigende String
 * @returns Bereinigter String für HTML-Attribut
 */
export function sanitizeForAttribute(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Normalisiert Whitespace in einem String.
 *
 * @param input - Der zu normalisierende String
 * @returns String mit normalisiertem Whitespace
 */
export function normalizeWhitespace(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return input
    .trim()
    .replace(/\s+/g, ' '); // Mehrere Leerzeichen zu einem
}

/**
 * Bereinigt einen String vollständig für die Anzeige.
 * Kombiniert mehrere Sanitization-Schritte.
 *
 * @param input - Der zu bereinigende String
 * @returns Vollständig bereinigter String
 */
export function sanitizeForDisplay(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // Entferne HTML-Tags
  let sanitized = stripHtmlTags(input);
  
  // Normalisiere Whitespace
  sanitized = normalizeWhitespace(sanitized);
  
  return sanitized;
}

/**
 * Validiert und bereinigt eine E-Mail-Adresse.
 *
 * @param input - Die zu validierende E-Mail-Adresse
 * @returns Bereinigte E-Mail-Adresse oder leerer String
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  // Trim und lowercase
  const trimmed = input.trim().toLowerCase();
  
  // Einfache Validierung
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

