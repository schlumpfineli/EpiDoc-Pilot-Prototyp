"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { format, parseISO, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";

interface ChartDataPoint {
  date: string;
  seizures?: number;
  wellBeing?: number | null;
  medication?: number | null;
}

interface Medication {
  id: number;
  name: string;
  dose: string;
}

interface CombinedChartProps {
  data: ChartDataPoint[];
  range: "7d" | "1m" | "6m" | "1y";
  height?: number;
  onBarClick?: (date: string) => void;
  seizureDetails?: Record<string, { time: string; type: string; note?: string }[]>;
  selectedMedication?: Medication;
  medicationEntries?: Array<{
    id: number;
    name: string;
    dose: string;
    startDate: Date;
    endDate: Date;
    archived: boolean;
  }>;
}

// Farbpalette für Medikamente
const MEDICATION_COLORS = [
  "#EF4444", // rot
  "#3B82F6", // blau
  "#10B981", // grün
  "#F59E0B", // orange
  "#8B5CF6", // violett
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange-rot
  "#6366F1", // indigo
];

export default function CombinedChart({
  data,
  range,
  height = 600,
  onBarClick,
  seizureDetails,
  selectedMedication,
  medicationEntries = [],
}: CombinedChartProps) {
  const isLongRange = range === "6m" || range === "1y";

  // Prüfe, ob Befinden-Daten vorhanden sind (dann sollen Y-Achsen-Labels angezeigt werden)
  const hasWellBeingData = useMemo(() => {
    return data.some((item) => item.wellBeing !== null && item.wellBeing !== undefined);
  }, [data]);

  // Prüfe, ob Medikamenten-Daten vorhanden sind (analog zu hasWellBeingData)
  const hasMedicationData = useMemo(() => {
    // Wenn kein Medikament ausgewählt ist, gibt es keine Medikamenten-Daten
    if (!selectedMedication) {
      return false;
    }
    // Prüfe, ob tatsächlich Daten vorhanden sind
    const hasData = data.some((item) => item.medication !== null && item.medication !== undefined);
    return hasData;
  }, [data, selectedMedication]);

  // Berechne Maximum für Medikamenten-Dosierung (verwende Standard-Dosierungen: 200, 500, 1000, 1500, 2000)
  const maxMedicationDosage = useMemo(() => {
    if (!hasMedicationData) return 2000; // Fallback
    const allDosages = data
      .map((item) => item.medication)
      .filter((dosage): dosage is number => dosage !== null && dosage !== undefined);
    if (allDosages.length === 0) return 2000;
    const max = Math.max(...allDosages);
    
    console.log("maxMedicationDosage: allDosages =", allDosages);
    console.log("maxMedicationDosage: max =", max);
    
    // Spezialbehandlung für genau 1000: stelle sicher, dass die Domain groß genug ist
    if (max === 1000) {
      // Für genau 1000: Domain sollte mindestens 1200 sein (20% Puffer), damit die Linie nicht am Rand klebt
      console.log("maxMedicationDosage: max === 1000, return 1200");
      return 1200;
    }
    
    // Spezialbehandlung für genau 2000: stelle sicher, dass die Domain groß genug ist
    if (max === 2000) {
      // Für genau 2000: Domain sollte mindestens 2400 sein (20% Puffer), damit die Linie nicht am Rand klebt
      console.log("maxMedicationDosage: max === 2000, return 2400");
      return 2400;
    }
    
    // Wenn max > 2000, stelle sicher, dass die Domain mindestens max + 20% Puffer hat
    if (max > 2000) {
      const result = Math.ceil(max * 1.2);
      console.log("maxMedicationDosage: max > 2000, return", result);
      return result;
    }
    
    // Wenn max > 1000 und < 2000, stelle sicher, dass die Domain mindestens max + 20% Puffer hat
    if (max > 1000 && max < 2000) {
      const result = Math.ceil(max * 1.2);
      console.log("maxMedicationDosage: max > 1000 && < 2000, return", result);
      return result;
    }
    
    // Für kleinere Werte: runde auf die nächste Standard-Dosierung auf
    if (max <= 200) return 200;
    if (max <= 500) return 500;
    if (max <= 1500) return 1500;
    
    return 2000; // Fallback
  }, [data, hasMedicationData]);

  // Berechne dynamisches Maximum für Skalierung
  const maxSeizureValue = useMemo(() => {
    const seizureValues = data
      .map((item) => item.seizures || 0)
      .filter((val) => val > 0);
    if (seizureValues.length === 0) return 5; // Fallback auf 5
    const max = Math.max(...seizureValues);
    // Runde auf nächste passende Zahl (z.B. 3.2 -> 4, 7.8 -> 8, 12.3 -> 15)
    return Math.ceil(max * 1.1); // 10% Puffer oben
  }, [data]);

  // Formatiere die Daten für Recharts
  const chartData = useMemo(() => {
    const result = data.map((item) => {
      // Dynamische Skalierung: max Wert = 10 auf Y-Achse (immer für Anfälle, unabhängig von Medikamenten)
      const scaledSeizures = item.seizures 
        ? Math.min((item.seizures / maxSeizureValue) * 10, 10)
        : 0;
      const date = parseISO(item.date);
      
      return {
        date: item.date,
        dateFormatted: format(date, "dd.MM.", { locale: de }),
        weekNumber: range === "6m" ? getISOWeek(date) : null,
        seizures: scaledSeizures,
        wellBeing: item.wellBeing ?? null,
        medication: item.medication ?? null,
        // Für Tooltip - original Wert
        seizureCount: item.seizures || 0,
        wellBeingValue: item.wellBeing,
        medicationValue: item.medication,
      };
    });
    
    // Debug: Logge Medikamenten-Daten
    if (hasMedicationData) {
      console.log("chartData: medication values =", result.map(d => ({ date: d.date, medication: d.medication })).filter(d => d.medication !== null));
    }
    
    return result;
  }, [data, range, maxSeizureValue, hasMedicationData]);


  // Custom Dot für die Linienpunkte
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.wellBeing === null || payload.wellBeing === undefined) return null;
    return <Dot cx={cx} cy={cy} r={4} fill="#14B8A6" stroke="#fff" strokeWidth={2} />;
  };

  // Format für X-Achse
  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    if (range === "7d") {
      return format(date, "EEE", { locale: de });
    } else if (range === "1m") {
      return format(date, "dd.MM.", { locale: de });
    } else if (range === "6m") {
      return `KW ${getISOWeek(date)}`; // Kalenderwoche für 6 Monate
    } else {
      return format(date, "MMM yyyy", { locale: de }); // Monate für 1 Jahr
    }
  };

  // Angepasste Werte für 7 Tage
  const is7Days = range === "7d";
  const minWidth = is7Days 
    ? undefined  // Keine minWidth für 7 Tage, damit es sich anpasst
    : Math.max(chartData.length * 50, 700);  // Normale Werte für andere Zeiträume

  // Prüfe, ob Medikamente vorhanden sind (für Legende)
  const hasMedications = hasMedicationData;

  return (
    <div style={{ width: "100%", height: `${height}px`, minWidth: minWidth ? `${minWidth}px` : "0", minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={height}>
        <ComposedChart
          data={chartData}
          margin={{ 
            top: 5, 
            right: (hasWellBeingData || hasMedicationData) ? 10 : 5, 
            left: 5, 
            bottom: 5 
          }}
          barCategoryGap={is7Days ? "10%" : "20%"}  // Weniger Abstand zwischen Balken für 7 Tage
          onMouseMove={undefined}
          onMouseLeave={undefined}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke="#cbd5e1"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12, fill: "#64748b" }}
            interval={isLongRange ? "preserveStartEnd" : 0}
            angle={isLongRange ? -45 : 0}
            textAnchor={isLongRange ? "end" : "middle"}
            height={isLongRange ? 60 : 30}
          />
          {/* Y-Achse für Anfälle (Standard, keine yAxisId) - immer vorhanden, aber unsichtbar wenn andere Y-Achsen da sind */}
          <YAxis
            domain={[0, 10]}
            ticks={[]}
            tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
            width={0}
            hide={hasWellBeingData || hasMedicationData}
          />
          {/* Y-Achse für Medikamente (rechts) - nur wenn Medikament ausgewählt ist */}
          {hasMedicationData && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, maxMedicationDosage]}
              ticks={(() => {
                // Hole alle tatsächlichen Dosierungen aus den Daten
                const allDosages = data
                  .map((item) => item.medication)
                  .filter((dosage): dosage is number => dosage !== null && dosage !== undefined);
                
                if (allDosages.length === 0) {
                  // Fallback: Standard-Ticks wenn keine Daten
                  return [0, 200, 500, 1000, 1500, 2000];
                }
                
                // Verwende nur die tatsächlich verwendeten Dosierungen
                const uniqueDosages = Array.from(new Set(allDosages)).sort((a, b) => a - b);
                
                // Füge 0 immer hinzu (als Basis)
                const ticks = [0, ...uniqueDosages];
                
                // Entferne Duplikate und sortiere
                return [...new Set(ticks)].sort((a, b) => a - b);
              })()}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              width={50}
              label={{ value: 'Dosierung', angle: 90, position: 'insideRight' }}
            />
          )}
          {/* Y-Achse für Befinden (rechts) - nur wenn Symptom ausgewählt ist und kein Medikament ausgewählt */}
          {hasWellBeingData && !hasMedicationData && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              width={40}
              label={{ value: 'Befinden (0-10)', angle: 90, position: 'insideRight' }}
            />
          )}
          {/* Balken für Anfälle (hintergrund, halbtransparent) - immer auf Standard-Skala 0-10, keine yAxisId */}
          <Bar
            dataKey="seizures"
            fill="rgba(79,70,229,0.25)"
            stroke="rgba(79,70,229,0.6)"
            strokeWidth={1}
            radius={[2, 2, 0, 0]}
            barSize={is7Days ? 30 : undefined}  // Feste Balkenbreite für 7 Tage (kleiner)
            onClick={(data) => {
              if (!isLongRange && onBarClick && data.payload.date) {
                onBarClick(data.payload.date);
              }
            }}
            style={!isLongRange ? { cursor: "pointer" } : {}}
          />
          {/* Linie für Befinden (vordergrund, über die Balken) - nur wenn Daten vorhanden und kein Medikament ausgewählt */}
          {!hasMedicationData && data.some((d) => d.wellBeing !== null && d.wellBeing !== undefined) && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="wellBeing"
              stroke="#14B8A6"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={false}
              connectNulls={false}
            />
          )}
          {/* Linie für Medikament - zeige Dosierungsänderungen durch Dots an Übergangspunkten */}
          {hasMedicationData && selectedMedication && (
            <>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="medication"
                stroke="#22C55E"
                strokeWidth={2}
                dot={(props: any) => {
                  // Zeige Dot an Übergangspunkten (wo sich die Dosierung ändert) und am Starttag
                  const { payload, cx, cy } = props;
                  if (!payload || payload.medication === null || payload.medication === undefined) return null;
                  
                  const currentIndex = chartData.findIndex((d: any) => d.date === payload.date);
                  if (currentIndex === -1) return null;
                  
                  const nextData = currentIndex < chartData.length - 1 ? chartData[currentIndex + 1] : null;
                  const prevData = currentIndex > 0 ? chartData[currentIndex - 1] : null;
                  
                  // Prüfe, ob dies ein Starttag ist (erster Tag mit Dosierung)
                  const isStartDay = prevData === null || prevData.medication === null || prevData.medication === undefined;
                  
                  // Prüfe, ob sich die Dosierung ändert
                  const isTransition = 
                    (prevData && prevData.medication !== null && prevData.medication !== payload.medication) ||
                    (nextData && nextData.medication !== null && nextData.medication !== payload.medication);
                  
                  // Dot anzeigen am Starttag oder bei Dosierungsänderung
                  if (isStartDay || isTransition) {
                    return <Dot cx={cx} cy={cy} r={5} fill="#22C55E" stroke="#fff" strokeWidth={2} />;
                  }
                  return null;
                }}
                activeDot={false}
                connectNulls={false}
                name={selectedMedication.name}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

