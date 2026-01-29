"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays, subMonths, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { seizureApi, befindenApi, Befinden, Seizure } from "@/lib/api";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

// Verfügbare Signale aus der Befinden-Seite
const availableSignals = [
  { id: "sleep-rhythm", label: "Schlaf-Wach-Rhythmus" },
  { id: "fatigue", label: "Müdigkeit / Erschöpfung" },
  { id: "concentration", label: "Konzentration" },
  { id: "restlessness", label: "Innere Unruhe" },
  { id: "sensitivity", label: "Reizempfindlichkeit (Licht / Geräusche)" },
  { id: "stress", label: "Stress" },
  { id: "irritability", label: "Reizbarkeit" },
  { id: "medication-adherence", label: "Medikamente weggelassen?" },
  { id: "pain", label: "Schmerzen" },
  { id: "depression", label: "Depressive Belastung" },
  { id: "anxiety", label: "Angst" },
  { id: "headache", label: "Kopfschmerz" },
  { id: "menstrual", label: "Zyklusbezogene Beschwerden" },
];

type TimeRange = "7d" | "30d" | "6m" | "1y";

export default function VerlaufPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedSignal, setSelectedSignal] = useState<string>("");
  const [seizures, setSeizures] = useState<Seizure[]>([]);
  const [befindenData, setBefindenData] = useState<Befinden[]>([]);
  const [loading, setLoading] = useState(true);
  const breakpoint = useBreakpoint();

  // Setze Zeitraum zurück, wenn auf Mobile ein nicht verfügbarer Zeitraum ausgewählt ist
  useEffect(() => {
    if (breakpoint === "mobile" && (timeRange === "6m" || timeRange === "1y")) {
      setTimeRange("30d");
    }
  }, [breakpoint, timeRange]);

  // Lade Daten
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [seizuresResponse, befindenResponse] = await Promise.all([
          seizureApi.getAll(),
          befindenApi.getAll({}),
        ]);
        setSeizures(seizuresResponse.data || []);
        setBefindenData(befindenResponse.data || []);
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Berechne Zeitbereich
  const timeRangeData = useMemo(() => {
    const end = new Date();
    let start: Date;
    switch (timeRange) {
      case "7d":
        start = subDays(end, 6);
        break;
      case "30d":
        start = subDays(end, 29);
        break;
      case "6m":
        start = subMonths(end, 6);
        break;
      case "1y":
        start = subMonths(end, 12);
        break;
    }

    const days = eachDayOfInterval({ start, end });
    return { start, end, days };
  }, [timeRange]);

  // Filtere Anfälle im Zeitbereich
  const seizuresInRange = useMemo(() => {
    return seizures.filter((seizure) => {
      const seizureDate = parseISO(seizure.date);
      return seizureDate >= timeRangeData.start && seizureDate <= timeRangeData.end;
    });
  }, [seizures, timeRangeData]);

  // Finde verfügbare Signale mit Daten im aktuellen Zeitbereich
  const availableSignalsInRange = useMemo(() => {
    const signalsWithData = new Set<string>();
    
    befindenData.forEach((item) => {
      const itemDate = parseISO(item.date);
      if (
        itemDate >= timeRangeData.start &&
        itemDate <= timeRangeData.end
      ) {
        signalsWithData.add(item.symptom_id);
      }
    });

    return availableSignals.filter((signal) =>
      signalsWithData.has(signal.id)
    );
  }, [befindenData, timeRangeData]);

  // Setze ausgewähltes Signal zurück, wenn es nicht mehr verfügbar ist
  useEffect(() => {
    if (selectedSignal && !availableSignalsInRange.some((s) => s.id === selectedSignal)) {
      setSelectedSignal("");
    }
  }, [availableSignalsInRange, selectedSignal]);

  // Filtere Befinden-Daten im Zeitbereich und für ausgewähltes Signal
  const signalDataInRange = useMemo(() => {
    if (!selectedSignal) return [];

    return befindenData
      .filter((item) => {
        const itemDate = parseISO(item.date);
        return (
          itemDate >= timeRangeData.start &&
          itemDate <= timeRangeData.end &&
          item.symptom_id === selectedSignal
        );
      })
      .map((item) => ({
        date: item.date,
        rating: item.rating ?? null,
        timeOfDay: item.time_of_day,
      }));
  }, [befindenData, selectedSignal, timeRangeData]);

  // Berechne durchschnittliche Werte pro Tag für das Signal
  const signalByDay = useMemo(() => {
    const dayMap: Record<string, number[]> = {};
    
    signalDataInRange.forEach((item) => {
      const dateStr = format(parseISO(item.date), "yyyy-MM-dd");
      if (item.rating !== null && item.rating !== undefined) {
        if (!dayMap[dateStr]) {
          dayMap[dateStr] = [];
        }
        dayMap[dateStr].push(item.rating);
      }
    });

    const result: Record<string, number> = {};
    Object.entries(dayMap).forEach(([date, ratings]) => {
      result[date] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });

    return result;
  }, [signalDataInRange]);

  // Strukturierte Insight-Daten
  type InsightType = "before" | "on" | "after" | "none";
  
  interface StructuredInsight {
    type: InsightType;
    text: string;
    strength: "weak" | "moderate" | "strong";
    dataPoints: number;
    avgValue: number;
    avgOverall: number;
  }

  // Verbesserte Insights-Logik: Analysiere Tage vor/nach Anfällen
  const insights = useMemo(() => {
    if (seizuresInRange.length === 0 || !selectedSignal) {
      return [];
    }

    const insightsList: StructuredInsight[] = [];
    const signalLabel = availableSignals.find((s) => s.id === selectedSignal)?.label || selectedSignal;
    const seizureDates = seizuresInRange.map((s) => parseISO(s.date));
    const daysWithSignal = Object.keys(signalByDay).map((d) => parseISO(d));

    if (daysWithSignal.length === 0) {
      return [];
    }

    // Analysiere Tage vor Anfällen (2-4 Tage vorher)
    const daysBeforeSeizure: number[] = [];
    seizureDates.forEach((seizureDate) => {
      for (let daysBack = 2; daysBack <= 4; daysBack++) {
        const checkDate = subDays(seizureDate, daysBack);
        const checkDateStr = format(checkDate, "yyyy-MM-dd");
        if (signalByDay[checkDateStr] !== undefined) {
          daysBeforeSeizure.push(signalByDay[checkDateStr]);
        }
      }
    });

    // Analysiere Tage mit Anfällen
    const daysWithSeizure: number[] = [];
    seizureDates.forEach((seizureDate) => {
      const seizureDateStr = format(seizureDate, "yyyy-MM-dd");
      if (signalByDay[seizureDateStr] !== undefined) {
        daysWithSeizure.push(signalByDay[seizureDateStr]);
      }
    });

    // Analysiere Tage nach Anfällen (1-3 Tage danach)
    const daysAfterSeizure: number[] = [];
    seizureDates.forEach((seizureDate) => {
      for (let daysForward = 1; daysForward <= 3; daysForward++) {
        const checkDate = subDays(seizureDate, -daysForward);
        const checkDateStr = format(checkDate, "yyyy-MM-dd");
        if (signalByDay[checkDateStr] !== undefined) {
          daysAfterSeizure.push(signalByDay[checkDateStr]);
        }
      }
    });

    // Berechne Durchschnitte
    const allSignalValues = Object.values(signalByDay);
    const avgSignalOverall =
      allSignalValues.length > 0
        ? allSignalValues.reduce((sum, v) => sum + v, 0) / allSignalValues.length
        : null;

    const avgBeforeSeizure =
      daysBeforeSeizure.length > 0
        ? daysBeforeSeizure.reduce((sum, v) => sum + v, 0) / daysBeforeSeizure.length
        : null;

    const avgOnSeizureDay =
      daysWithSeizure.length > 0
        ? daysWithSeizure.reduce((sum, v) => sum + v, 0) / daysWithSeizure.length
        : null;

    const avgAfterSeizure =
      daysAfterSeizure.length > 0
        ? daysAfterSeizure.reduce((sum, v) => sum + v, 0) / daysAfterSeizure.length
        : null;

    // Generiere strukturierte Insights basierend auf Mustern
    if (avgSignalOverall !== null) {
      // Muster: Erhöhtes Signal vor Anfällen
      if (avgBeforeSeizure !== null && daysBeforeSeizure.length > 0) {
        const diff = avgBeforeSeizure - avgSignalOverall;
        if (diff > 1.5) {
          const strength = diff > 2.5 ? "strong" : diff > 2 ? "moderate" : "weak";
          insightsList.push({
            type: "before",
            text: `${signalLabel} scheint 2-4 Tage vor Anfällen häufiger erhöht zu sein.`,
            strength,
            dataPoints: daysBeforeSeizure.length,
            avgValue: avgBeforeSeizure,
            avgOverall: avgSignalOverall,
          });
        } else if (diff < -1.5) {
          const strength = Math.abs(diff) > 2.5 ? "strong" : Math.abs(diff) > 2 ? "moderate" : "weak";
          insightsList.push({
            type: "before",
            text: `${signalLabel} scheint 2-4 Tage vor Anfällen häufiger niedriger zu sein.`,
            strength,
            dataPoints: daysBeforeSeizure.length,
            avgValue: avgBeforeSeizure,
            avgOverall: avgSignalOverall,
          });
        }
      }

      // Muster: Signal an Tagen mit Anfällen
      if (avgOnSeizureDay !== null && daysWithSeizure.length > 0) {
        const diff = avgOnSeizureDay - avgSignalOverall;
        if (Math.abs(diff) > 1.5) {
          const strength = Math.abs(diff) > 2.5 ? "strong" : Math.abs(diff) > 2 ? "moderate" : "weak";
          insightsList.push({
            type: "on",
            text: `An Tagen mit Anfällen war ${signalLabel.toLowerCase()} ${diff > 0 ? "tendenziell erhöht" : "tendenziell niedriger"}.`,
            strength,
            dataPoints: daysWithSeizure.length,
            avgValue: avgOnSeizureDay,
            avgOverall: avgSignalOverall,
          });
        }
      }

      // Muster: Signal nach Anfällen
      if (avgAfterSeizure !== null && daysAfterSeizure.length > 0) {
        const diff = avgAfterSeizure - avgSignalOverall;
        if (diff > 1.5) {
          const strength = diff > 2.5 ? "strong" : diff > 2 ? "moderate" : "weak";
          insightsList.push({
            type: "after",
            text: `${signalLabel} scheint 1-3 Tage nach Anfällen häufiger erhöht zu sein.`,
            strength,
            dataPoints: daysAfterSeizure.length,
            avgValue: avgAfterSeizure,
            avgOverall: avgSignalOverall,
          });
        }
      }

      // Fallback: Kein klares Muster
      if (insightsList.length === 0) {
        insightsList.push({
          type: "none",
          text: "Kein klares Muster erkennbar.",
          strength: "weak",
          dataPoints: 0,
          avgValue: 0,
          avgOverall: avgSignalOverall,
        });
      }
    }

    return insightsList;
  }, [seizuresInRange, selectedSignal, signalByDay]);

  // Berechne Min/Max für Signal-Normalisierung
  const signalMinMax = useMemo(() => {
    const values = Object.values(signalByDay);
    if (values.length === 0) return { min: 0, max: 10 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [signalByDay]);

  // Berechne Visualisierungsdaten
  const visualizationData = useMemo(() => {
    return timeRangeData.days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const hasSeizure = seizuresInRange.some((s) =>
        isSameDay(parseISO(s.date), day)
      );
      const signalValue = signalByDay[dayStr];

      return {
        date: day,
        dateStr: dayStr,
        hasSeizure,
        signalValue,
      };
    });
  }, [timeRangeData.days, seizuresInRange, signalByDay]);

  // Berechne Signal-Punkte für die Linie (nur Tage mit Daten)
  const signalPoints = useMemo(() => {
    return visualizationData
      .map((d, i) => {
        if (d.signalValue === undefined) return null;
        const x = (i / Math.max(visualizationData.length - 1, 1)) * 1000;
        const normalizedValue =
          signalMinMax.max > signalMinMax.min
            ? ((d.signalValue - signalMinMax.min) /
                (signalMinMax.max - signalMinMax.min)) *
                160 +
              20
            : 100;
        return { x, y: 200 - normalizedValue };
      })
      .filter((p) => p !== null) as Array<{ x: number; y: number }>;
  }, [visualizationData, signalMinMax]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background-50 flex items-center justify-center">
          <p className="text-body text-foreground-600">Lädt...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isDesktop = breakpoint === "desktop";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-50 pb-20">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-h3 font-semibold text-foreground-900">
            Analyse
          </h1>
          <p className="mb-6 text-body-small text-foreground-500">
            Mögliche Zusammenhänge zwischen Anfällen und deinem Befinden erkennen
          </p>

          {/* Zeitbereich-Auswahl */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "7d" as TimeRange, label: "7 Tage" },
                { id: "30d" as TimeRange, label: "30 Tage" },
                // 6 Monate und 1 Jahr nur ab Tablet-Größe
                ...(isMobile ? [] : [
                  { id: "6m" as TimeRange, label: "6 Monate" },
                  { id: "1y" as TimeRange, label: "1 Jahr" },
                ]),
              ].map((range) => {
                const isActive = timeRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTimeRange(range.id)}
                    className={`rounded-lg border px-4 py-2 text-body-small font-medium transition-colors ${
                      isActive
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Signal-Auswahl */}
          <div className="mb-6">
            <label className="mb-2 block text-body-small font-medium text-foreground-700">
              Vergleiche Anfälle mit:
            </label>
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              className="w-full rounded-lg border border-background-200 bg-background-10 px-4 py-2 text-body text-foreground-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen...</option>
              {availableSignalsInRange.map((signal) => (
                <option key={signal.id} value={signal.id}>
                  {signal.label}
                </option>
              ))}
            </select>
          </div>

          {/* MOBILE VIEW: Grafik mit horizontalem Scroll + Erkenntnisse */}
          {isMobile && selectedSignal && (
            <>
              {/* Horizontal scrollbare Visualisierung */}
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className="overflow-x-auto">
                    <div className="relative h-48 min-w-[600px]">
                      <svg
                        className="h-full w-full"
                        viewBox="0 0 1000 200"
                        preserveAspectRatio="none"
                      >
                        {/* Signal-Linie */}
                        {signalPoints.length > 1 && (
                          <polyline
                            points={signalPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="var(--color-accent-500)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.75"
                          />
                        )}

                        {/* Anfall-Marker - gestrichelte vertikale Linien */}
                        {visualizationData.map((d, i) => {
                          if (!d.hasSeizure) return null;
                          const x =
                            visualizationData.length > 1
                              ? (i / (visualizationData.length - 1)) * 1000
                              : 500;
                          return (
                            <line
                              key={`seizure-${d.dateStr}`}
                              x1={x}
                              y1={200}
                              x2={x}
                              y2={0}
                              stroke="var(--color-primary-500)"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                              opacity="0.6"
                            />
                          );
                        })}
                      </svg>

                      {/* Zeitachse Labels */}
                      <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] text-foreground-500">
                        <span>
                          {format(timeRangeData.start, "dd.MM.", { locale: de })}
                        </span>
                        <span>
                          {format(timeRangeData.end, "dd.MM.", { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Minimale Legende */}
                  <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-foreground-600">
                    {signalPoints.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-6 rounded bg-accent-500 opacity-80"></div>
                        <span>
                          {availableSignals.find((s) => s.id === selectedSignal)?.label}
                        </span>
                      </div>
                    )}
                    {seizuresInRange.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg width="8" height="12" viewBox="0 0 8 12" className="block">
                          <line x1="4" y1="0" x2="4" y2="12" stroke="var(--color-primary-500)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                        </svg>
                        <span>Anfall</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-body text-foreground-500">
                      Für den ausgewählten Zeitraum sind keine Daten verfügbar.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TABLET VIEW: Vereinfachte Visualisierung */}
          {isTablet && selectedSignal && (
            <>
              {/* Vereinfachte Visualisierung */}
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className="relative h-48 w-full overflow-hidden">
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 1000 200"
                      preserveAspectRatio="none"
                    >
                      {/* Signal-Linie - vereinfacht, keine Tooltips */}
                      {signalPoints.length > 1 && (
                        <polyline
                          points={signalPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke="var(--color-accent-500)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.75"
                        />
                      )}

                      {/* Anfall-Marker - gestrichelte vertikale Linien */}
                      {visualizationData.map((d, i) => {
                        if (!d.hasSeizure) return null;
                        const x =
                          visualizationData.length > 1
                            ? (i / (visualizationData.length - 1)) * 1000
                            : 500;
                        return (
                          <line
                            key={`seizure-${d.dateStr}`}
                            x1={x}
                            y1={200}
                            x2={x}
                            y2={0}
                            stroke="var(--color-primary-500)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.6"
                          />
                        );
                      })}
                    </svg>

                    {/* Zeitachse Labels - minimal */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] text-foreground-500">
                      <span>
                        {format(timeRangeData.start, "dd.MM.", { locale: de })}
                      </span>
                      <span>
                        {format(timeRangeData.end, "dd.MM.", { locale: de })}
                      </span>
                    </div>
                  </div>

                  {/* Minimale Legende */}
                  <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-foreground-600">
                    {signalPoints.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-6 rounded bg-accent-500 opacity-80"></div>
                        <span>
                          {availableSignals.find((s) => s.id === selectedSignal)?.label}
                        </span>
                      </div>
                    )}
                    {seizuresInRange.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg width="8" height="12" viewBox="0 0 8 12" className="block">
                          <line x1="4" y1="0" x2="4" y2="12" stroke="var(--color-primary-500)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                        </svg>
                        <span>Anfall</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-body text-foreground-500">
                      Für den ausgewählten Zeitraum sind keine Daten verfügbar.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* DESKTOP VIEW: Vollständige Visualisierung */}
          {isDesktop && selectedSignal && (
            <>
              {/* Vollständige Visualisierung */}
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-6">
                  <div className="relative h-80 w-full overflow-hidden">
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 1000 200"
                      preserveAspectRatio="none"
                    >
                      {/* Signal-Linie */}
                      {signalPoints.length > 1 && (
                        <polyline
                          points={signalPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke="var(--color-accent-500)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.75"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Anfall-Marker - gestrichelte vertikale Linien */}
                      {visualizationData.map((d, i) => {
                        if (!d.hasSeizure) return null;
                        const x =
                          visualizationData.length > 1
                            ? (i / (visualizationData.length - 1)) * 1000
                            : 500;
                        return (
                          <line
                            key={`seizure-${d.dateStr}`}
                            x1={x}
                            y1={200}
                            x2={x}
                            y2={0}
                            stroke="var(--color-primary-500)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.6"
                            className="transition-all duration-300"
                          />
                        );
                      })}
                    </svg>

                    {/* Zeitachse Labels */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2 text-[10px] text-foreground-500">
                      <span>
                        {format(timeRangeData.start, "dd.MM.yyyy", { locale: de })}
                      </span>
                      <span>
                        {format(timeRangeData.end, "dd.MM.yyyy", { locale: de })}
                      </span>
                    </div>
                  </div>

                  {/* Legende */}
                  <div className="mt-4 flex items-center justify-center gap-6 text-body-small text-foreground-600">
                    {signalPoints.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-8 rounded bg-accent-500 opacity-80"></div>
                        <span>
                          {availableSignals.find((s) => s.id === selectedSignal)?.label}
                        </span>
                      </div>
                    )}
                    {seizuresInRange.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg width="8" height="12" viewBox="0 0 8 12" className="block">
                          <line x1="4" y1="0" x2="4" y2="12" stroke="var(--color-primary-500)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                        </svg>
                        <span>Anfall</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-6">
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-body text-foreground-500">
                      Für den ausgewählten Zeitraum sind keine Daten verfügbar.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedSignal && (
            <div className="rounded-lg border border-background-200 bg-background-10 p-4 text-center">
              <p className="text-body text-foreground-600">
                Wähle ein Signal aus, um mögliche Zusammenhänge zu erkennen.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
