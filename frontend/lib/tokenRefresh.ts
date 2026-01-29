/**
 * Token-Refresh-Mechanismus für EpiDoc
 * Erneuert automatisch abgelaufene Tokens
 */

// Vermeide zirkulären Import - importiere authApi später dynamisch wenn nötig
let apiClientInstance: any = null;

export function setApiClient(client: any) {
  apiClientInstance = client;
}

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 Minuten vor Ablauf erneuern
const TOKEN_EXPIRATION_HOURS = 168; // 7 Tage = 168 Stunden

interface TokenData {
  token: string;
  expiresAt: number;
}

/**
 * Speichert Token mit Ablaufzeit
 */
export function saveToken(token: string, expiresIn: number = 60 * 60 * TOKEN_EXPIRATION_HOURS): void {
  if (typeof window === 'undefined') return;

  const expiresAt = Date.now() + expiresIn * 1000;
  const tokenData: TokenData = {
    token,
    expiresAt,
  };

  localStorage.setItem('auth_token_data', JSON.stringify(tokenData));
  localStorage.setItem('auth_token', token); // Für Kompatibilität mit apiClient
  
  // Setze Token im apiClient wenn vorhanden (verhindert zirkulären Import)
  if (apiClientInstance) {
    apiClientInstance.setToken(token);
  }
}

/**
 * Ruft gespeichertes Token ab (synchron)
 * Gibt null zurück, wenn Token abgelaufen ist (laut Client-Zeit)
 * Für automatische Erneuerung abgelaufener Tokens: refreshTokenIfNeeded() verwenden
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('auth_token_data');
  if (!stored) {
    // Fallback: Altes Token-Format
    return localStorage.getItem('auth_token');
  }

  try {
    const tokenData: TokenData = JSON.parse(stored);
    
    // Prüfe ob Token abgelaufen ist (laut Client-Zeit)
    // ABER: Lassen wir es zu, wenn es nicht zu lange her ist (max. 1 Stunde)
    // Das Backend wird die finale Entscheidung treffen
    const now = Date.now();
    const timeSinceExpiry = now - tokenData.expiresAt;
    const MAX_GRACE_PERIOD = 60 * 60 * TOKEN_EXPIRATION_HOURS * 1000; // 168 Stunden (7 Tage) Gnadenfrist
    
    if (timeSinceExpiry > MAX_GRACE_PERIOD) {
      // Token zu lange abgelaufen, entferne es
      localStorage.removeItem('auth_token_data');
      localStorage.removeItem('auth_token');
      return null;
    }

    // Token ist entweder noch gültig oder kurz abgelaufen (Gnadenfrist)
    // Das Backend wird die finale Validierung durchführen
    return tokenData.token;
  } catch {
    // Fallback: Altes Token-Format
    return localStorage.getItem('auth_token');
  }
}

/**
 * Prüft ob Token bald abläuft oder bereits abgelaufen ist und erneuert es bei Bedarf
 * Kann auch kurz abgelaufene Tokens erneuern (bis zu 1 Stunde nach Ablauf)
 * Das Backend entscheidet, ob das Token noch gültig ist
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem('auth_token_data');
  if (!stored) return false;

  try {
    const tokenData: TokenData = JSON.parse(stored);
    const now = Date.now();
    const timeUntilExpiry = tokenData.expiresAt - now;
    const MAX_GRACE_PERIOD = 60 * 60 * TOKEN_EXPIRATION_HOURS * 1000; // 168 Stunden (7 Tage) Gnadenfrist nach Ablauf

    // Wenn Token noch mehr als 5 Minuten gültig ist, nichts tun
    if (timeUntilExpiry > TOKEN_REFRESH_THRESHOLD) {
      return true;
    }

    // Token läuft bald ab oder ist bereits abgelaufen (aber noch in Gnadenfrist)
    if (timeUntilExpiry < -MAX_GRACE_PERIOD) {
      // Token zu lange abgelaufen, kann nicht erneuert werden
      localStorage.removeItem('auth_token_data');
      localStorage.removeItem('auth_token');
      if (apiClientInstance) {
        apiClientInstance.setToken(null);
      }
      return false;
    }

    // Versuche Token zu erneuern (auch wenn es laut Client-Zeit abgelaufen ist)
    // Das Backend entscheidet, ob das Token noch gültig ist
    try {
      if (!apiClientInstance) {
        return false;
      }
      
      // Verwende das gespeicherte Token
      const token = tokenData.token;
      if (!token) return false;
      
      // Verwende NEXT_PUBLIC_API_URL (verfügbar in Client-Komponenten)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // Versuche Token über Refresh-Endpoint zu erneuern
      // Dieser Endpoint akzeptiert auch abgelaufene Tokens (max. 1 Stunde nach Ablauf)
      // Timeout: 5 Sekunden
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${apiUrl}/token/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      
        if (!response.ok) {
          // Token-Refresh fehlgeschlagen (Token zu lange abgelaufen oder ungültig)
          localStorage.removeItem('auth_token_data');
          localStorage.removeItem('auth_token');
          if (apiClientInstance) {
            apiClientInstance.setToken(null);
          }
          return false;
        }
        
        // Token erfolgreich erneuert - hole das neue Token aus der Response
        const data = await response.json();
        const newToken = data.token;
        
        if (!newToken) {
          return false;
        }
        
        // Speichere das neue Token
        const expiresIn = 60 * 60 * TOKEN_EXPIRATION_HOURS; // 168 Stunden (7 Tage) ab jetzt
        saveToken(newToken, expiresIn);
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        // Timeout oder Netzwerkfehler - Token als ungültig behandeln
        if (error instanceof Error && error.name === 'AbortError') {
          // Timeout - API nicht erreichbar, Token als ungültig behandeln
          console.warn('Token-Refresh timeout: API nicht erreichbar');
        }
        localStorage.removeItem('auth_token_data');
        localStorage.removeItem('auth_token');
        if (apiClientInstance) {
          apiClientInstance.setToken(null);
        }
        return false;
      }
    } catch (error) {
      // Fehler beim Validieren - Token als ungültig behandeln
      localStorage.removeItem('auth_token_data');
      localStorage.removeItem('auth_token');
      if (apiClientInstance) {
        apiClientInstance.setToken(null);
      }
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Initialisiert automatischen Token-Refresh
 * Sollte beim App-Start aufgerufen werden
 */
export function initTokenRefresh(): void {
  if (typeof window === 'undefined') return;

  // Prüfe Token beim App-Start
  refreshTokenIfNeeded();

  // Prüfe Token periodisch (alle 5 Minuten)
  setInterval(() => {
    refreshTokenIfNeeded();
  }, 5 * 60 * 1000);

  // Prüfe Token wenn App wieder fokussiert wird
  window.addEventListener('focus', () => {
    refreshTokenIfNeeded();
  });
}

/**
 * Entfernt Token (bei Logout)
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token_data');
  localStorage.removeItem('auth_token');
  if (apiClientInstance) {
    apiClientInstance.setToken(null);
  }
}

