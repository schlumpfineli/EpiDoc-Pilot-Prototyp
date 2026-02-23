/**
 * Token-Management für EpiDoc
 * Tokens sind 7 Tage gültig (Sanctum-Konfiguration).
 * Nach Ablauf muss sich der Benutzer neu anmelden.
 */

const TOKEN_EXPIRATION_HOURS = 168; // 7 Tage

interface TokenData {
  token: string;
  expiresAt: number;
}

let apiClientInstance: { setToken: (token: string | null) => void } | null = null;

export function setApiClient(client: { setToken: (token: string | null) => void }) {
  apiClientInstance = client;
}

/**
 * Speichert Token mit Ablaufzeit
 */
export function saveToken(token: string, expiresIn: number = 60 * 60 * TOKEN_EXPIRATION_HOURS): void {
  if (typeof window === 'undefined') return;

  const expiresAt = Date.now() + expiresIn * 1000;
  const tokenData: TokenData = { token, expiresAt };

  localStorage.setItem('auth_token_data', JSON.stringify(tokenData));
  localStorage.setItem('auth_token', token);

  if (apiClientInstance) {
    apiClientInstance.setToken(token);
  }
}

/**
 * Ruft gespeichertes Token ab.
 * Gibt null zurück wenn Token abgelaufen ist.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('auth_token_data');
  if (!stored) {
    return localStorage.getItem('auth_token');
  }

  try {
    const tokenData: TokenData = JSON.parse(stored);

    if (Date.now() > tokenData.expiresAt) {
      clearToken();
      return null;
    }

    return tokenData.token;
  } catch {
    return localStorage.getItem('auth_token');
  }
}

/**
 * Entfernt Token (bei Logout oder Ablauf)
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token_data');
  localStorage.removeItem('auth_token');
  if (apiClientInstance) {
    apiClientInstance.setToken(null);
  }
}

/**
 * Initialisiert Token-Management.
 * Prüft Token-Gültigkeit beim App-Start und bei Focus.
 */
export function initTokenRefresh(): void {
  if (typeof window === 'undefined') return;

  const checkToken = () => {
    const token = getToken();
    if (!token && apiClientInstance) {
      apiClientInstance.setToken(null);
    }
  };

  checkToken();

  window.addEventListener('focus', checkToken);
}
