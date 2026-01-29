"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Globaler Toast-Store (einfache Lösung ohne Context für Prototyp)
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastStore: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toastStore]));
};

export const toastService = {
  show: (message: string, type: ToastType = "info", duration: number = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };
    toastStore.push(toast);
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toastService.remove(id);
      }, duration);
    }
  },
  remove: (id: string) => {
    toastStore = toastStore.filter((t) => t.id !== id);
    notifyListeners();
  },
  subscribe: (listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 shadow-lg ${getToastStyles(toast.type)} animate-in slide-in-from-right`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => toastService.remove(toast.id)}
              className="text-current opacity-70 hover:opacity-100"
              aria-label="Schließen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

