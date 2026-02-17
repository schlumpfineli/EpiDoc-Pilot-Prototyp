"use client";

import { useState, useEffect, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  addMonths,
  subMonths,
  getDay,
  parseISO,
} from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { seizureApi } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useRoleText } from "@/lib/hooks/useRoleText";

type DiaryEntry = {
  hasSeizure: boolean;
  hasEmergencyMed: boolean;
  seizureCount: number;
  emergencyCount: number;
  seizures: SeizureFormData[]; // Array von Anfall-Daten für mehrere Anfälle pro Tag
};

type SeizureFormData = {
  id?: number; // Backend-ID für Updates
  type: string[];
  customType: string;
  multipleSeizures: string; // "nein" | "ja" | ""
  time: string; // Uhrzeit im Format HH:mm (für einzelne Anfälle)
  timeFrom: string; // Zeitraum von (für mehrere Anfälle)
  timeTo: string; // Zeitraum bis (für mehrere Anfälle)
  feltBefore: string;
  feltSymptoms: string;
  seizureCount: string;
  durationMinutes: string;
  durationSeconds: string;
  afterEffects: string[];
  customAfterEffects: string;
  triggers: string[];
  customTriggers: string;
  emergencyMed: string;
  emergencyMedName: string;
  emergencyMedDose: string;
  video: File | null;
};

const seizureTypes = [
  "Absencen",
  "Myoklonische Anfälle",
  "Fokale Anfälle",
  "Fokale Anfälle mit erhaltenem Bewusstsein",
  "Fokale Anfälle mit beeinträchtigtem Bewusstsein",
  "Fokal-zu-bilateral tonisch-klonische Anfälle",
  "Tonisch-klonische Anfälle",
  "Status epilepticus",
  "Spasmen",
  "Anfälle unbekannten Ursprungs",
];

const afterEffectsOptions = [
  "Erholungszeit: halber Tag",
  "Erholungszeit: ganzer Tag",
  "Erholungszeit: mehr als ein Tag",
  "Kopfschmerzen",
  "Schwindel",
  "Übelkeit",
  "Verwirrtheit",
  "Sprachstörungen",
  "Niedergeschlagenheit",
  "Lähmungserscheinungen",
  "Müdigkeit",
  "Reizbarkeit",
];

const triggerOptions = [
  "Schlafmangel",
  "Stress",
  "Alkohol",
  "Drogen",
  "Flackerndes Licht",
  "Unbekannte Medikamente",
  "Dehydrierung",
  "Gehirnschädigungen",
  "Infektion",
];

// Optionen für Zeitauswahl (Stunde 00–23, Minute alle 5 Min: 00, 05, 10, … 55)
const hourOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const minuteOptions = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
);

/** Minute (00–59) auf nächsten 5-Minuten-Schritt runden für Anzeige */
function roundMinuteToFive(min: string): string {
  const num = parseInt(min, 10) || 0;
  const rounded = Math.round(num / 5) * 5;
  const clamped = Math.min(55, Math.max(0, rounded));
  return String(clamped).padStart(2, "0");
}

const SCROLL_ITEM_HEIGHT = 2; // rem, feste Höhe pro Eintrag für Scroll-Berechnung

