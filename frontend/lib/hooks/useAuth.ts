"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, authApi, type User } from "@/lib/api";
import { getToken, clearToken, refreshTokenIfNeeded } from "@/lib/tokenRefresh";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      // Prüfe zuerst, ob Token erneuert werden muss (auch abgelaufene Tokens in Gnadenfrist)
      // Timeout: Wenn refreshTokenIfNeeded länger als 5 Sekunden dauert, überspringen
      await Promise.race([
        refreshTokenIfNeeded(),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      
      // Hole Token (synchron, nach möglicher Erneuerung)
      const token = getToken();
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      apiClient.setToken(token);
      
      // API-Call mit Timeout (wird bereits von apiClient gehandhabt, aber hier als Fallback)
      const response = await Promise.race([
        authApi.getUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        ),
      ]);
      
      setUser(response.user);
    } catch (error) {
      // Token ungültig, abgelaufen oder API nicht erreichbar
      console.warn('Auth check failed:', error);
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Höre auf Storage-Events (wenn Token in anderem Tab geändert wird)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token" || e.key === "auth_token_data") {
        checkAuth();
      }
    };

    // Höre auf Custom Events (wenn Token in derselben App geändert wird)
    const handleAuthChange = () => {
      checkAuth();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("auth-changed", handleAuthChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("auth-changed", handleAuthChange);
      }
    };
  }, []);

  const logout = async () => {
    clearToken();
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      // Event dispatchen, damit andere Komponenten den Auth-Status aktualisieren
      window.dispatchEvent(new Event("auth-changed"));
    }
    router.push("/login");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    checkAuth,
    logout,
  };
}
