/**
 * API Client für Backend-Kommunikation
 * Verwendet fetch mit TypeScript-Typen
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Debug: Zeige API-URL (auch in Production für Debugging)
if (typeof window !== 'undefined') {
  console.log('API Base URL:', API_BASE_URL);
  console.log('NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Debug-Logging für API-Requests
    if (typeof window !== 'undefined') {
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        hasToken: !!this.token,
        headers: Object.keys(headers),
      });
    }

    // Timeout für API-Requests (10 Sekunden)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Debug-Logging für Response
      if (typeof window !== 'undefined') {
        console.log(`[API] Response ${response.status} for ${url}`, {
          ok: response.ok,
          statusText: response.statusText,
        });
      }

      if (!response.ok) {
        let error: ApiError;
        try {
          const errorData = await response.json();
          error = errorData;
          // Wenn Validierungsfehler vorhanden sind, formatieren wir sie
          if (error.errors) {
            const errorMessages = Object.entries(error.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            error.message = error.message ? `${error.message} - ${errorMessages}` : errorMessages;
          }
        } catch {
          error = {
            message: `HTTP ${response.status}: ${response.statusText || 'Ein Fehler ist aufgetreten'}`,
          };
        }
        
        // Debug-Logging für Fehler
        if (typeof window !== 'undefined') {
          console.error(`[API] Error for ${url}:`, error);
        }
        
        throw error;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      // Wenn Request abgebrochen wurde (Timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = {
          message: 'Request timeout: Die API-Antwort hat zu lange gedauert. Bitte prüfen Sie Ihre Internetverbindung und die API-Konfiguration.',
        };
        if (typeof window !== 'undefined') {
          console.error(`[API] Timeout for ${url}`);
        }
        throw timeoutError;
      }
      
      // Network-Fehler (CORS, Verbindung, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError: ApiError = {
          message: `Netzwerkfehler: Konnte nicht mit dem Server verbinden. Bitte prüfen Sie die API-URL (${this.baseUrl}) und CORS-Einstellungen.`,
        };
        if (typeof window !== 'undefined') {
          console.error(`[API] Network error for ${url}:`, error);
        }
        throw networkError;
      }
      
      // Andere Fehler weiterwerfen
      if (typeof window !== 'undefined') {
        console.error(`[API] Unknown error for ${url}:`, error);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// API Types
// Pilot: Kein Klartext-Name, Anzeige nur als User-ID (display_name)
export interface User {
  id: number;
  display_name: string;
  email: string;
  role: 'patient' | 'relative';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_url?: string;
}

export interface Befinden {
  id: number;
  user_id: number;
  date: string;
  category_id?: string | null; // Optional: 'core', 'optional', 'custom', or null
  symptom_id: string;
  time_of_day: 'morning' | 'noon' | 'evening';
  rating?: number | null; // Optional für Beobachtungen
  questions?: Record<string, unknown>;
  observation?: string | null; // Für Beobachtungen ohne Skala
  created_at: string;
  updated_at: string;
}

export interface Seizure {
  id: number;
  user_id: number;
  date: string;
  type?: string[];
  custom_type?: string;
  felt_before?: string;
  felt_symptoms?: string;
  seizure_count: number;
  duration_minutes?: number;
  duration_seconds?: number;
  after_effects?: string[];
  custom_after_effects?: string;
  triggers?: string[];
  custom_triggers?: string;
  emergency_med: boolean;
  emergency_med_name?: string;
  video_path?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  display_name: string;
  email: string;
  role: 'patient' | 'relative';
  disease?: string;
  doctors?: Array<{
    name: string;
    phone?: string;
    email?: string;
  }>;
  clinics?: Array<{
    name: string;
    phone?: string;
    address?: string;
  }>;
  pharmacies?: Array<{
    name: string;
    phone?: string;
    address?: string;
  }>;
  emergency_contact?: {
    name: string;
    phone?: string;
    relationship?: string;
  };
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportData {
  exported_at: string;
  app: 'EpiDoc';
  user?: User;
  profile?: UserProfile;
  befinden?: Befinden[];
  seizures?: Seizure[];
}

// API Functions
export const authApi = {
  register: async (data: {
    email: string;
    role: 'patient' | 'relative';
    password: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/register', data);
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/login', data);
  },

  getUser: async (): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>('/user');
  },

  // Passwort-Reset (Prototyp): Backend-Endpunkte müssen existieren, sonst kommt 404 zur Laufzeit.
  forgotPassword: async (data: { email: string }): Promise<ForgotPasswordResponse> => {
    return apiClient.post<ForgotPasswordResponse>('/forgot-password', data);
  },

  resetPassword: async (data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/reset-password', data);
  },
};

export const befindenApi = {
  getAll: async (params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    category_id?: string;
  }): Promise<{ data: Befinden[] }> => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get<{ data: Befinden[] }>(
      `/befinden${query ? `?${query}` : ''}`
    );
  },

  getOne: async (id: number): Promise<{ data: Befinden }> => {
    return apiClient.get<{ data: Befinden }>(`/befinden/${id}`);
  },

  create: async (data: Omit<Befinden, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ message: string; data: Befinden }> => {
    return apiClient.post<{ message: string; data: Befinden }>('/befinden', data);
  },

  update: async (id: number, data: Partial<Befinden>): Promise<{ message: string; data: Befinden }> => {
    return apiClient.put<{ message: string; data: Befinden }>(`/befinden/${id}`, data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/befinden/${id}`);
  },
};

export const seizureApi = {
  getAll: async (params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: Seizure[] }> => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiClient.get<{ data: Seizure[] }>(
      `/seizures${query ? `?${query}` : ''}`
    );
  },

  getOne: async (id: number): Promise<{ data: Seizure }> => {
    return apiClient.get<{ data: Seizure }>(`/seizures/${id}`);
  },

  create: async (data: Omit<Seizure, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ message: string; data: Seizure }> => {
    return apiClient.post<{ message: string; data: Seizure }>('/seizures', data);
  },

  update: async (id: number, data: Partial<Seizure>): Promise<{ message: string; data: Seizure }> => {
    return apiClient.put<{ message: string; data: Seizure }>(`/seizures/${id}`, data);
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/seizures/${id}`);
  },
};

export const profileApi = {
  update: async (data: Partial<UserProfile>): Promise<{ message: string; user: UserProfile }> => {
    return apiClient.put<{ message: string; user: UserProfile }>('/user/profile', data);
  },

  exportData: async (): Promise<ExportData> => {
    // Wichtig: Der Backend-Export-Endpunkt existiert aktuell nicht, daher bündeln wir die existierenden APIs im Client.
    // Falls einzelne Endpunkte fehlen/fehlschlagen, exportieren wir den Rest trotzdem.
    const exported_at = new Date().toISOString();

    const safe = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch {
        return undefined;
      }
    };

    const userResp = await safe(() => authApi.getUser());
    const profileResp = await safe(() => apiClient.get<{ user: UserProfile }>('/user/profile'));

    const befindenResp = await safe(() => befindenApi.getAll());
    const seizuresResp = await safe(() => seizureApi.getAll());

    return {
      exported_at,
      app: 'EpiDoc',
      user: userResp?.user,
      profile: profileResp?.user,
      befinden: befindenResp?.data ?? [],
      seizures: seizuresResp?.data ?? [],
    };
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>('/user/password', data);
  },

  // Push Subscriptions (Prototyp): Backend-Endpunkte müssen existieren, sonst kommt 404 zur Laufzeit.
  subscribePush: async (subscription: PushSubscription): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/push/subscribe', subscription);
  },

  unsubscribePush: async (endpoint: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/push/unsubscribe', { endpoint });
  },

  delete: async (): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>('/user');
  },
};

export interface FeedbackData {
  type: 'bug' | 'improvement' | 'other';
  message: string;
  page_url?: string;
}

export interface Feedback {
  id: number;
  user_id: number;
  type: 'bug' | 'improvement' | 'other';
  message: string;
  page_url?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export const feedbackApi = {
  sendFeedback: async (data: FeedbackData): Promise<{ message: string; data: Feedback }> => {
    return apiClient.post<{ message: string; data: Feedback }>('/feedback', {
      ...data,
      page_url: data.page_url || (typeof window !== 'undefined' ? window.location.href : undefined),
    });
  },
};

// Session & Analytics Tracking (Nutzungsstatistik für Admin)
export const sessionApi = {
  start: async (): Promise<{ message: string; session_id: number }> => {
    return apiClient.post<{ message: string; session_id: number }>('/session/start');
  },

  end: async (payload?: { session_id?: number; duration_seconds?: number }): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/session/end', payload ?? {});
  },

  /** Beim Schließen/Tab-Wechsel: sendet Session-Ende mit Dauer (fetch keepalive, damit Request beim Unload noch rausgeht). */
  endWithKeepalive: (durationSeconds: number, sessionId?: number) => {
    if (typeof window === 'undefined') return;
    const token = apiClient.getToken?.() ?? localStorage.getItem('auth_token');
    if (!token) return;
    const url = `${API_BASE_URL}/session/end`;
    const body = JSON.stringify(
      sessionId != null ? { duration_seconds: durationSeconds, session_id: sessionId } : { duration_seconds: durationSeconds }
    );
    fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {});
  },

  pageView: async (path: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/session/page-view', { path });
  },
};

