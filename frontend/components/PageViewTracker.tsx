"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { sessionApi } from "@/lib/api";

const usageTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_USAGE_TRACKING === "true";

/**
 * Sendet bei jedem Seitenwechsel (wenn eingeloggt) einen Seitenaufruf an die API für Admin-Statistik.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!usageTrackingEnabled) return;
    if (typeof window === "undefined" || !user || !pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    sessionApi.pageView(pathname).catch(() => {});
  }, [pathname, user?.id]);

  return null;
}
