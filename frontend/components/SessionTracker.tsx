"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { sessionApi } from "@/lib/api";

const usageTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_USAGE_TRACKING === "true";

/**
 * Startet eine App-Session bei eingeloggtem User und sendet Session-Ende
 * beim Verlassen (Tab wechseln, App wegdücken, Fenster schließen) per keepalive-fetch.
 */
export function SessionTracker() {
  const { user } = useAuth();
  const sessionStartedAt = useRef<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const hasListeners = useRef(false);

  useEffect(() => {
    if (!usageTrackingEnabled) return;
    if (typeof window === "undefined" || !user) return;

    const startSession = async () => {
      try {
        const res = await sessionApi.start();
        sessionStartedAt.current = Date.now();
        sessionIdRef.current = res.session_id ?? null;
      } catch {
        sessionStartedAt.current = null;
        sessionIdRef.current = null;
      }
    };

    const sendEnd = () => {
      if (sessionStartedAt.current == null) return;
      const durationSeconds = Math.round((Date.now() - sessionStartedAt.current) / 1000);
      sessionApi.endWithKeepalive(durationSeconds, sessionIdRef.current ?? undefined);
      sessionStartedAt.current = null;
      sessionIdRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendEnd();
    };

    const handlePageHide = () => {
      sendEnd();
    };

    startSession();

    if (!hasListeners.current) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("pagehide", handlePageHide);
      hasListeners.current = true;
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      hasListeners.current = false;
    };
  }, [user?.id]);

  return null;
}
