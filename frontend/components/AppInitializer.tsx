"use client";

import { useEffect } from "react";
import { initTokenRefresh, setApiClient } from "@/lib/tokenRefresh";
import { apiClient } from "@/lib/api";

/**
 * Initialisiert App-weite Services (Token-Management)
 */
export function AppInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      setApiClient(apiClient);
      initTokenRefresh();
    } catch (error) {
      console.error('Fehler beim Initialisieren der App-Services:', error);
    }
  }, []);

  return null;
}
