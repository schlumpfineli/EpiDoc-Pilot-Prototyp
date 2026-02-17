"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Sicherheits-Timeout: Falls Auth-Check auf Mobile hängt, nach 8s zum Login weiterleiten
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (timedOut && isLoading) {
      router.push("/login");
      return;
    }
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/diary");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, timedOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-body text-foreground-600">Lädt...</div>
    </div>
  );
}
