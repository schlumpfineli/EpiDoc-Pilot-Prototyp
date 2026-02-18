"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, subDays, subMonths, eachDayOfInterval, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { seizureApi, befindenApi, Befinden, Seizure } from "@/lib/api";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { toastService } from "@/components/ui";
import { useRoleText } from "@/lib/hooks/useRoleText";

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

// Englische Werte (z. B. aus Seed/API) → Deutsch für PDF-Anfallsarten
const seizureTypeLabelDe: Record<string, string> = {
  absence: "Absencen",
  absences: "Absencen",
  myoclonic: "Myoklonische Anfälle",
  focal: "Fokale Anfälle",
  "focal aware": "Fokale Anfälle mit erhaltenem Bewusstsein",
  "focal with preserved awareness": "Fokale Anfälle mit erhaltenem Bewusstsein",
  "focal impaired": "Fokale Anfälle mit beeinträchtigtem Bewusstsein",
  "focal to bilateral": "Fokal-zu-bilateral tonisch-klonische Anfälle",
  "tonic-clonic": "Tonisch-klonische Anfälle",
  generalized: "Generalisierte Anfälle",
  "status epilepticus": "Status epilepticus",
  spasms: "Spasmen",
  unknown: "Anfälle unbekannten Ursprungs",
};

// Englische Werte → Deutsch für PDF-Auslöser
const seizureTriggerLabelDe: Record<string, string> = {
  stress: "Stress",
  "lack of sleep": "Schlafmangel",
  lack_of_sleep: "Schlafmangel",
  "sleep deprivation": "Schlafmangel",
  sleep_deprivation: "Schlafmangel",
  alcohol: "Alkohol",
  drugs: "Drogen",
  "flashing lights": "Flackerndes Licht",
  flashing_lights: "Flackerndes Licht",
  "unknown medication": "Unbekannte Medikamente",
  unknown_medication: "Unbekannte Medikamente",
  dehydration: "Dehydrierung",
  "brain injury": "Gehirnschädigungen",
  brain_injury: "Gehirnschädigungen",
  infection: "Infektion",
};

// Englische Werte → Deutsch für PDF-Nachwirkungen (Symptome nach Anfall)
const seizureAfterEffectLabelDe: Record<string, string> = {
  confusion: "Verwirrtheit",
  tiredness: "Müdigkeit",
  headache: "Kopfschmerzen",
  "muscle ache": "Lähmungserscheinungen",
  muscle_ache: "Lähmungserscheinungen",
  dizziness: "Schwindel",
  nausea: "Übelkeit",
  "speech disorder": "Sprachstörungen",
  speech_disorder: "Sprachstörungen",
  "low mood": "Niedergeschlagenheit",
  low_mood: "Niedergeschlagenheit",
  irritability: "Reizbarkeit",
  "recovery half day": "Erholungszeit: halber Tag",
  "recovery full day": "Erholungszeit: ganzer Tag",
  "recovery more than day": "Erholungszeit: mehr als ein Tag",
};

function toGermanType(value: string): string {
  return seizureTypeLabelDe[value] ?? value;
}
function toGermanTrigger(value: string): string {
  return seizureTriggerLabelDe[value] ?? value;
}
function toGermanAfterEffect(value: string): string {
  return seizureAfterEffectLabelDe[value] ?? value;
}

type TimeRange = "7d" | "30d" | "6m" | "1y";

const COLORS = {
  bg:        '#F3F6F4',
  title:     '#243B2E',
  subtitle:  '#6F7F75',
  signal:    '#6FB48F',
  seizure:   '#6FAED9',
  peak:      '#E3B86C',
  border:    '#E3EAE6',
  activeBg:  '#EAF4EE',
  hoverBg:   '#F5F7F6',
} as const;

