"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, subDays, subMonths, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { seizureApi, befindenApi, Befinden, Seizure } from "@/lib/api";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";
import { toastService } from "@/components/ui";

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

export default function VerlaufPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedSignal, setSelectedSignal] = useState<string>("");
  const [seizures, setSeizures] = useState<Seizure[]>([]);
  const [befindenData, setBefindenData] = useState<Befinden[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingSeizurePdf, setIsExportingSeizurePdf] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
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
        {/* Titel, Filter und Grafik (Mobile/Tablet) – zentriert */}
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

          {/* Signal-Auswahl – relative z-10 damit Dropdown nicht von Grafik überdeckt wird */}
          <div className="relative z-10 mb-8">
            <label className="mb-2 block text-body-small font-medium text-foreground-700">
              Vergleiche Anfälle mit:
            </label>
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              className="w-full rounded-lg border border-background-200 bg-white px-4 py-2.5 text-body text-foreground-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div ref={chartContainerRef}>
              {/* Horizontal scrollbare Visualisierung */}
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className="overflow-x-auto">
                    <div className={`relative h-48 min-w-[600px] ${(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 ? "pb-6" : ""}`}>
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

                      {/* X-Achse: 7d/30d ohne Datum; 6m/1y dünne Linie + Monats-Markierungen */}
                      {(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 && (
                        <div className="absolute bottom-0 left-3 right-3 h-4 pt-px">
                          <div className="h-px w-full bg-foreground-300" />
                          {monthTicks.map((t) => (
                            <div
                              key={`${t.label}-${t.position}`}
                              className={`absolute top-0 ${t.position <= 0 ? "translate-x-0" : t.position >= 100 ? "-translate-x-full" : "-translate-x-1/2"}`}
                              style={{ left: `${t.position}%` }}
                            >
                              <div className="w-px h-1 bg-foreground-400" />
                              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-foreground-400 whitespace-nowrap leading-none" style={{ fontSize: "9px" }}>
                                {t.label}
                              </span>
                            </div>
                          ))}
                          <div className="absolute top-0 right-0 w-px h-1 bg-foreground-400" aria-hidden />
                        </div>
                      )}
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
            </div>
          )}

          {/* TABLET VIEW: Vereinfachte Visualisierung */}
          {isTablet && selectedSignal && (
            <div ref={chartContainerRef}>
              {/* Vereinfachte Visualisierung */}
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="mb-6 rounded-lg border border-background-200 bg-background-10 p-4">
                  <div className={`relative h-48 w-full overflow-hidden ${(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 ? "pb-6" : ""}`}>
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

                    {/* X-Achse: 7d/30d ohne Datum; 6m/1y dünne Linie + Monats-Markierungen */}
                    {(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 && (
                      <div className="absolute bottom-0 left-3 right-3 h-4 pt-px">
                        <div className="h-px w-full bg-foreground-300" />
                        {monthTicks.map((t) => (
                          <div
                            key={`${t.label}-${t.position}`}
                            className={`absolute top-0 ${t.position <= 0 ? "translate-x-0" : t.position >= 100 ? "-translate-x-full" : "-translate-x-1/2"}`}
                            style={{ left: `${t.position}%` }}
                          >
                            <div className="w-px h-1 bg-foreground-400" />
                            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-foreground-400 whitespace-nowrap leading-none" style={{ fontSize: "9px" }}>
                              {t.label}
                            </span>
                          </div>
                        ))}
                        <div className="absolute top-0 right-0 w-px h-1 bg-foreground-400" aria-hidden />
                      </div>
                    )}
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
            </div>
          )}

          {!selectedSignal && (
            <div className="rounded-lg border border-background-200 bg-background-10 p-4 text-center">
              <p className="text-body text-foreground-600">
                Wähle ein Signal aus, um mögliche Zusammenhänge zu erkennen.
              </p>
            </div>
          )}
        </div>

        {/* Desktop: Grafik über gesamte Bildschirmbreite */}
        {isDesktop && selectedSignal && (
          <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
            <div ref={chartContainerRef}>
              {signalPoints.length > 0 || seizuresInRange.length > 0 ? (
                <div className="rounded-none border-y border-background-200 bg-background-10 p-6 lg:px-8">
                  <div className={`relative h-80 w-full overflow-hidden ${(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 ? "pb-6" : ""}`}>
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 1000 200"
                      preserveAspectRatio="none"
                    >
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
                    {(timeRange === "6m" || timeRange === "1y") && monthTicks.length > 0 && (
                      <div className="absolute bottom-0 left-3 right-3 h-4 pt-px">
                        <div className="h-px w-full bg-foreground-300" />
                        {monthTicks.map((t) => (
                          <div
                            key={`${t.label}-${t.position}`}
                            className={`absolute top-0 ${t.position <= 0 ? "translate-x-0" : t.position >= 100 ? "-translate-x-full" : "-translate-x-1/2"}`}
                            style={{ left: `${t.position}%` }}
                          >
                            <div className="w-px h-1 bg-foreground-400" />
                            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-foreground-400 whitespace-nowrap leading-none" style={{ fontSize: "9px" }}>
                              {t.label}
                            </span>
                          </div>
                        ))}
                        <div className="absolute top-0 right-0 w-px h-1 bg-foreground-400" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-6 text-body-small text-foreground-600">
                    {signalPoints.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-8 rounded bg-accent-500 opacity-80" />
                        <span>{availableSignals.find((s) => s.id === selectedSignal)?.label}</span>
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
                <div className="rounded-none border-y border-background-200 bg-background-10 p-6">
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-body text-foreground-500">
                      Für den ausgewählten Zeitraum sind keine Daten verfügbar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF-Exporte und Rest – zentriert, geringer Abstand zur Grafik */}
        <div className="mx-auto max-w-4xl px-4 pt-1 pb-6 sm:px-6 lg:px-8">
          <div className="mt-2 mb-6 rounded-xl border border-background-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-h5 font-semibold text-foreground-900">
              PDF-Exporte
            </h2>
            <p className="mb-4 text-body-small text-foreground-600">
              Analysen und Zusammenfassungen für den gewählten Zeitraum herunterladen.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleExportSeizureSummaryPdf}
                disabled={isExportingSeizurePdf}
                className="rounded-lg border border-primary-500 bg-primary-50 px-4 py-2 text-body-small font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
              >
                {isExportingSeizurePdf ? "Exportiere…" : "Anfälle als Bericht (PDF)"}
              </button>
              {availableSignalsInRange.length > 0 && timeRange !== "7d" && (
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="rounded-lg border border-primary-500 bg-primary-50 px-4 py-2 text-body-small font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                >
                  {isExportingPdf ? "Exportiere…" : "Verlaufskurven als PDF"}
                </button>
              )}
              {availableSignalsInRange.length > 0 && timeRange === "7d" && (
                <span className="text-body-small text-foreground-500">
                  Analyse-Grafik ab Zeitraum 30 Tage
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
