"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Wenn eingeloggt, weiterleiten zur Anfallsdokumentation
        router.push("/diary");
      } else {
        // Wenn nicht eingeloggt, weiterleiten zum Login
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Zeige Loading-State während der Prüfung
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-body text-foreground-600">Lädt...</div>
    </div>
  );
}
