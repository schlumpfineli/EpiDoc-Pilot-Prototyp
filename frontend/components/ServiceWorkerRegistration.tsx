"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pushNotifications";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Registriere Service Worker beim Laden der App
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker().catch((error) => {
        console.error("Fehler bei Service Worker Registrierung:", error);
      });
    }
  }, []);

  return null;
}

