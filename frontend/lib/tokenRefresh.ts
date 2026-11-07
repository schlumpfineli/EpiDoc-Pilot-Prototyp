/**
 * Token-Management für EpiDoc
 * Die Sitzung bleibt gültig, bis der Benutzer sich abmeldet.
 */

let apiClientInstance: { setToken: (token: string | null) => void } | null = null;

export function setApiClient(client: { setToken: (token: string | null) => void }) {
  apiClientInstance = client;
}

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('auth_token', token);
  localStorage.removeItem('auth_token_data');

  if (apiClientInstance) {
    apiClientInstance.setToken(token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token_data');
  localStorage.removeItem('auth_token');
  if (apiClientInstance) {
    apiClientInstance.setToken(null);
  }
}

export function initTokenRefresh(): void {
  if (typeof window === 'undefined') return;

  const checkToken = () => {
    const token = getToken();
    if (!token && apiClientInstance) {
      apiClientInstance.setToken(null);
    }
  };

  checkToken();
}