export default function VerlaufPage() {
  const { t } = useRoleText();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedSignal, setSelectedSignal] = useState<string>("");
  const [seizures, setSeizures] = useState<Seizure[]>([]);
  const [befindenData, setBefindenData] = useState<Befinden[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingSeizurePdf, setIsExportingSeizurePdf] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [signalDropdownOpen, setSignalDropdownOpen] = useState(false);
  const signalDropdownRef = useRef<HTMLDivElement>(null);
  const breakpoint = useBreakpoint();

  // Click-Outside schließt Dropdown
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (signalDropdownRef.current && !signalDropdownRef.current.contains(e.target as Node)) {
      setSignalDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (signalDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [signalDropdownOpen, handleClickOutside]);

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

  // Finde alle Signale mit mindestens einem Eintrag (alle Einträge sichtbar, unabhängig vom gewählten Zeitraum)
  const availableSignalsInRange = useMemo(() => {
    const signalsWithData = new Set<string>();
    befindenData.forEach((item) => signalsWithData.add(item.symptom_id));
    return availableSignals.filter((signal) => signalsWithData.has(signal.id));
  }, [befindenData]);

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
  type InsightType = "before" | "on" | "none";
  
  interface StructuredInsight {
    type: InsightType;
    text: string;
    strength: "weak" | "moderate" | "strong";
  }

  const MIN_SEIZURES_FOR_INSIGHT = 15;
  const MIN_EFFECT_THRESHOLD = 1.0;

  // Insights: nur bei ≥20 Anfällen und statistisch relevanter Differenz
  const insights = useMemo(() => {
    if (!selectedSignal || seizuresInRange.length === 0) return [];

    const insightsList: StructuredInsight[] = [];
    const signalLabel = availableSignals.find((s) => s.id === selectedSignal)?.label || selectedSignal;

    if (seizuresInRange.length < MIN_SEIZURES_FOR_INSIGHT) {
      insightsList.push({
        type: "none",
        text: "Für eine aussagekräftige Darstellung werden mindestens 15 dokumentierte Anfälle benötigt. Mit weiteren Einträgen können mögliche Muster klarer erkennbar werden.",
        strength: "weak",
      });
      return insightsList;
    }

    const seizureDates = seizuresInRange.map((s) => parseISO(s.date));
    const daysWithSignal = Object.keys(signalByDay);
    if (daysWithSignal.length === 0) return [];

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

    const collectValues = (dateFn: (seizureDate: Date) => Date[]) => {
      const values: number[] = [];
      seizureDates.forEach((sd) => {
        dateFn(sd).forEach((d) => {
          const k = format(d, "yyyy-MM-dd");
          if (signalByDay[k] !== undefined) values.push(signalByDay[k]);
        });
      });
      return values;
    };

    const daysBeforeValues = collectValues((sd) => [2, 3, 4].map((n) => subDays(sd, n)));
    const daysOnValues = collectValues((sd) => [sd]);
    const daysAfterValues = collectValues((sd) => [1, 2, 3].map((n) => subDays(sd, -n)));

    const allSignalValues = Object.values(signalByDay);
    const avgOverall = allSignalValues.length > 0 ? avg(allSignalValues) : null;
    if (avgOverall === null) return [];

    const checkPattern = (values: number[], type: InsightType) => {
      if (values.length === 0) return;
      const avgVal = avg(values);
      const diff = avgVal - avgOverall;
      if (Math.abs(diff) < MIN_EFFECT_THRESHOLD) return;
      const strength = Math.abs(diff) > 2.0 ? "strong" : Math.abs(diff) > 1.5 ? "moderate" : "weak";
      insightsList.push({
        type,
        text: type === "on"
          ? `In deinen bisherigen Einträgen zeigen sich Unterschiede zwischen Tagen mit und ohne dokumentierte Anfälle. Die Darstellung beschreibt ausschließlich deine selbst erfassten Angaben und erlaubt keine medizinische Bewertung.`
          : `In zeitlicher Nähe zu dokumentierten Anfällen weichen die erfassten Werte teilweise vom Durchschnitt anderer Tage ab. Die Darstellung beschreibt ausschließlich deine selbst erfassten Angaben und erlaubt keine medizinische Bewertung.`,
        strength,
      });
    };

    checkPattern(daysBeforeValues, "before");
    checkPattern(daysOnValues, "on");
    checkPattern(daysAfterValues, "before");

    if (insightsList.length === 0) {
      insightsList.push({
        type: "none",
        text: `Im gewählten Zeitraum zeigen sich bei ${signalLabel} keine auffälligen Unterschiede zwischen Tagen mit und ohne dokumentierte Anfälle.`,
        strength: "weak",
      });
    }

    return insightsList;
  }, [seizuresInRange, selectedSignal, signalByDay, availableSignals]);

  const summaryInsight = selectedSignal ? (insights[0]?.text ?? null) : null;

  const [showMethodInfo, setShowMethodInfo] = useState(false);
  const [showInsightDetail, setShowInsightDetail] = useState(false);

  const insightBanner = selectedSignal ? (
    <div className="mt-4 space-y-2">
      {summaryInsight && (
        <button
          type="button"
          onClick={() => setShowInsightDetail((prev) => !prev)}
          className="flex w-full items-center gap-2 px-1 text-left group"
        >
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-foreground-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[12px] text-foreground-400 group-hover:text-foreground-600 transition-colors">
            Muster anzeigen
          </span>
          <svg className={`h-3 w-3 flex-shrink-0 text-foreground-300 transition-transform duration-200 ${showInsightDetail ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {showInsightDetail && summaryInsight && (
        <div className="px-1 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[12px] text-foreground-500 leading-[1.7]">{summaryInsight}</p>
          <p className="text-[10px] text-foreground-300 leading-[1.7]">Die Darstellung beschreibt ausschließlich deine selbst erfassten Angaben.</p>
          <div className="flex items-center gap-3 pt-1 text-[10px] text-foreground-300">
            <span>Persönliche Übersicht · keine medizinische Bewertung</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowMethodInfo((prev) => !prev); }}
              className="inline-flex items-center gap-1 flex-shrink-0 underline decoration-foreground-200 underline-offset-2 hover:text-foreground-500 transition-colors"
            >
              <svg className="h-2.5 w-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
              </svg>
              Methodik
            </button>
          </div>
          {showMethodInfo && (
            <div className="text-[10px] text-foreground-300 leading-[1.7] space-y-1 animate-in fade-in duration-150">
              <p>Die Darstellung vergleicht Durchschnittswerte an Tagen mit dokumentierten Anfällen mit anderen Tagen im gewählten Zeitraum. Es wird kein medizinischer Zusammenhang geprüft, sondern lediglich eine Gegenüberstellung deiner Einträge vorgenommen.</p>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  // Berechne Min/Max für Signal-Normalisierung
  const signalMinMax = useMemo(() => {
    const values = Object.values(signalByDay);
    if (values.length === 0) return { min: 0, max: 10 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [signalByDay]);

  const chartContext = useMemo(() => {
    const rangeLabels: Record<TimeRange, string> = { "7d": "7 Tage", "30d": "30 Tage", "6m": "6 Monate", "1y": "1 Jahr" };
    const totalDays = timeRangeData.days.length;
    const daysWithEntries = Object.keys(signalByDay).length;
    return {
      range: rangeLabels[timeRange],
      seizures: seizuresInRange.length,
      totalDays,
      daysWithEntries,
    };
  }, [timeRange, seizuresInRange, timeRangeData.days, signalByDay]);

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
        return { x, y: 200 - normalizedValue, value: d.signalValue };
      })
      .filter((p) => p !== null) as Array<{ x: number; y: number; value: number }>;
  }, [visualizationData, signalMinMax]);

  // Smooth Catmull-Rom Spline → SVG cubic bezier path
  const splinePath = useMemo(() => {
    if (signalPoints.length < 2) return "";
    const pts = signalPoints;
    const tension = 0.3;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + ((p2.x - p0.x) * tension);
      const cp1y = p1.y + ((p2.y - p0.y) * tension);
      const cp2x = p2.x - ((p3.x - p1.x) * tension);
      const cp2y = p2.y - ((p3.y - p1.y) * tension);
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [signalPoints]);

  // Area-Fill path (gleiche Spline + Boden schließen)
  const areaPath = useMemo(() => {
    if (!splinePath || signalPoints.length < 2) return "";
    const first = signalPoints[0];
    const last = signalPoints[signalPoints.length - 1];
    return `${splinePath} L${last.x},200 L${first.x},200 Z`;
  }, [splinePath, signalPoints]);

  // Peaks: lokale Maxima mit Mindestabstand
  const peakPoints = useMemo(() => {
    if (signalPoints.length < 3) return [];
    const peaks: Array<{ x: number; y: number; value: number }> = [];
    for (let i = 1; i < signalPoints.length - 1; i++) {
      const prev = signalPoints[i - 1];
      const curr = signalPoints[i];
      const next = signalPoints[i + 1];
      if (curr.y < prev.y && curr.y < next.y && curr.value >= 5) {
        const tooClose = peaks.some((p) => Math.abs(p.x - curr.x) < 60);
        if (!tooClose) peaks.push(curr);
      }
    }
    return peaks;
  }, [signalPoints]);

  // Monats-Markierungen für X-Achse (nur 6m / 1y), schlicht
  const monthTicks = useMemo(() => {
    if (timeRange !== "6m" && timeRange !== "1y") return [];
    const start = timeRangeData.start;
    const end = timeRangeData.end;
    const ticks: { label: string; position: number }[] = [];
    const startT = start.getTime();
    const endT = end.getTime();
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d.getTime() <= endT) {
      if (d.getTime() >= startT) {
        const position = ((d.getTime() - startT) / (endT - startT)) * 100;
        ticks.push({ label: format(d, "MMM", { locale: de }), position });
      }
      d.setMonth(d.getMonth() + 1);
    }
    return ticks;
  }, [timeRange, timeRangeData]);

  // Hilfsfunktion: Chart-Daten für ein einzelnes Symptom (für PDF-Export aller Symptome)
  const getChartDataForSignal = (symptomId: string) => {
    const signalData = befindenData
      .filter((item) => {
        const itemDate = parseISO(item.date);
        return (
          itemDate >= timeRangeData.start &&
          itemDate <= timeRangeData.end &&
          item.symptom_id === symptomId
        );
      })
      .map((item) => ({
        date: item.date,
        rating: item.rating ?? null,
      }));
    const dayMap: Record<string, number[]> = {};
    signalData.forEach((item) => {
      const dateStr = format(parseISO(item.date), "yyyy-MM-dd");
      if (item.rating !== null && item.rating !== undefined) {
        if (!dayMap[dateStr]) dayMap[dateStr] = [];
        dayMap[dateStr].push(item.rating);
      }
    });
    const signalByDay: Record<string, number> = {};
    Object.entries(dayMap).forEach(([date, ratings]) => {
      signalByDay[date] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });
    const values = Object.values(signalByDay);
    const signalMinMax = values.length === 0 ? { min: 0, max: 10 } : { min: Math.min(...values), max: Math.max(...values) };
    const visData = timeRangeData.days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const hasSeizure = seizuresInRange.some((s) => isSameDay(parseISO(s.date), day));
      return { dateStr: dayStr, hasSeizure, signalValue: signalByDay[dayStr] };
    });
    const points = visData
      .map((d, i) => {
        if (d.signalValue === undefined) return null;
        const x = (i / Math.max(visData.length - 1, 1)) * 1000;
        const normalized =
          signalMinMax.max > signalMinMax.min
            ? ((d.signalValue - signalMinMax.min) / (signalMinMax.max - signalMinMax.min)) * 160 + 20
            : 100;
        return { x, y: 200 - normalized };
      })
      .filter((p) => p !== null) as Array<{ x: number; y: number }>;
    return { signalByDay, visualizationData: visData, signalPoints: points, signalMinMax };
  };

  // SVG aus Chart-Daten bauen (Hex-Farben für PDF)
  const buildChartSvg = (
    signalPoints: Array<{ x: number; y: number }>,
    visualizationData: Array<{ dateStr: string; hasSeizure: boolean; signalValue?: number }>
  ) => {
    const accentHex = "#9ed2be";
    const primaryHex = "#1f2a44";
    const polylinePoints = signalPoints.length > 1 ? signalPoints.map((p) => `${p.x},${p.y}`).join(" ") : "";
    const seizureLines = visualizationData
      .map((d, i) => {
        if (!d.hasSeizure) return "";
        const x = visualizationData.length > 1 ? (i / (visualizationData.length - 1)) * 1000 : 500;
        return `<line x1="${x}" y1="200" x2="${x}" y2="0" stroke="${primaryHex}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`;
      })
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" width="1000" height="200">
  ${polylinePoints ? `<polyline points="${polylinePoints}" fill="none" stroke="${accentHex}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>` : ""}
  ${seizureLines}
</svg>`;
  };

  // Canvas aus SVG-Data-URL erzeugen
  const svgToCanvas = async (svg: string): Promise<HTMLCanvasElement> => {
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const img = new Image();
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 1000 * scale;
    canvas.height = 200 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D nicht verfügbar");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, 1000, 200);
        resolve();
      };
      img.onerror = () => reject(new Error("SVG konnte nicht geladen werden"));
      img.src = svgDataUrl;
    });
    return canvas;
  };

  // PDF-Export: Alle im Zeitraum erfassten Symptome – kompakt, getrennt durch Linie und Weißraum (ab 1 Monat)
  const handleExportPdf = async () => {
    if (timeRange === "7d") {
      toastService.show("PDF-Export ist ab einem Zeitraum von 30 Tagen verfügbar.", "warning");
      return;
    }
    const signalsToExport = availableSignalsInRange;
    if (signalsToExport.length === 0) {
      toastService.show("Keine Symptom-Daten im gewählten Zeitraum.", "warning");
      return;
    }
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const imgW = pdfW - 2 * margin;
      const chartHeightMm = 48; // kompakte Grafikhöhe
      const lineY = (y: number) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y, pdfW - margin, y);
      };

      let y = margin;

      // Titel + Zeitraum (kompakt)
      pdf.setFontSize(14);
      pdf.text("EpiDoc – Analyse", margin, y);
      y += 5;
      pdf.setFontSize(10);
      pdf.text(
        `Zeitraum: ${format(timeRangeData.start, "dd.MM.yyyy", { locale: de })} – ${format(timeRangeData.end, "dd.MM.yyyy", { locale: de })} · ${signalsToExport.length} Symptom${signalsToExport.length === 1 ? "" : "e"}`,
        margin,
        y
      );
      y += 5;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Grüne Linie = Symptomverlauf · Gestrichelte Linie = Anfallsereignis", margin, y);
      pdf.setTextColor(0, 0, 0);
      y += 5;
      lineY(y);
      y += 6;

      const spaceAfterChart = 4;
      const spaceAfterLine = 4;
      // Monats-Ticks für PDF-X-Achse aus dem exportierten Zeitraum berechnen (immer, nicht nur 6m/1y)
      const startT = timeRangeData.start.getTime();
      const endT = timeRangeData.end.getTime();
      const pdfMonthTicks: { label: string; position: number }[] = [];
      let d = new Date(timeRangeData.start.getFullYear(), timeRangeData.start.getMonth(), 1);
      while (d.getTime() <= endT) {
        if (d.getTime() >= startT) {
          const position = ((d.getTime() - startT) / (endT - startT)) * 100;
          pdfMonthTicks.push({ label: format(d, "MMM", { locale: de }), position });
        }
        d.setMonth(d.getMonth() + 1);
      }
      const axisH = pdfMonthTicks.length > 0 ? 8 : spaceAfterChart;
      for (let i = 0; i < signalsToExport.length; i++) {
        const signal = signalsToExport[i];
        const labelH = 5;
        const blockH = labelH + 2 + chartHeightMm + axisH + 2 + spaceAfterLine;

        if (y + blockH > pdfH - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(10);
        pdf.text(signal.label, margin, y);
        y += labelH + 2;

        const { signalPoints: points, visualizationData: visData } = getChartDataForSignal(signal.id);
        const svg = buildChartSvg(points, visData);
        const canvas = await svgToCanvas(svg);
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", margin, y, imgW, chartHeightMm);
        y += chartHeightMm;

        // X-Achse mit Monaten im PDF (immer wenn der Zeitraum Monatsgrenzen enthält)
        if (pdfMonthTicks.length > 0) {
          const axisY = y + 2;
          pdf.setDrawColor(100, 100, 100);
          pdf.setLineWidth(0.2);
          pdf.line(margin, axisY, margin + imgW, axisY);
          pdfMonthTicks.forEach((t) => {
            const tx = margin + (t.position / 100) * imgW;
            pdf.line(tx, axisY, tx, axisY + 2);
          });
          pdf.setFontSize(8);
          pdf.setTextColor(80, 80, 80);
          pdfMonthTicks.forEach((t) => {
            const tx = margin + (t.position / 100) * imgW;
            const tw = pdf.getTextWidth(t.label);
            pdf.text(t.label, tx - tw / 2, axisY + 5);
          });
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          y += 8;
        } else {
          y += spaceAfterChart;
        }

        if (i < signalsToExport.length - 1) {
          lineY(y);
          y += 2 + spaceAfterLine;
        }
      }

      const filename = `epidoc-analyse-${format(timeRangeData.start, "yyyy-MM-dd")}-bis-${format(timeRangeData.end, "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toastService.show(`${signalsToExport.length} Symptom${signalsToExport.length === 1 ? "" : "e"} als PDF exportiert.`, "success");
    } catch (err) {
      console.error("PDF-Export fehlgeschlagen:", err);
      toastService.show("PDF-Export ist fehlgeschlagen.", "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Hilfsfunktion: Datum-String sicher als dd.MM.yyyy formatieren (API kann YYYY-MM-DD oder ISO-String liefern)
  const formatSeizureDate = (dateStr: string | undefined): string => {
    if (!dateStr || typeof dateStr !== "string") return "";
    const iso = dateStr.slice(0, 10);
    if (iso.length < 10) return dateStr;
    try {
      return format(parseISO(iso), "dd.MM.yyyy", { locale: de });
    } catch {
      return dateStr;
    }
  };

  // PDF-Export: Zusammenfassung der Anfälle (Anzahl pro Monat, genaue Daten, Notfallmedikament, Nachwirkungen)
  const handleExportSeizureSummaryPdf = async () => {
    setIsExportingSeizurePdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let y = margin;
      const maybeNewPage = () => {
        if (y > pdfH - margin - 25) {
          pdf.addPage();
          y = margin;
        }
      };

      pdf.setFontSize(14);
      pdf.text("EpiDoc – Zusammenfassung Anfälle", margin, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.text(
        `Zeitraum: ${format(timeRangeData.start, "dd.MM.yyyy", { locale: de })} – ${format(timeRangeData.end, "dd.MM.yyyy", { locale: de })}`,
        margin,
        y
      );
      y += 4;
      pdf.setFontSize(8);
      pdf.text("Enthält: genaue Daten, Notfallmedikament, Nachwirkungen", margin, y);
      y += 8;

      // Anfälle pro Monat (chronologisch: alle Monate im Zeitraum)
      const byMonthKey: Record<string, number> = {};
      seizuresInRange.forEach((s) => {
        if (!s.date) return;
        try {
          const key = format(parseISO(String(s.date).slice(0, 10)), "yyyy-MM");
          byMonthKey[key] = (byMonthKey[key] ?? 0) + (s.seizure_count ?? 1);
        } catch {
          // Datum überspringen wenn ungültig
        }
      });
      const monthsInRange: { key: string; label: string }[] = [];
      let d = new Date(timeRangeData.start.getFullYear(), timeRangeData.start.getMonth(), 1);
      const endT = timeRangeData.end.getTime();
      while (d.getTime() <= endT) {
        monthsInRange.push({
          key: format(d, "yyyy-MM"),
          label: format(d, "MMMM yyyy", { locale: de }),
        });
        d.setMonth(d.getMonth() + 1);
      }

      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Anfälle pro Monat", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (monthsInRange.length === 0) {
        pdf.text("Keine Anfälle im gewählten Zeitraum.", margin, y);
        y += 6;
      } else {
        monthsInRange.forEach(({ key, label }) => {
          const count = byMonthKey[key] ?? 0;
          pdf.text(`${label}: ${count}`, margin, y);
          y += 5;
        });
        y += 3;
      }

      // Anfälle mit genauen Daten (Datum dd.MM.yyyy, Anzahl)
      const byDateKey: Record<string, number> = {};
      seizuresInRange.forEach((s) => {
        const key = typeof s.date === "string" ? s.date.slice(0, 10) : "";
        if (!key) return;
        byDateKey[key] = (byDateKey[key] ?? 0) + (s.seizure_count ?? 1);
      });
      const sortedDates = Object.keys(byDateKey).sort();
      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Anfälle mit genauen Daten", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (sortedDates.length === 0) {
        pdf.text("Keine Anfälle im gewählten Zeitraum.", margin, y);
        y += 6;
      } else {
        sortedDates.forEach((dateStr) => {
          const count = byDateKey[dateStr];
          const label = formatSeizureDate(dateStr);
          if (!label) return;
          pdf.text(`• ${label}: ${count} Anfall${count !== 1 ? "fälle" : ""}`, margin, y);
          y += 5;
        });
        y += 3;
      }

      // Notfallmedikament eingenommen an (Datum + Medikamentenname) – API kann true, 1 oder "1" liefern
      const emergencyEntries = seizuresInRange.filter((s) => Boolean(s.emergency_med) === true);
      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Notfallmedikament eingenommen an", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (emergencyEntries.length === 0) {
        pdf.text("Keine Einnahme im gewählten Zeitraum.", margin, y);
        y += 6;
      } else {
        emergencyEntries.forEach((s) => {
          const dateLabel = formatSeizureDate(s.date);
          if (!dateLabel) return;
          const med = s.emergency_med_name?.trim();
          pdf.text(`• ${dateLabel}${med ? ` (${med})` : ""}`, margin, y);
          y += 5;
        });
        y += 3;
      }

      // Häufigste Anfallsarten (type[] + custom_type) – Ausgabe auf Deutsch
      const typeCount: Record<string, number> = {};
      seizuresInRange.forEach((s) => {
        const types = Array.isArray(s.type) ? s.type : s.type != null && s.type !== "" ? [String(s.type)] : [];
        types.forEach((t) => {
          const label = toGermanType(String(t).trim());
          typeCount[label] = (typeCount[label] ?? 0) + (s.seizure_count ?? 1);
        });
        if (s.custom_type?.trim()) {
          const c = s.custom_type.trim();
          typeCount[c] = (typeCount[c] ?? 0) + (s.seizure_count ?? 1);
        }
      });
      const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Häufigste Anfallsarten", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (topTypes.length === 0) {
        pdf.text("Keine Angaben.", margin, y);
        y += 6;
      } else {
        topTypes.forEach(([name, count]) => {
          pdf.text(`• ${name}: ${count}`, margin, y);
          y += 5;
        });
        y += 3;
      }

      // Häufigste Auslöser (triggers[] + custom_triggers) – Ausgabe auf Deutsch
      const triggerCount: Record<string, number> = {};
      seizuresInRange.forEach((s) => {
        const triggers = Array.isArray(s.triggers) ? s.triggers : s.triggers != null && s.triggers !== "" ? [String(s.triggers)] : [];
        triggers.forEach((t) => {
          const label = toGermanTrigger(String(t).trim());
          triggerCount[label] = (triggerCount[label] ?? 0) + (s.seizure_count ?? 1);
        });
        if (s.custom_triggers?.trim()) {
          const c = s.custom_triggers.trim();
          triggerCount[c] = (triggerCount[c] ?? 0) + (s.seizure_count ?? 1);
        }
      });
      const topTriggers = Object.entries(triggerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Häufigste Auslöser", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (topTriggers.length === 0) {
        pdf.text("Keine Angaben.", margin, y);
        y += 6;
      } else {
        topTriggers.forEach(([name, count]) => {
          pdf.text(`• ${name}: ${count}`, margin, y);
          y += 5;
        });
        y += 3;
      }

      // Häufigste Nachwirkungen (Symptome nach Anfall: after_effects[] + custom_after_effects)
      const afterEffectCount: Record<string, number> = {};
      seizuresInRange.forEach((s) => {
        const effects = Array.isArray(s.after_effects) ? s.after_effects : s.after_effects != null && s.after_effects !== "" ? [String(s.after_effects)] : [];
        effects.forEach((e) => {
          const label = toGermanAfterEffect(String(e).trim());
          afterEffectCount[label] = (afterEffectCount[label] ?? 0) + (s.seizure_count ?? 1);
        });
        if (s.custom_after_effects?.trim()) {
          const c = s.custom_after_effects.trim();
          afterEffectCount[c] = (afterEffectCount[c] ?? 0) + (s.seizure_count ?? 1);
        }
      });
      const topAfterEffects = Object.entries(afterEffectCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      maybeNewPage();
      pdf.setFontSize(11);
      pdf.text("Häufigste Nachwirkungen (Symptome nach Anfall)", margin, y);
      y += 5;
      pdf.setFontSize(9);
      if (topAfterEffects.length === 0) {
        pdf.text("Keine Angaben.", margin, y);
        y += 6;
      } else {
        topAfterEffects.forEach(([name, count]) => {
          pdf.text(`• ${name}: ${count}`, margin, y);
          y += 5;
        });
      }

      const filename = `epidoc-anfaelle-${format(timeRangeData.start, "yyyy-MM-dd")}-bis-${format(timeRangeData.end, "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toastService.show("Anfälle-Zusammenfassung als PDF exportiert.", "success");
    } catch (err) {
      console.error("PDF-Export Anfälle fehlgeschlagen:", err);
      toastService.show("PDF-Export ist fehlgeschlagen.", "error");
    } finally {
      setIsExportingSeizurePdf(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F3F6F4" }}>
          <p className="text-body text-foreground-400">Einen Moment…</p>
        </div>
      </ProtectedRoute>
    );
  }

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isDesktop = breakpoint === "desktop";

  const selectedSignalLabel = availableSignals.find((s) => s.id === selectedSignal)?.label;
  const hasChartData = signalPoints.length > 0 || seizuresInRange.length > 0;
  const showMonthAxis = (timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0;

  const chartSvgContent = (gradientId: string, withTransition = false) => (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6FB48F" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#6FB48F" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} className={withTransition ? "transition-all duration-300" : undefined} />}
      {splinePath && <path d={splinePath} fill="none" stroke="#6FB48F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" className={withTransition ? "transition-all duration-300" : undefined} />}
      {peakPoints.map((p, i) => (
        <circle key={`peak-${i}`} cx={p.x} cy={p.y} r={isDesktop ? "3" : "2.5"} fill="#E3B86C" opacity={isDesktop ? "0.5" : "0.55"} className={withTransition ? "transition-all duration-300" : undefined} />
      ))}
      {visualizationData.map((d, i) => {
        if (!d.hasSeizure) return null;
        const x = visualizationData.length > 1 ? (i / (visualizationData.length - 1)) * 1000 : 500;
        return <line key={`seizure-${d.dateStr}`} x1={x} y1={200} x2={x} y2={0} stroke="#6FAED9" strokeWidth="1" strokeDasharray="4 4" opacity={isDesktop ? "0.35" : "0.4"} className={withTransition ? "transition-all duration-300" : undefined} />;
      })}
    </>
  );

  const monthAxisOverlay = showMonthAxis ? (
    <div className="absolute bottom-0 left-3 right-3 h-4 pt-px">
      <div className="h-px w-full bg-foreground-200" />
      {monthTicks.map((t) => (
        <div
          key={`${t.label}-${t.position}`}
          className={`absolute top-0 ${t.position <= 0 ? "translate-x-0" : t.position >= 100 ? "-translate-x-full" : "-translate-x-1/2"}`}
          style={{ left: `${t.position}%` }}
        >
          <div className="w-px h-1 bg-foreground-300" />
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-foreground-300 whitespace-nowrap leading-none" style={{ fontSize: "9px" }}>
            {t.label}
          </span>
        </div>
      ))}
      <div className="absolute top-0 right-0 w-px h-1 bg-foreground-300" aria-hidden />
    </div>
  ) : null;

  const chartLegend = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-foreground-300">
      {signalPoints.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="h-[2px] w-3.5 rounded-full" style={{ background: "#6FB48F", opacity: 0.7 }} />
          <span>{selectedSignalLabel}</span>
        </div>
      )}
      {seizuresInRange.length > 0 && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="2" viewBox="0 0 14 2" className="block flex-shrink-0">
            <line x1="0" y1="1" x2="14" y2="1" stroke="#6FAED9" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
          </svg>
          <span>Anfall</span>
        </div>
      )}
    </div>
  );

  const contextChips = (size: "sm" | "lg" = "sm") => {
    const px = size === "lg" ? "px-3" : "px-2.5";
    const textSize = size === "lg" ? "text-[12px]" : "text-[11px]";
    const gap = size === "lg" ? "gap-2" : "gap-1.5";
    return (
      <div className={`flex flex-wrap items-center ${gap} ${textSize}`}>
        <span className={`rounded-full bg-[#F3F7F5] ${px} py-0.5 text-foreground-400`}>{chartContext.range}</span>
        <span className="text-foreground-200">·</span>
        <span className={`rounded-full bg-[#F3F7F5] ${px} py-0.5 text-foreground-400`}>{chartContext.seizures} {chartContext.seizures === 1 ? "Anfall" : "Anfälle"}</span>
        {selectedSignal && <>
          <span className="text-foreground-200">·</span>
          <span className={`rounded-full bg-[#F3F7F5] ${px} py-0.5 text-foreground-400`}>{chartContext.daysWithEntries} / {chartContext.totalDays} Tage erfasst</span>
        </>}
      </div>
    );
  };

  const emptyChartState = (height: string) => (
    <div className={`${height} flex items-center justify-center`}>
      <p className="text-body text-foreground-500">
        Für diesen Zeitraum liegen noch nicht genügend Einträge für eine Darstellung vor.
      </p>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 xl:pb-0" style={{ background: "#F3F6F4" }}>
        {/* Hero */}
        <div className="px-4 pt-10 pb-8 sm:px-6 lg:px-8 mb-2">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-1 text-center text-h4 sm:text-h3 font-medium" style={{ color: "#243B2E" }}>
              Was zeigen deine Einträge?
            </h1>
            <p className="text-center text-[13px]" style={{ color: "#6F7F75" }}>
              Muster in deinen selbst erfassten Daten — übersichtlich dargestellt.
            </p>
          </div>
        </div>

        {/* Filter und Grafik (Mobile/Tablet) – zentriert */}
        <div className="mx-auto max-w-4xl px-4 pt-4 pb-6 sm:px-6 lg:px-8">

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
                    className={`rounded-full border px-4 py-2 text-body-small font-medium transition-colors ${
                      isActive
                        ? "border-[#6FB48F]/50 bg-[#EAF4EE] text-[#243B2E]"
                        : "border-[#E3EAE6] bg-white text-foreground-700 hover:bg-background-25"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Signal-Auswahl */}
          <div className="relative z-20 mb-8" ref={signalDropdownRef}>
            <label className="mb-2 block text-[13px] text-foreground-400">
              Was möchtest du mit deinen Anfällen vergleichen?
            </label>
            <button
              type="button"
              onClick={() => setSignalDropdownOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left transition-all duration-150 ${
                signalDropdownOpen
                  ? "border-[#E3EAE6] shadow-sm ring-1 ring-[#E3EAE6]"
                  : "border-[#E3EAE6] hover:border-[#E3EAE6]"
              }`}
            >
              <span className={selectedSignal ? "text-body text-foreground-900" : "text-body text-foreground-400"}>
                {selectedSignal
                  ? availableSignalsInRange.find((s) => s.id === selectedSignal)?.label || "Bitte auswählen"
                  : "Bitte auswählen"}
              </span>
              <svg
                className={`h-4 w-4 flex-shrink-0 text-foreground-400 transition-transform duration-200 ${signalDropdownOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {signalDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#E3EAE6] bg-white py-1.5 shadow-md shadow-foreground-900/[0.04] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setSelectedSignal(""); setSignalDropdownOpen(false); }}
                  className={`flex w-full items-center px-4 py-2.5 text-left text-body transition-colors ${
                    !selectedSignal ? "bg-[#F3F7F5] text-foreground-700 font-medium" : "text-foreground-500 hover:bg-[#F7FBF9]"
                  }`}
                >
                  Auswahl zurücksetzen
                </button>
                {availableSignalsInRange.map((signal) => {
                  const isActive = selectedSignal === signal.id;
                  return (
                    <button
                      key={signal.id}
                      type="button"
                      onClick={() => { setSelectedSignal(signal.id); setSignalDropdownOpen(false); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-body transition-colors ${
                        isActive ? "bg-[#EAF4EE]/60 text-[#243B2E] font-medium" : "text-foreground-800 hover:bg-[#F5F7F6]"
                      }`}
                    >
                      <span>{signal.label}</span>
                      {isActive && (
                        <svg className="h-4 w-4 flex-shrink-0 text-[#5FAF87]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MOBILE / TABLET VIEW */}
          {(isMobile || isTablet) && selectedSignal && (
            <div ref={chartContainerRef}>
              {hasChartData ? (
                <div className="mb-6 rounded-2xl border border-[#E3EAE6] bg-white p-6">
                  <p className="mb-2 text-[10px] text-foreground-300">Visuelle Zusammenfassung deiner Einträge</p>
                  <div className="mb-3">{contextChips()}</div>
                  <div className={isMobile ? "overflow-x-auto" : undefined}>
                    <div className={`relative ${isMobile ? "h-48 min-w-[600px]" : "h-48 w-full overflow-hidden"} ${showMonthAxis ? "pb-6" : ""}`}>
                      <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                        {chartSvgContent(isMobile ? "areaGradientM" : "areaGradientT")}
                      </svg>
                      {monthAxisOverlay}
                    </div>
                  </div>
                  <div className="mt-3">{chartLegend}</div>
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-[#E3EAE6] bg-white p-6">
                  {emptyChartState("h-48")}
                </div>
              )}
              {insightBanner}
            </div>
          )}

          {!selectedSignal && (
            <div className="rounded-2xl bg-[#F7FBF9] px-6 py-10 text-center">
              <p className="text-body text-foreground-600">
                Wähle oben ein Symptom, um deine Einträge visuell darzustellen.
              </p>
              <p className="mt-2 text-[12px] text-foreground-300">
                Die Darstellung zeigt deine selbst erfassten Daten im Zeitverlauf.
              </p>
            </div>
          )}
        </div>

        {/* Desktop: Grafik über gesamte Bildschirmbreite */}
        {isDesktop && selectedSignal && (
          <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
            <div ref={chartContainerRef}>
              {hasChartData ? (
                <div className="rounded-none border-y border-[#E3EAE6] bg-white p-8 lg:px-10">
                  <p className="mb-2 text-[10px] text-foreground-300">Visuelle Zusammenfassung deiner Einträge</p>
                  <div className="mb-4">{contextChips("lg")}</div>
                  <div className={`relative h-80 w-full overflow-hidden ${showMonthAxis ? "pb-6" : ""}`}>
                    <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                      {chartSvgContent("areaGradientD", true)}
                    </svg>
                    {monthAxisOverlay}
                  </div>
                  <div className="mt-4">{chartLegend}</div>
                </div>
              ) : (
                <div className="rounded-none border-y border-[#E3EAE6] bg-white p-8">
                  {emptyChartState("h-80")}
                </div>
              )}
            </div>
            <div className="mx-auto max-w-4xl">{insightBanner}</div>
          </div>
        )}

        {/* PDF-Exporte – kompakt, sekundär */}
        <div className="mx-auto max-w-4xl px-4 pt-1 pb-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-foreground-300 mr-0.5">Export:</span>
            <button
              type="button"
              onClick={handleExportSeizureSummaryPdf}
              disabled={isExportingSeizurePdf}
              className="rounded-md border border-foreground-200/60 px-2.5 py-1 text-[11px] text-foreground-400 transition-colors hover:bg-[#F7FBF9] hover:text-foreground-600 disabled:opacity-50"
            >
              {isExportingSeizurePdf ? "Exportiere…" : "Anfälle (PDF)"}
            </button>
            {availableSignalsInRange.length > 0 && timeRange !== "7d" && (
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="rounded-md border border-foreground-200/60 px-2.5 py-1 text-[11px] text-foreground-400 transition-colors hover:bg-[#F7FBF9] hover:text-foreground-600 disabled:opacity-50"
              >
                {isExportingPdf ? "Exportiere…" : "Verlaufskurven (PDF)"}
              </button>
            )}
            {availableSignalsInRange.length > 0 && timeRange === "7d" && (
              <span className="text-[10px] text-foreground-300">ab 30 Tagen verfügbar</span>
            )}
          </div>
        </div>

        {/* Datenschutz-Footer */}
        <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground-300">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Deine Daten werden verschlüsselt verarbeitet und nicht zu Werbezwecken weitergegeben.</span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
