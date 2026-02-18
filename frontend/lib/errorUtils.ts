/**
 * Hilfsfunktionen für API-Fehlerbehandlung
 */

interface LaravelErrorShape {
  errors?: Record<string, string[] | string>;
  message?: string;
}

/**
 * Extrahiert die erste Fehlermeldung aus Laravel-API-Fehlern.
 * @param err - Gefangener Fehler (ApiError oder ähnlich)
 * @param fallback - Fallback-Text wenn keine Meldung extrahiert werden kann
 */
export function extractApiError(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;

  const obj = err as LaravelErrorShape;
  if (obj.errors) {
    const firstValue = Object.values(obj.errors)[0];
    if (Array.isArray(firstValue)) return firstValue[0] ?? fallback;
    if (typeof firstValue === "string") return firstValue;
  }

  if (typeof (err as { message?: string }).message === "string") {
    return (err as { message: string }).message;
  }

  return fallback;
}