/** Scroll-Dropdown: zeigt nur 3 Einträge, Rest beim Scrollen sichtbar. Mittlere Zeile volle Deckkraft, Nachbarn heller. */
function ScrollTimeSelect({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className = "",
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [centerIndex, setCenterIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = options.indexOf(value);

  // Klick außerhalb schließt
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  // Beim Öffnen: gewählten Eintrag zentrieren und centerIndex setzen
  useEffect(() => {
    if (!isOpen || selectedIndex < 0 || !listRef.current) return;
    setCenterIndex(selectedIndex);
    const el = listRef.current.children[selectedIndex] as HTMLElement;
    if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
  }, [isOpen, selectedIndex]);

  // Beim Scrollen: mittlere sichtbare Zeile ermitteln (für Opacity)
  const handleScroll = () => {
    const list = listRef.current;
    if (!list || options.length === 0) return;
    const scrollTop = list.scrollTop;
    const height = list.clientHeight;
    const itemHeightRem = SCROLL_ITEM_HEIGHT;
    const itemHeightPx = itemHeightRem * 16;
    const centerY = scrollTop + height / 2;
    const index = Math.min(
      options.length - 1,
      Math.max(0, Math.round((centerY - itemHeightPx / 2) / itemHeightPx))
    );
    setCenterIndex(index);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`w-full rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 cursor-pointer flex items-center justify-between ${isOpen ? "border-primary-500 ring-2 ring-primary-200" : ""}`}
      >
        <span>{value}</span>
        <svg className={`h-4 w-4 text-foreground-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          onScroll={handleScroll}
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-y-auto rounded-lg border border-background-200 bg-white shadow-lg [scrollbar-width:thin]"
          style={{ maxHeight: "4.5rem" }}
        >
          {options.map((opt, i) => {
            const distanceFromCenter = Math.abs(i - centerIndex);
            const opacity = distanceFromCenter === 0 ? 1 : distanceFromCenter === 1 ? 0.7 : 0.45;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                className="h-8 flex items-center"
                style={{ opacity }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full h-full px-[var(--spacing-s)] text-body text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none transition-opacity ${opt === value ? "bg-primary-100 font-medium text-primary-800" : "text-foreground-800"}`}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DiaryPage() {
  const { t } = useRoleText();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Lade Einträge vom Backend beim Mount
  useEffect(() => {
    loadSeizureData();
  }, []);

  const loadSeizureData = async () => {
    try {
      setIsLoading(true);
      const response = await seizureApi.getAll();
      
      // Konvertiere Backend-Daten in das lokale Format
      const loadedEntries: Record<string, DiaryEntry> = {};
      
      response.data.forEach((seizure) => {
        const dateStr = format(parseISO(seizure.date), "yyyy-MM-dd");
        
        if (!loadedEntries[dateStr]) {
          loadedEntries[dateStr] = {
            hasSeizure: true,
            hasEmergencyMed: seizure.emergency_med || false,
            seizureCount: seizure.seizure_count || 1,
            emergencyCount: seizure.emergency_med ? 1 : 0,
            seizures: [],
          };
        }
        
        // Konvertiere Seizure zu SeizureFormData
        const seizureTime = format(parseISO(seizure.date), "HH:mm");
        const seizureData: SeizureFormData = {
          id: seizure.id, // Backend-ID speichern für Updates
          type: Array.isArray(seizure.type) ? seizure.type : [],
          customType: seizure.custom_type || "",
          multipleSeizures: (seizure.seizure_count || 1) > 1 ? "ja" : "nein",
          time: seizureTime,
          timeFrom: seizureTime,
          timeTo: seizureTime,
          feltBefore: seizure.felt_before || "",
          feltSymptoms: seizure.felt_symptoms || "",
          seizureCount: String(seizure.seizure_count || 1),
          durationMinutes: seizure.duration_minutes ? String(seizure.duration_minutes) : "",
          durationSeconds: seizure.duration_seconds ? String(seizure.duration_seconds) : "",
          afterEffects: Array.isArray(seizure.after_effects) ? seizure.after_effects : [],
          customAfterEffects: seizure.custom_after_effects || "",
          triggers: Array.isArray(seizure.triggers) ? seizure.triggers : [],
          customTriggers: seizure.custom_triggers || "",
          emergencyMed: seizure.emergency_med ? "ja" : "nein",
          emergencyMedName: seizure.emergency_med_name || "",
          emergencyMedDose: "",
          video: null,
        };
        
        loadedEntries[dateStr].seizures.push(seizureData);
      });
      
      setEntries(loadedEntries);
      
      // Auch in localStorage als Backup speichern
      localStorage.setItem("diary-entries", JSON.stringify(loadedEntries));
    } catch (error: any) {
      console.error("Fehler beim Laden der Seizure-Daten:", error);
      // Fallback: Versuche localStorage zu laden
      const stored = localStorage.getItem("diary-entries");
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch {
          // ignore parse errors
        }
      }
      toastService.show(
        "Fehler beim Laden der Daten. Verwende lokale Daten.",
        "warning"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveSeizureToBackend = async (
    date: string,
    seizureData: SeizureFormData,
    isUpdate: boolean = false
  ) => {
    try {
      setIsSaving(true);
      
      const [hours, minutes] = seizureData.time.split(":").map(Number);
      const seizureDateTime = new Date(date);
      seizureDateTime.setHours(hours, minutes, 0, 0);
      
      const payload = {
        date: format(seizureDateTime, "yyyy-MM-dd"),
        type: seizureData.type.length > 0 ? seizureData.type : undefined,
        custom_type: seizureData.customType || undefined,
        felt_before: seizureData.feltBefore || undefined,
        felt_symptoms: seizureData.feltSymptoms || undefined,
        seizure_count: parseInt(seizureData.seizureCount) || 1,
        duration_minutes: seizureData.durationMinutes ? parseInt(seizureData.durationMinutes) : undefined,
        duration_seconds: seizureData.durationSeconds ? parseInt(seizureData.durationSeconds) : undefined,
        after_effects: seizureData.afterEffects.length > 0 ? seizureData.afterEffects : undefined,
        custom_after_effects: seizureData.customAfterEffects || undefined,
        triggers: seizureData.triggers.length > 0 ? seizureData.triggers : undefined,
        custom_triggers: seizureData.customTriggers || undefined,
        emergency_med: seizureData.emergencyMed === "ja",
        emergency_med_name: seizureData.emergencyMedName || undefined,
        video_path: undefined, // Video-Upload noch nicht implementiert
      };

      if (isUpdate && seizureData.id) {
        // Update bestehenden Eintrag
        await seizureApi.update(seizureData.id, payload);
      } else {
        // Erstelle neuen Eintrag
        await seizureApi.create(payload);
      }
      
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      toastService.show(
        error.message || "Fehler beim Speichern der Daten",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Speichere Einträge in localStorage als Backup
  useEffect(() => {
    if (Object.keys(entries).length > 0) {
      localStorage.setItem("diary-entries", JSON.stringify(entries));
    }
  }, [entries]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isAfterEffectsModalOpen, setIsAfterEffectsModalOpen] = useState(false);
  const [isTriggersModalOpen, setIsTriggersModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingDate, setViewingDate] = useState<Date | null>(null); // Datum, dessen Details angezeigt werden
  const [editingSeizureIndex, setEditingSeizureIndex] = useState<number | null>(null); // Index des zu bearbeitenden Anfalls
  const [typeError, setTypeError] = useState<string>(""); // Fehlermeldung für Typ-Feld
  const typeFieldRef = useRef<HTMLDivElement>(null); // Ref für Typ-Feld-Container (inkl. Fehlermeldung)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const calculateTimeForMultipleSeizures = (selectedDate: Date, existingSeizures: SeizureFormData[]): string => {
    // Wenn es bereits Einträge gibt, verteile die Zeiten gleichmäßig über den Tag
    if (existingSeizures.length > 0) {
      const times = existingSeizures
        .map(s => s.time)
        .filter(t => t && t.trim() !== '')
        .map(t => {
          const [hours, minutes] = t.split(':').map(Number);
          return hours * 60 + minutes; // Minuten seit Mitternacht
        })
        .filter(t => !isNaN(t))
        .sort((a, b) => a - b);
      
      if (times.length > 0) {
        // Finde die größte Lücke zwischen den Zeiten
        let maxGap = 0;
        let bestTime = times[0] - 60; // 1 Stunde vor dem ersten
        
        for (let i = 0; i < times.length; i++) {
          const next = times[i + 1] || (24 * 60); // Ende des Tages
          const gap = next - times[i];
          if (gap > maxGap) {
            maxGap = gap;
            bestTime = times[i] + Math.floor(gap / 2);
          }
        }
        
        // Prüfe auch Lücke zwischen letztem und erstem (über Mitternacht)
        const gapToNextDay = (24 * 60) - times[times.length - 1] + times[0];
        if (gapToNextDay > maxGap) {
          bestTime = (times[times.length - 1] + Math.floor(gapToNextDay / 2)) % (24 * 60);
        }
        
        // Stelle sicher, dass die Zeit im gültigen Bereich liegt
        if (bestTime < 0) bestTime = 0;
        if (bestTime >= 24 * 60) bestTime = (24 * 60) - 1;
        
        const hours = Math.floor(bestTime / 60);
        const minutes = bestTime % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    // Sonst aktuelle Uhrzeit
    return getCurrentTime();
  };

  const [formData, setFormData] = useState<SeizureFormData>({
    type: [],
    customType: "",
    multipleSeizures: "nein",
    time: getCurrentTime(),
    timeFrom: getCurrentTime(),
    timeTo: getCurrentTime(),
    feltBefore: "",
    feltSymptoms: "",
    seizureCount: "1",
    durationMinutes: "",
    durationSeconds: "",
    afterEffects: [],
    customAfterEffects: "",
    triggers: [],
    customTriggers: "",
    emergencyMed: "",
    emergencyMedName: "",
    emergencyMedDose: "",
    video: null,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = getDay(monthStart);
  // Adjust to Monday = 0
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Add empty cells for days before month starts
  const emptyDays = Array.from({ length: adjustedFirstDay }, (_, i) => null);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const monthNavRef = useRef<HTMLButtonElement>(null);
  const handleMonthNavClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = monthNavRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) handlePreviousMonth();
    else if (x > rect.width - third) handleNextMonth();
    else setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const entry = entries[dayKey];
    
    // Wenn der Tag Anfälle hat, zeige die Details-Cards
    if (entry?.hasSeizure && entry?.seizures && entry.seizures.length > 0) {
      setViewingDate(day);
    } else {
      // Sonst öffne das Modal zum Hinzufügen
      const existingSeizures = entry?.seizures || [];
      setSelectedDate(day);
      setEditingSeizureIndex(null); // Neuer Anfall
      setFormData({
        type: [],
        customType: "",
        multipleSeizures: "nein",
        time: calculateTimeForMultipleSeizures(day, existingSeizures),
        timeFrom: calculateTimeForMultipleSeizures(day, existingSeizures),
        timeTo: calculateTimeForMultipleSeizures(day, existingSeizures),
        feltBefore: "",
        feltSymptoms: "",
        seizureCount: "1",
        durationMinutes: "",
        durationSeconds: "",
        afterEffects: [],
        customAfterEffects: "",
        triggers: [],
        customTriggers: "",
        emergencyMed: "",
        emergencyMedName: "",
        emergencyMedDose: "",
        video: null,
      });
      setViewingDate(null);
      setIsModalOpen(true);
    }
  };

  // Hilfsfunktion: Bestimme ob Einzelfall (1-2) oder Serie (3+)
  const isSeizureSeries = (seizures: SeizureFormData[]): boolean => {
    const totalCount = seizures.reduce((sum, s) => sum + parseInt(s.seizureCount || "1", 10), 0);
    return totalCount >= 3;
  };

  // Hilfsfunktion: Erstelle Zeitblöcke für Serien
  const createTimeBlocks = (seizures: SeizureFormData[]) => {
    const blocks = [
      { start: "07:00", end: "12:00", label: "07:00 - 12:00" },
      { start: "12:00", end: "17:00", label: "12:00 - 17:00" },
      { start: "17:00", end: "22:00", label: "17:00 - 22:00" },
      { start: "22:00", end: "07:00", label: "22:00 - 07:00" },
    ];

    return blocks.map(block => {
      // Finde alle Anfälle in diesem Zeitblock
      const blockSeizures = seizures.filter(seizure => {
        if (!seizure.time) return false;
        const [hours, minutes] = seizure.time.split(':').map(Number);
        const seizureMinutes = hours * 60 + minutes;
        
        if (block.start === "22:00") {
          // Nachtblock: 22:00 - 07:00 (nächster Tag)
          const blockStart = 22 * 60; // 22:00
          const blockEnd = 7 * 60; // 07:00
          return seizureMinutes >= blockStart || seizureMinutes < blockEnd;
        } else {
          const [blockStartH, blockStartM] = block.start.split(':').map(Number);
          const [blockEndH, blockEndM] = block.end.split(':').map(Number);
          const blockStartMinutes = blockStartH * 60 + blockStartM;
          const blockEndMinutes = blockEndH * 60 + blockEndM;
          return seizureMinutes >= blockStartMinutes && seizureMinutes < blockEndMinutes;
        }
      });

      // Sammle alle Anfalltypen
      const types = new Set<string>();
      blockSeizures.forEach(s => {
        const seizureTypes = Array.isArray(s.type) ? s.type : [];
        seizureTypes.forEach(t => types.add(t));
        if (s.customType) types.add(s.customType);
      });

      // Prüfe Notfallmedikament
      const hasEmergencyMed = blockSeizures.some(s => s.emergencyMed === "yes" || s.emergencyMed === "ja");

      // Anzahl der Anfälle
      const count = blockSeizures.reduce((sum, s) => sum + parseInt(s.seizureCount || "1", 10), 0);

      return {
        ...block,
        seizures: blockSeizures,
        types: Array.from(types),
        hasEmergencyMed,
        count,
      };
    });
  };

  // Funktion zum Löschen eines einzelnen Anfalls
  const handleDeleteSeizure = async (seizureId: number | undefined, date: Date) => {
    if (!seizureId) return;
    
    try {
      await seizureApi.delete(seizureId);
      
      // Entferne den Anfall aus den Einträgen
      const dayKey = format(date, "yyyy-MM-dd");
      setEntries((prev) => {
        const updated = { ...prev };
        if (updated[dayKey]) {
          updated[dayKey].seizures = updated[dayKey].seizures.filter(s => s.id !== seizureId);
          
          // Wenn keine Anfälle mehr vorhanden, entferne den Tag
          if (updated[dayKey].seizures.length === 0) {
            delete updated[dayKey];
            setViewingDate(null);
          } else {
            // Aktualisiere Statistiken
            updated[dayKey].hasSeizure = updated[dayKey].seizures.length > 0;
            updated[dayKey].seizureCount = updated[dayKey].seizures.reduce(
              (sum, s) => sum + parseInt(s.seizureCount || "1", 10),
              0
            );
            updated[dayKey].hasEmergencyMed = updated[dayKey].seizures.some(
              s => s.emergencyMed === "yes" || s.emergencyMed === "ja"
            );
          }
        }
        return updated;
      });
      
      toastService.show("Anfall erfolgreich gelöscht", "success");
      
      // Lade Daten neu, um sicherzustellen, dass alles synchron ist
      await loadSeizureData();
    } catch (error: any) {
      console.error("Fehler beim Löschen:", error);
      toastService.show(
        error.message || "Fehler beim Löschen des Anfalls",
        "error"
      );
    }
  };

  // Calculate monthly statistics
  const monthlyStats = (() => {
    const monthEntries = Object.entries(entries).filter(([key]) => {
      const entryDate = new Date(key);
      return (
        entryDate.getMonth() === currentDate.getMonth() &&
        entryDate.getFullYear() === currentDate.getFullYear()
      );
    });

    const totalSeizures = monthEntries.reduce((sum, [_, entry]) => sum + (entry.seizureCount || 0), 0);
    const totalEmergencyMeds = monthEntries.reduce((sum, [_, entry]) => sum + (entry.emergencyCount || 0), 0);
    const emergencyDates = monthEntries
      .filter(([_, entry]) => (entry.emergencyCount || 0) > 0)
      .map(([key]) => key);

    return {
      totalSeizures,
      totalEmergencyMeds,
      emergencyDates,
    };
  })();

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setEditingSeizureIndex(null);
    setTypeError("");
    setFormData({
      type: [],
      customType: "",
      multipleSeizures: "nein",
      time: getCurrentTime(),
      timeFrom: getCurrentTime(),
      timeTo: getCurrentTime(),
      feltBefore: "",
      feltSymptoms: "",
      seizureCount: "1",
      durationMinutes: "",
      durationSeconds: "",
      afterEffects: [],
      customAfterEffects: "",
      triggers: [],
      customTriggers: "",
      emergencyMed: "",
      emergencyMedName: "",
      emergencyMedDose: "",
      video: null,
    });
  };

  const handleAddNewSeizure = (date: Date) => {
    const dayKey = format(date, "yyyy-MM-dd");
    // Verwende einen Callback, um die neuesten entries zu bekommen
    setEntries((prevEntries) => {
      const existingEntry = prevEntries[dayKey];
      const existingSeizures = existingEntry?.seizures || [];
      
      setSelectedDate(date);
      setEditingSeizureIndex(null);
      setFormData({
        type: [],
        customType: "",
        multipleSeizures: "nein",
        time: calculateTimeForMultipleSeizures(date, existingSeizures),
        timeFrom: calculateTimeForMultipleSeizures(date, existingSeizures),
        timeTo: calculateTimeForMultipleSeizures(date, existingSeizures),
        feltBefore: "",
        feltSymptoms: "",
        seizureCount: "1",
        durationMinutes: "",
        durationSeconds: "",
        afterEffects: [],
        customAfterEffects: "",
        triggers: [],
        customTriggers: "",
        emergencyMed: "",
        emergencyMedName: "",
        emergencyMedDose: "",
        video: null,
      });
      setViewingDate(null);
      setIsModalOpen(true);
      
      return prevEntries; // Keine Änderung, nur um auf State zuzugreifen
    });
  };

  const handleEditSeizure = (date: Date, index: number) => {
    const dayKey = format(date, "yyyy-MM-dd");
    const entry = entries[dayKey];
    if (entry?.seizures && entry.seizures[index]) {
      const seizureData = entry.seizures[index];
      setSelectedDate(date);
      setEditingSeizureIndex(index);
      setFormData({
        ...seizureData,
        multipleSeizures: seizureData.multipleSeizures || ((parseInt(seizureData.seizureCount || "1", 10) > 1) ? "ja" : "nein"),
        timeFrom: seizureData.timeFrom || seizureData.time || getCurrentTime(),
        timeTo: seizureData.timeTo || seizureData.time || getCurrentTime(),
        type: Array.isArray(seizureData.type) ? seizureData.type : [],
        afterEffects: Array.isArray(seizureData.afterEffects) ? seizureData.afterEffects : [],
        triggers: Array.isArray(seizureData.triggers) ? seizureData.triggers : [],
        emergencyMed: seizureData.emergencyMed === "yes" ? "ja" : (seizureData.emergencyMed === "no" ? "nein" : seizureData.emergencyMed || ""),
      });
      setViewingDate(null);
      setIsModalOpen(true);
    }
  };

  const handleDeleteDay = async (date: Date) => {
    const deleteDayKey = format(date, "yyyy-MM-dd");
    const entry = entries[deleteDayKey];
    
    if (!entry?.seizures || entry.seizures.length === 0) {
      return;
    }
    
    // Lösche alle Anfälle des Tages im Backend
    const deletePromises = entry.seizures
      .filter(seizure => seizure.id)
      .map(seizure => seizureApi.delete(seizure.id!));
    
    try {
      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error("Fehler beim Löschen:", error);
      toastService.show(
        error.message || "Fehler beim Löschen der Anfälle",
        "error"
      );
      return; // Stoppe, wenn Backend-Löschen fehlschlägt
    }
    
    // Entferne den Tag aus den Einträgen
    setEntries((prev) => {
      const updated = { ...prev };
      delete updated[deleteDayKey];
      return updated;
    });
    
    // Schließe die Detail-Ansicht
    setViewingDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    // Validierung: Mindestens Anfallstyp aus Liste oder eigener Typ
    const hasTypeSelected = Array.isArray(formData.type) && formData.type.length > 0;
    const hasCustomType = formData.customType.trim() !== "";

    if (!hasTypeSelected && !hasCustomType) {
      setTypeError(t("Bitte wähle einen Anfallstyp aus der Liste oder gib einen eigenen Typ ein."));
      setTimeout(() => {
        typeFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstInput = typeFieldRef.current?.querySelector("input");
        firstInput?.focus();
      }, 100);
      return;
    }
    setTypeError("");

    const dayKey = format(selectedDate, "yyyy-MM-dd");
    const hasSeizure = (Array.isArray(formData.type) && formData.type.length > 0) || formData.customType !== "";
    const hasEmergencyMed = formData.emergencyMed === "ja" && formData.emergencyMedName !== "";

    // Bestimme, ob Update oder Create
    const existingEntry = entries[dayKey];
    const existingSeizures = existingEntry?.seizures || [];
    const isUpdate = editingSeizureIndex !== null && editingSeizureIndex >= 0 && editingSeizureIndex < existingSeizures.length;
    
    let updatedSeizures: SeizureFormData[];
    let seizuresToSave: SeizureFormData[] = [];
    
    if (isUpdate) {
      // Bearbeite bestehenden Anfall
      const existingSeizure = existingSeizures[editingSeizureIndex!];
      updatedSeizures = [...existingSeizures];
      // Behalte die ID beim Update
      updatedSeizures[editingSeizureIndex!] = { ...formData, id: existingSeizure.id };
      
      // Speichere im Backend (Update) - außerhalb von setEntries
      seizuresToSave = [{ ...formData, id: existingSeizure.id }];
    } else {
      // Füge neue Anfälle hinzu
      const newSeizures: SeizureFormData[] = [];
      
      if (formData.multipleSeizures === "ja") {
        // Mehrere Anfälle: Verteile über Zeitraum von/bis
        const seizureCount = Math.max(1, Number.parseInt(formData.seizureCount || "1", 10));
        const [fromHours, fromMinutes] = (formData.timeFrom || getCurrentTime()).split(':').map(Number);
        const [toHours, toMinutes] = (formData.timeTo || getCurrentTime()).split(':').map(Number);
        const fromTimeInMinutes = fromHours * 60 + fromMinutes;
        const toTimeInMinutes = toHours * 60 + toMinutes;
        
        // Berechne Zeitabstände
        let timeSpan = toTimeInMinutes - fromTimeInMinutes;
        if (timeSpan < 0) {
          // Zeitraum überschreitet Mitternacht
          timeSpan = (24 * 60) - fromTimeInMinutes + toTimeInMinutes;
        }
        
        const interval = seizureCount > 1 ? Math.floor(timeSpan / (seizureCount - 1)) : 0;
        
        for (let i = 0; i < seizureCount; i++) {
          let seizureTimeInMinutes = fromTimeInMinutes + (i * interval);
          if (seizureTimeInMinutes >= 24 * 60) {
            seizureTimeInMinutes = seizureTimeInMinutes % (24 * 60);
          }
          
          const hours = Math.floor(seizureTimeInMinutes / 60);
          const minutes = seizureTimeInMinutes % 60;
          const calculatedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          const seizureData = {
            ...formData,
            time: calculatedTime,
            seizureCount: "1", // Jeder Eintrag repräsentiert einen Anfall
            multipleSeizures: "ja",
          };
          
          // Notfallmedikament nur beim ersten Anfall
          if (i > 0) {
            seizureData.emergencyMed = "";
            seizureData.emergencyMedName = "";
            seizureData.emergencyMedDose = "";
          }
          
          newSeizures.push(seizureData);
        }
      } else {
        // Einzelner Anfall: Verwende time und Dauer
        const seizureData = {
          ...formData,
          time: formData.time || getCurrentTime(),
          seizureCount: "1",
          multipleSeizures: "nein",
        };
        newSeizures.push(seizureData);
      }
      
      // Sortiere nach Zeit (chronologisch)
      newSeizures.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });
      
      updatedSeizures = [...existingSeizures, ...newSeizures];
      seizuresToSave = newSeizures;
    }
    
    // Aktualisiere den State
    setEntries((prev) => {
      // Berechne neue Statistiken basierend auf allen Anfällen
      // Jeder Eintrag repräsentiert jetzt einen Anfall (seizureCount ist immer "1" pro Eintrag)
      const totalSeizureCount = updatedSeizures.length;
      
      // Notfallmedikament: Zähle nur, ob an diesem Tag überhaupt eines eingenommen wurde (0 oder 1)
      const totalEmergencyCount = updatedSeizures.some(
        (s) => s.emergencyMed === "ja" && s.emergencyMedName !== ""
      ) ? 1 : 0;
      
      return {
        ...prev,
        [dayKey]: {
          hasSeizure: updatedSeizures.length > 0,
          hasEmergencyMed: totalEmergencyCount > 0,
          seizureCount: totalSeizureCount,
          emergencyCount: totalEmergencyCount,
          seizures: updatedSeizures,
        },
      };
    });

    // Speichere im Backend - außerhalb von setEntries
    try {
      if (isUpdate && seizuresToSave.length > 0) {
        await saveSeizureToBackend(dayKey, seizuresToSave[0], true);
      } else {
        for (const seizure of seizuresToSave) {
          await saveSeizureToBackend(dayKey, seizure, false);
        }
      }
    } catch (error) {
      // Fehler wird bereits in saveSeizureToBackend behandelt
      console.error("Fehler beim Speichern:", error);
    }

    handleCloseModal();
  };

  const handleAfterEffectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      afterEffects: prev.afterEffects.includes(value)
        ? prev.afterEffects.filter((item) => item !== value)
        : [...prev.afterEffects, value],
    }));
  };

  const handleTriggerChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      triggers: prev.triggers.includes(value)
        ? prev.triggers.filter((item) => item !== value)
        : [...prev.triggers, value],
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type.includes(value)
        ? prev.type.filter((item) => item !== value)
        : [...prev.type, value],
    }));
  };

  const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-body text-foreground-600">Lädt Daten...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
      <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-4xl flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
        <div className="space-y-[var(--spacing-2xs)] sm:space-y-[var(--spacing-2xs)]">
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
            Anfallstagebuch
          </h1>
        </div>

        <div className="relative z-10 w-full">
          {/* Month Navigation – ein Button für die ganze Leiste (Klickposition: links=zurück, Mitte=heute, rechts=vor) */}
          <button
            ref={monthNavRef}
            type="button"
            onClick={handleMonthNavClick}
            className="mb-[var(--spacing-s)] flex w-full items-center justify-between rounded-xl bg-primary-500 px-[var(--spacing-m)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] text-white shadow-sm transition-colors hover:bg-primary-400 active:bg-primary-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-500"
            aria-label="Monat wechseln: links vorheriger, Mitte aktueller Monat, rechts nächster"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 flex-shrink-0 items-center justify-center rounded-lg"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span
              className="min-w-0 flex-1 px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] text-center text-h4 sm:text-h3 font-semibold"
              aria-hidden
            >
              {format(currentDate, "MMMM yyyy", { locale: de })}
            </span>
            <span
              className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 flex-shrink-0 items-center justify-center rounded-lg"
              aria-hidden
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-background-200 p-[var(--spacing-s)]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-[var(--spacing-2xs)] mb-[var(--spacing-2xs)]">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-body font-medium text-foreground-900 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-[var(--spacing-2xs)]">
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const entry = entries[dayKey];
              const isCurrentDay = isToday(day);
              const hasSeizure = entry?.hasSeizure;
              const hasEmergency = entry?.hasEmergencyMed;

              let borderClass = "border-background-200";
              let bgClass = "bg-background-50 text-foreground-900";

              if (hasSeizure) {
                borderClass = "border-accent-300";
                bgClass = "bg-accent-100 text-foreground-900"; // Markierte Tage in Akzentfarbe
              } else if (isCurrentDay) {
                borderClass = "border-secondary-300";
                bgClass = "bg-secondary-100 text-foreground-900"; // Aktuelles Datum in Sekundärfarbe
              }

              return (
                <button
                  key={dayKey}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative aspect-square rounded-lg border transition-all duration-200 ${borderClass}
                    ${bgClass}
                    hover:border-primary-400 hover:bg-primary-50
                    ${entry ? "font-semibold" : "font-normal"}
                  `}
                >
                  <span className="text-body sm:text-h5 md:text-h4 flex items-center justify-center h-full">{format(day, "d")}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-body text-foreground-600 text-center px-[var(--spacing-m)] mt-[var(--spacing-s)]">
          {t("Wähle einen Tag aus dem Kalender aus, um Anfälle einzutragen oder bereits erfasste Anfälle anzuzeigen.")}
        </p>

        {/* Anfall-Details Cards */}
        {viewingDate && (() => {
          const dayKey = format(viewingDate, "yyyy-MM-dd");
          const entry = entries[dayKey];
          const seizures = entry?.seizures || [];
          
          if (seizures.length === 0) return null;
          
          const isSeries = isSeizureSeries(seizures);
          const timeBlocks = isSeries ? createTimeBlocks(seizures) : [];
          
          return (
            <div className="mt-[var(--spacing-l)] space-y-[var(--spacing-m)]">
              {/* Einzelfall Card */}
              {!isSeries && (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-background-200 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-background-200 bg-primary-50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
                    <h3 className="text-body font-semibold text-foreground-900">
                      Einzelfall - {format(viewingDate, "dd.MM.yyyy", { locale: de })}
                    </h3>
                    <div className="flex items-center gap-[var(--spacing-s)]">
                      <button
                        onClick={() => handleAddNewSeizure(viewingDate)}
                        className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition"
                      >
                        + Neuer Anfall
                      </button>
                      <button
                        onClick={() => setViewingDate(null)}
                        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100 hover:text-foreground-900"
                        aria-label="Schließen"
                      >
                        <svg
                          className="h-5 w-5 sm:h-6 sm:w-6"
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
                  
                  <div className="p-[var(--spacing-m)] space-y-[var(--spacing-m)]">
                    {seizures.map((seizure, index) => {
                      const types = Array.isArray(seizure.type) ? seizure.type : [];
                      const allTypes = [...types];
                      if (seizure.customType) allTypes.push(seizure.customType);
                      
                      return (
                        <div
                          key={index}
                          className="border border-background-200 rounded-lg p-[var(--spacing-s)] bg-background-50"
                        >
                          <div className="flex items-start justify-between mb-[var(--spacing-s)]">
                            <div className="flex-1">
                              <div className="mb-[var(--spacing-2xs)]">
                                <span className="text-body font-medium text-foreground-700">Zeit: </span>
                                <span className="text-body text-foreground-900">{seizure.time || "Nicht angegeben"}</span>
                              </div>
                              
                              <div className="mb-[var(--spacing-2xs)]">
                                <span className="text-body font-medium text-foreground-700">Anfallstyp: </span>
                                <div className="flex flex-wrap gap-[var(--spacing-2xs)] mt-[var(--spacing-2xs)]">
                                  {allTypes.length > 0 ? (
                                    allTypes.map((type, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block text-body text-foreground-700 bg-white rounded-md px-[var(--spacing-2xs)] py-[var(--spacing-3xs)] border border-background-200"
                                      >
                                        {type}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-body text-foreground-500">Nicht angegeben</span>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-body font-medium text-foreground-700">Notfallmedikament: </span>
                                <span className={`text-body font-medium ${
                                  seizure.emergencyMed === "yes" || seizure.emergencyMed === "ja"
                                    ? "text-secondary-600"
                                    : "text-foreground-600"
                                }`}>
                                  {seizure.emergencyMed === "yes" || seizure.emergencyMed === "ja" ? "Ja" : "Nein"}
                                </span>
                                {seizure.emergencyMedName && (
                                  <span className="text-body text-foreground-600 ml-[var(--spacing-2xs)]">
                                    ({seizure.emergencyMedName})
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-[var(--spacing-2xs)] ml-[var(--spacing-s)]">
                              <button
                                onClick={() => handleEditSeizure(viewingDate, index)}
                                className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition"
                                aria-label="Bearbeiten"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleDeleteSeizure(seizure.id, viewingDate)}
                                className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-secondary-600 hover:text-secondary-700 border border-secondary-300 hover:border-secondary-400 rounded-lg transition"
                                aria-label="Löschen"
                              >
                                Löschen
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Anfallsserie Card */}
              {isSeries && (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-background-200 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-background-200 bg-primary-50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
                    <h3 className="text-body font-semibold text-foreground-900">
                      Anfallsserie - {format(viewingDate, "dd.MM.yyyy", { locale: de })}
                    </h3>
                    <div className="flex items-center gap-[var(--spacing-s)]">
                      <button
                        onClick={() => handleAddNewSeizure(viewingDate)}
                        className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition"
                      >
                        + Neuer Anfall
                      </button>
                      <button
                        onClick={() => handleDeleteDay(viewingDate)}
                        className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium border border-secondary-500 bg-white text-secondary-700 hover:border-secondary-600 hover:bg-secondary-50 rounded-lg transition"
                        aria-label="Tag löschen"
                      >
                        Tag löschen
                      </button>
                      <button
                        onClick={() => setViewingDate(null)}
                        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100 hover:text-foreground-900"
                        aria-label="Schließen"
                      >
                        <svg
                          className="h-5 w-5 sm:h-6 sm:w-6"
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
                  
                  <div className="p-[var(--spacing-m)] space-y-[var(--spacing-m)]">
                    {timeBlocks.map((block, blockIndex) => {
                      if (block.count === 0) return null;
                      
                      return (
                        <div
                          key={blockIndex}
                          className="border border-background-200 rounded-lg p-[var(--spacing-s)] bg-background-50"
                        >
                          <div className="flex items-start justify-between mb-[var(--spacing-s)]">
                            <div className="flex-1">
                              <div className="mb-[var(--spacing-2xs)]">
                                <span className="text-body font-medium text-foreground-700">Zeitblock: </span>
                                <span className="text-body text-foreground-900">{block.label}</span>
                              </div>
                              
                              <div className="mb-[var(--spacing-2xs)]">
                                <span className="text-body font-medium text-foreground-700">Anzahl: </span>
                                <span className="text-body text-foreground-900">{block.count}</span>
                              </div>
                              
                              <div className="mb-[var(--spacing-2xs)]">
                                <span className="text-body font-medium text-foreground-700">Anfallstypen: </span>
                                <div className="flex flex-wrap gap-[var(--spacing-2xs)] mt-[var(--spacing-2xs)]">
                                  {block.types.length > 0 ? (
                                    block.types.map((type, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block text-body text-foreground-700 bg-white rounded-md px-[var(--spacing-2xs)] py-[var(--spacing-3xs)] border border-background-200"
                                      >
                                        {type}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-body text-foreground-500">Nicht angegeben</span>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-body font-medium text-foreground-700">Notfallmedikament: </span>
                                <span className={`text-body font-medium ${
                                  block.hasEmergencyMed
                                    ? "text-secondary-600"
                                    : "text-foreground-600"
                                }`}>
                                  {block.hasEmergencyMed ? "Ja" : "Nein"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-[var(--spacing-2xs)] ml-[var(--spacing-s)]">
                              <button
                                onClick={() => {
                                  // Öffne Modal zum Bearbeiten des Zeitblocks
                                  // Bearbeite den ersten Anfall des Blocks als Startpunkt
                                  if (block.seizures.length > 0 && viewingDate) {
                                    const firstSeizureIndex = seizures.findIndex(s => s.id === block.seizures[0].id);
                                    if (firstSeizureIndex !== -1) {
                                      handleEditSeizure(viewingDate, firstSeizureIndex);
                                    }
                                  }
                                }}
                                className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition"
                                aria-label="Zeitblock bearbeiten"
                              >
                                Bearbeiten
                              </button>
                              {block.seizures.length > 1 && (
                                <span className="text-body text-foreground-500">
                                  ({block.seizures.length} Einträge)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Monthly Summary */}
        <div className="mt-[var(--spacing-l)] rounded-xl bg-white shadow-sm ring-1 ring-background-200 p-[var(--spacing-s)]">
          <h3 className="text-body font-semibold text-foreground-900 mb-[var(--spacing-m)]">
            Monatszusammenfassung - {format(currentDate, "MMMM yyyy", { locale: de })}
          </h3>
          <div className="text-body text-foreground-700">
            <div className="flex justify-between pb-2">
              <span>Anfälle (gesamt):</span>
              <span className="font-medium text-foreground-900">{monthlyStats.totalSeizures}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Notfallmedikamente:</span>
              <span className="font-medium text-foreground-900">{monthlyStats.totalEmergencyMeds}</span>
            </div>
            {monthlyStats.emergencyDates.length > 0 && (
              <div className="space-y-[var(--spacing-2xs)] pt-1 text-foreground-600">
                <div className="font-medium text-body text-foreground-700">Verabreicht am:</div>
                <div className="flex flex-wrap gap-[var(--spacing-2xs)]">
                  {monthlyStats.emergencyDates.map((date) => (
                    <span
                      key={date}
                      className="rounded-md bg-background-100 px-2 py-1 text-[10px] font-medium text-foreground-700 ring-1 ring-background-200"
                    >
                      {format(new Date(date), "dd.MM.")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {monthlyStats.totalSeizures === 0 && monthlyStats.totalEmergencyMeds === 0 && (
            <p className="mt-[var(--spacing-m)] text-body text-foreground-500">
              Noch keine Einträge für diesen Monat.
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full h-auto max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
            <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <h2 className="text-body font-semibold text-foreground-900 flex-1 min-w-0">
                Neuer Anfall eintragen
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                aria-label="Schließen"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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

            <form
              id="seizure-entry-form"
              onSubmit={handleSubmit}
              className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]"
            >
              {/* Anfallstyp aus Liste */}
              <div ref={typeFieldRef} className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Anfallstyp <span className="text-foreground-800">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => setIsTypeModalOpen(true)}
                    value={
                      Array.isArray(formData.type) && formData.type.length > 0
                        ? formData.type.join(", ")
                        : "Bitte auswählen"
                    }
                    className={`w-full cursor-pointer rounded-lg border px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:outline-none transition ${
                      typeError 
                        ? "border-warning-500 focus:border-warning-500 focus:ring-2 focus:ring-warning-200" 
                        : "border-background-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    }`}
                    placeholder="Bitte auswählen"
                  />
                  {Array.isArray(formData.type) && formData.type.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, type: [] }));
                        setTypeError("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Typ löschen"
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
                  )}
                </div>
                {typeError && (
                  <p className="text-body text-warning-600">{typeError}</p>
                )}
              </div>

              {/* Eigener Anfallstyp – zweites Feld, immer sichtbar */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Eigener Anfallstyp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        customType: e.target.value,
                      }));
                      setTypeError("");
                    }}
                    placeholder="Frei eingeben (optional)"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    aria-label="Eigenen Anfallstyp eingeben"
                  />
                  {formData.customType ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, customType: "" }));
                        setTypeError("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Eingabe löschen"
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
                  ) : null}
                </div>
                <p className="text-body text-foreground-500">
                  {t("Nutze dieses Feld, wenn dein Anfallstyp nicht in der Liste steht.")}
                </p>
              </div>

              {/* Mehr als ein Anfall? */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Mehr als ein Anfall?
                </label>
                <div className="flex gap-[var(--spacing-s)]">
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="multipleSeizures"
                      value="nein"
                      checked={formData.multipleSeizures === "nein"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          multipleSeizures: e.target.value,
                        }))
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Nein</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="multipleSeizures"
                      value="ja"
                      checked={formData.multipleSeizures === "ja"}
                      onChange={(e) => {
                        const isJa = e.target.value === "ja";
                        setFormData((prev) => ({
                          ...prev,
                          multipleSeizures: e.target.value,
                          ...(isJa
                            ? {
                                timeFrom: `${(prev.timeFrom || "00:00").split(":")[0]}:00`,
                                timeTo: `${(prev.timeTo || "00:00").split(":")[0]}:00`,
                              }
                            : {}),
                        }));
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Ja</span>
                  </label>
                </div>

                {/* Wenn Nein: Uhrzeit und Dauer */}
                {formData.multipleSeizures === "nein" && (
                  <>
                    <div className="space-y-[var(--spacing-xs)] pt-[var(--spacing-xs)]">
                      <span className="text-body font-medium text-foreground-800 block">
                        Uhrzeit
                      </span>
                      <div className="flex items-center gap-[var(--spacing-2xs)]">
                        <ScrollTimeSelect
                          options={hourOptions}
                          value={(formData.time || "00:00").split(":")[0]}
                          onChange={(h) => {
                            const m = (formData.time || "00:00").split(":")[1] || "00";
                            setFormData((prev) => ({ ...prev, time: `${h}:${m}` }));
                          }}
                          aria-label="Stunde"
                          className="flex-1 min-w-0"
                        />
                        <span className="text-body font-medium text-foreground-600 shrink-0" aria-hidden="true">
                          :
                        </span>
                        <ScrollTimeSelect
                          options={minuteOptions}
                          value={roundMinuteToFive((formData.time || "00:00").split(":")[1] ?? "00")}
                          onChange={(m) => {
                            const h = (formData.time || "00:00").split(":")[0] || "00";
                            setFormData((prev) => ({ ...prev, time: `${h}:${m}` }));
                          }}
                          aria-label="Minute"
                          className="flex-1 min-w-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">
                        Dauer
                      </label>
                      <div className="flex gap-[var(--spacing-m)]">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.durationMinutes}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                durationMinutes: e.target.value,
                              }))
                            }
                            placeholder="Min"
                            className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {formData.durationMinutes && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, durationMinutes: "" }))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                              aria-label="Löschen"
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
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.durationSeconds}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                durationSeconds: e.target.value,
                              }))
                            }
                            placeholder="Sek"
                            className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {formData.durationSeconds && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, durationSeconds: "" }))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                              aria-label="Löschen"
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
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Wenn Ja: Zeitraum von/bis (nur Stunden) und Anzahl – Anfälle werden zwischen den Uhrzeiten verteilt */}
                {formData.multipleSeizures === "ja" && (
                  <>
                    <div className="space-y-[var(--spacing-xs)] pt-[var(--spacing-xs)]">
                      <span className="text-body font-medium text-foreground-800 block">
                        Zeitraum: von / bis (nur Stunden)
                      </span>
                      <div className="flex flex-wrap items-center gap-[var(--spacing-s)]">
                        <div className="flex items-center gap-[var(--spacing-2xs)] flex-1 min-w-0">
                          <span className="text-body text-foreground-600 shrink-0">Von</span>
                          <ScrollTimeSelect
                            options={hourOptions}
                            value={(formData.timeFrom || "00:00").split(":")[0]}
                            onChange={(h) => setFormData((prev) => ({ ...prev, timeFrom: `${h}:00` }))}
                            aria-label="Von Stunde"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-body text-foreground-500 shrink-0">Uhr</span>
                        </div>
                        <div className="flex items-center gap-[var(--spacing-2xs)] flex-1 min-w-0">
                          <span className="text-body text-foreground-600 shrink-0">Bis</span>
                          <ScrollTimeSelect
                            options={hourOptions}
                            value={(formData.timeTo || "00:00").split(":")[0]}
                            onChange={(h) => setFormData((prev) => ({ ...prev, timeTo: `${h}:00` }))}
                            aria-label="Bis Stunde"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-body text-foreground-500 shrink-0">Uhr</span>
                        </div>
                      </div>
                      <p className="text-body text-foreground-500 pt-[var(--spacing-2xs)]">
                        Die eingegebenen Anfälle werden gleichmäßig zwischen den beiden Uhrzeiten verteilt.
                      </p>
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">
                        Anzahl der Anfälle
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.seizureCount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              seizureCount: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Anzahl"
                        />
                        {formData.seizureCount && formData.seizureCount !== "1" && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, seizureCount: "1" }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                            aria-label="Löschen"
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
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Hast du es vorher gespürt? */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  {t("Hast du es vorher gespürt?")}
                </label>
                <div className="flex gap-[var(--spacing-s)]">
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="feltBefore"
                      value="ja"
                      checked={formData.feltBefore === "ja"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feltBefore: e.target.value,
                        }))
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Ja</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="feltBefore"
                      value="nein"
                      checked={formData.feltBefore === "nein"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feltBefore: e.target.value,
                        }))
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Nein</span>
                  </label>
                </div>
              </div>

              {/* Wie ging es dir danach? */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  {t("Wie ging es dir danach?")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => setIsAfterEffectsModalOpen(true)}
                    value={
                      Array.isArray(formData.afterEffects) && formData.afterEffects.length > 0
                        ? formData.afterEffects.join(", ")
                        : "Bitte auswählen"
                    }
                    className="w-full cursor-pointer rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Bitte auswählen"
                  />
                  {Array.isArray(formData.afterEffects) && formData.afterEffects.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, afterEffects: [] }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Nachwirkungen löschen"
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
                  )}
                </div>
              </div>

              {/* Weitere Auffälligkeiten */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Weitere Auffälligkeiten
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customAfterEffects}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customAfterEffects: e.target.value,
                      }))
                    }
                    placeholder="Weitere Auffälligkeiten eintragen"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {formData.customAfterEffects && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, customAfterEffects: "" }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Löschen"
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
                  )}
                </div>
              </div>

              {/* Mögliche Auslöser */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Mögliche Auslöser
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => setIsTriggersModalOpen(true)}
                    value={
                      Array.isArray(formData.triggers) && formData.triggers.length > 0
                        ? formData.triggers.join(", ")
                        : "Bitte auswählen"
                    }
                    className="w-full cursor-pointer rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Bitte auswählen"
                  />
                  {Array.isArray(formData.triggers) && formData.triggers.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, triggers: [] }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Auslöser löschen"
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
                  )}
                </div>
              </div>

              {/* Andere Auslöser */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Andere Auslöser
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customTriggers}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customTriggers: e.target.value,
                      }))
                    }
                    placeholder="Andere Auslöser eintragen"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {formData.customTriggers && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, customTriggers: "" }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                      aria-label="Löschen"
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
                  )}
                </div>
              </div>

              {/* Notfallmedikament eingenommen? */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Notfallmedikament eingenommen?
                </label>
                <div className="flex gap-[var(--spacing-s)]">
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="emergencyMed"
                      value="ja"
                      checked={formData.emergencyMed === "ja"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyMed: e.target.value,
                        }))
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Ja</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]">
                    <input
                      type="radio"
                      name="emergencyMed"
                      value="nein"
                      checked={formData.emergencyMed === "nein"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyMed: e.target.value,
                        }))
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-body text-foreground-700">Nein</span>
                  </label>
                </div>
                {formData.emergencyMed === "ja" && (
                  <div className="relative pt-[var(--spacing-xs)]">
                    <input
                      type="text"
                      value={formData.emergencyMedName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyMedName: e.target.value,
                        }))
                      }
                      placeholder="Name des Notfallmedikaments"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] pr-10 py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {formData.emergencyMedName && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, emergencyMedName: "" }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600"
                        aria-label="Löschen"
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
                    )}
                  </div>
                )}
              </div>

              {/* Video Upload - Optional */}
              <div className="space-y-[var(--spacing-xs)]">
                <label className="text-body font-medium text-foreground-800">
                  Video hochladen <span className="text-foreground-500">(Optional)</span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  disabled
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      video: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm cursor-not-allowed bg-background-100 text-foreground-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-body file:font-semibold file:bg-background-200 file:text-foreground-400"
                />
              </div>

              {/* Buttons – Abbrechen und Speichern (groß für bessere Erkennbarkeit) */}
              <div className="flex gap-[var(--spacing-m)] pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Wird gespeichert…" : "Speichern"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Typ-Auswahl Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full h-auto max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <h3 className="text-body font-semibold text-foreground-900">
                Typ auswählen
              </h3>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
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

            <div className="p-[var(--spacing-s)] space-y-3">
              {seizureTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.type) && formData.type.includes(type)}
                    onChange={() => handleTypeChange(type)}
                    className="h-4 w-4 rounded border-background-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-body text-foreground-700">{type}</span>
                </label>
              ))}
            </div>

            <div className="sticky bottom-0 border-t border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="w-full rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* After Effects Modal */}
      {isAfterEffectsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full h-auto max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <h3 className="text-body font-semibold text-foreground-900">
                {t("Wie ging es dir danach?")}
              </h3>
              <button
                onClick={() => setIsAfterEffectsModalOpen(false)}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
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

            <div className="p-[var(--spacing-s)] space-y-3">
              {afterEffectsOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.afterEffects) && formData.afterEffects.includes(option)}
                    onChange={() => handleAfterEffectChange(option)}
                    className="h-4 w-4 rounded border-background-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-body text-foreground-700">{option}</span>
                </label>
              ))}
            </div>

            <div className="sticky bottom-0 border-t border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <button
                onClick={() => setIsAfterEffectsModalOpen(false)}
                className="w-full rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triggers Modal */}
      {isTriggersModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full h-auto max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <h3 className="text-body font-semibold text-foreground-900">
                Mögliche Auslöser?
              </h3>
              <button
                onClick={() => setIsTriggersModalOpen(false)}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
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

            <div className="p-[var(--spacing-s)] space-y-3">
              {triggerOptions.map((trigger) => (
                <label
                  key={trigger}
                  className="flex cursor-pointer items-center gap-[var(--spacing-2xs)]"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.triggers) && formData.triggers.includes(trigger)}
                    onChange={() => handleTriggerChange(trigger)}
                    className="h-4 w-4 rounded border-background-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-body text-foreground-700">{trigger}</span>
                </label>
              ))}
            </div>

            <div className="sticky bottom-0 border-t border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
              <button
                onClick={() => setIsTriggersModalOpen(false)}
                className="w-full rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}

