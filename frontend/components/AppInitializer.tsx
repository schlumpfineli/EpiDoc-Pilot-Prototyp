"use client";

import { useEffect } from "react";
import { initTokenRefresh, setApiClient } from "@/lib/tokenRefresh";
import { initOfflineSync } from "@/lib/offlineSync";
import { apiClient } from "@/lib/api";

/**
 * Initialisiert App-weite Services
 * - Token-Refresh
 * - Offline-Synchronisation
 */
export function AppInitializer() {
  useEffect(() => {
    // Nur im Browser ausführen (nicht beim SSR)
    if (typeof window === 'undefined') return;

    try {
      // Setze apiClient in tokenRefresh um zirkulären Import zu vermeiden
      setApiClient(apiClient);
      
      // Initialisiere Token-Refresh
      initTokenRefresh();

      // Initialisiere Offline-Synchronisation
      initOfflineSync(apiClient);
    } catch (error) {
      // Fehler beim Initialisieren - logge aber stoppe nicht die App
      console.error('Fehler beim Initialisieren der App-Services:', error);
    }
  }, []);

  return null;
}

