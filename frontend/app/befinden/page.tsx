"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { befindenApi, Befinden } from "@/lib/api";
import { toastService } from "@/components/ui";
import { Calendar } from "@/components/ui/Calendar";
import { useRoleText } from "@/lib/hooks/useRoleText";

type TimeOfDay = "morning" | "noon" | "evening";
type TimeSlotId = TimeOfDay | 'allDay';

const TIME_SLOTS: ReadonlyArray<{ id: TimeSlotId }> = [
  { id: 'allDay' },
  { id: 'morning' },
  { id: 'noon' },
  { id: 'evening' },
] as const;

// Kern-Items (Vorschläge, keine Pflicht)
const coreItems = [
  { id: "sleep-rhythm", label: "Schlaf-Wach-Rhythmus" },
  { id: "fatigue", label: "Müdigkeit / Erschöpfung" },
  { id: "stress", label: "Stress" },
  { id: "restlessness", label: "Innere Unruhe" },
  { id: "concentration", label: "Konzentration" },
  { id: "sensitivity", label: "Reizempfindlichkeit (Licht / Geräusche)" },
  { id: "irritability", label: "Reizbarkeit" },
  { id: "medication-adherence", label: "Medikamente nicht wie geplant eingenommen?" },
];

// Optionale Symptome (standardmäßig ausgeblendet)
const optionalItems = [
  { id: "pain", label: "Schmerzen" },
  { id: "depression", label: "Depressive Belastung" },
  { id: "anxiety", label: "Angst" },
  { id: "headache", label: "Kopfschmerz" },
  { id: "menstrual", label: "Zyklusbezogene Beschwerden" },
  { id: "memory-problems", label: "Gedächtnisprobleme" },
  { id: "confusion", label: "Verwirrtheit" },
  { id: "loss-of-appetite", label: "Appetitlosigkeit" },
  { id: "malaise", label: "Krankheitsgefühl" },
];

// Beschreibung für Skalenwerte
const getScaleDescription = (value: number): string => {
  if (value <= 2) return "kaum spürbar";
  if (value <= 4) return "leicht spürbar";
  if (value <= 6) return "deutlich spürbar";
  if (value <= 8) return "sehr präsent";
  return "überwältigend";
};

// Eigene Symptome (vom Nutzer erstellt)
type CustomSymptom = {
  id: string;
  label: string;
  createdAt: string;
};

export default function BefindenPage() {
  const { t } = useRoleText();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Record<string, TimeOfDay | 'allDay' | null>>({});
  const [tempRatings, setTempRatings] = useState<Record<string, Partial<Record<TimeOfDay, number | null>> & { allDay?: number | null }>>({});
  const [savedConfirmations, setSavedConfirmations] = useState<Record<string, boolean>>({});
  const isRecentlySaved = (itemId: string) => Object.keys(savedConfirmations).some(k => k.startsWith(itemId));
  const [deleteConfirmations, setDeleteConfirmations] = useState<Record<string, { date: string; timeOfDay: TimeOfDay | 'allDay' } | null>>({});
  const [history, setHistory] = useState<Befinden[]>([]);
  const [allHistory, setAllHistory] = useState<Befinden[]>([]); // Alle Daten für Übersicht
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  
  // Undo-Funktionalität
  const [undoState, setUndoState] = useState<{
    entries: Befinden[];
    symptomId: string;
    date: string;
    timeOfDay: TimeOfDay | 'allDay';
    tempRating?: number | null;
  } | null>(null);
  
  // Medikamente weggelassen - spezielle Felder
  const [medicationName, setMedicationName] = useState<Record<string, string>>({});
  const [medicationReason, setMedicationReason] = useState<Record<string, string>>({});
  
  // Eigene Symptome
  const [customSymptoms, setCustomSymptoms] = useState<CustomSymptom[]>([]);
  const [showAddCustomSymptom, setShowAddCustomSymptom] = useState(false);
  const [newCustomSymptomName, setNewCustomSymptomName] = useState("");
  const newSymptomInputRef = useRef<HTMLInputElement>(null);
  // Beobachtungs-Items (werden zu Kern-Items hinzugefügt)
  const [observationItems, setObservationItems] = useState<CustomSymptom[]>([]);
  
  // "Weitere Symptome" progressive Offenlegung
  const [showAllWeitere, setShowAllWeitere] = useState(false);

  // Alle verfügbaren Items (Kern + Beobachtungen + Optional + Custom)
  const allItems = useMemo(() => {
    const items: Array<{ id: string; label: string; type: 'core' | 'optional' | 'custom' | 'observation' }> = [];
    
    items.push(...coreItems.map(item => ({ ...item, type: 'core' as const })));
    items.push(...observationItems.map(item => ({ ...item, type: 'observation' as const })));
    items.push(...optionalItems.map(item => ({ ...item, type: 'optional' as const })));
    items.push(...customSymptoms.map(item => ({ ...item, type: 'custom' as const })));
    
    return items;
  }, [customSymptoms, observationItems]);

  // Lade eigene Symptome aus localStorage
  useEffect(() => {
    const stored = localStorage.getItem('customSymptoms');
    if (stored) {
      try {
        setCustomSymptoms(JSON.parse(stored));
      } catch (e) {
        console.error('Fehler beim Laden der eigenen Symptome:', e);
      }
    }
    
    const storedObservations = localStorage.getItem('observationItems');
    if (storedObservations) {
      try {
        setObservationItems(JSON.parse(storedObservations));
      } catch (e) {
        console.error('Fehler beim Laden der Beobachtungs-Items:', e);
      }
    }
  }, []);

  // Speichere eigene Symptome in localStorage
  useEffect(() => {
    if (customSymptoms.length > 0) {
      localStorage.setItem('customSymptoms', JSON.stringify(customSymptoms));
    }
  }, [customSymptoms]);

  // Speichere Beobachtungs-Items in localStorage
  useEffect(() => {
    if (observationItems.length > 0) {
      localStorage.setItem('observationItems', JSON.stringify(observationItems));
    }
  }, [observationItems]);
      
  // Lade Historie
  useEffect(() => {
    loadHistory();
    loadAllHistory(); // Lade auch alle Daten für Übersicht
  }, [selectedDate]);

  // Fokus auf Eingabefeld, wenn „Hinzufügen“ geöffnet wird
  useEffect(() => {
    if (showAddCustomSymptom) {
      newSymptomInputRef.current?.focus();
    }
  }, [showAddCustomSymptom]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await befindenApi.getAll({ date: dateStr });
      setHistory(response.data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Daten';
      toastService.show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lade alle Einträge für Übersicht (keine zeitliche Begrenzung)
  const loadAllHistory = async () => {
    try {
      const response = await befindenApi.getAll({});
      setAllHistory(response.data || []);
    } catch {
      // Hintergrund-Ladevorgang – Fehler werden stillschweigend ignoriert
    }
  };

  // Hole Rating für ein Item und eine Tageszeit
  const getRatingForTimeSlot = (date: Date, symptomId: string, timeOfDay: TimeOfDay): number | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = history.find(
      (h) =>
        h.date === dateStr &&
        h.symptom_id === symptomId &&
        h.time_of_day === timeOfDay
    );
    return entry?.rating ?? null;
  };

  // Toggle Item-Expansion
  const toggleItem = (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
    setExpandedTimeSlots((prev) => ({
      ...prev,
      [itemId]: null,
    }));
  };

  // Toggle Tageszeit
  const toggleTimeSlot = (itemId: string, timeOfDay: TimeOfDay | 'allDay') => {
    setExpandedTimeSlots((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === timeOfDay ? null : timeOfDay,
    }));
  };

  // Rating ändern (nur temporär, nicht speichern)
  const handleRatingChange = (symptomId: string, timeOfDay: TimeOfDay, value: number) => {
    setTempRatings((prev) => ({
      ...prev,
      [symptomId]: {
        ...prev[symptomId],
        [timeOfDay]: value,
      },
    }));
  };

  // Änderungen speichern
  const saveChanges = async (symptomId: string, timeOfDay: TimeOfDay | 'allDay') => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isAllDay = timeOfDay === 'allDay';
    const timeSlots: TimeOfDay[] = isAllDay ? ['morning', 'noon', 'evening'] : [timeOfDay as TimeOfDay];
    
    setSaving((prev) => ({ ...prev, [symptomId]: true }));

    try {
      for (const slot of timeSlots) {
        const rating = isAllDay 
          ? tempRatings[symptomId]?.allDay 
          : tempRatings[symptomId]?.[slot];
        
        if (rating === null || rating === undefined) continue;

        // Bestehenden Eintrag finden
        const existing = history.find(
          (h) =>
            h.date === dateStr &&
            h.symptom_id === symptomId &&
            h.time_of_day === slot
        );
        
        // Für "Medikamente weggelassen?" zusätzliche Fragen speichern
        const medicationKey = `${symptomId}:${slot}:${dateStr}`;
        const medicationData = symptomId === 'medication-adherence' ? {
          medicationName: medicationName[medicationKey] || '',
          reason: medicationReason[medicationKey] || '',
        } : undefined;

        const item = allItems.find((i) => i.id === symptomId);
        const payload = {
          date: dateStr,
          category_id: null,
          symptom_id: symptomId,
          ...(item?.type === 'custom' && item?.label ? { symptom_label: item.label } : {}),
          time_of_day: slot,
          rating: rating,
          questions: medicationData ? { medicationName: medicationData.medicationName, reason: medicationData.reason } : undefined,
          observation: null,
        };
      
        if (existing) {
          await befindenApi.update(existing.id, payload);
        } else {
          await befindenApi.create(payload);
        }
      }

      // Bestätigung anzeigen
      const key = isAllDay ? `${symptomId}:allDay` : `${symptomId}:${timeOfDay}`;
      setSavedConfirmations((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSavedConfirmations((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 1500);

      // History aktualisieren
      await loadHistory();
      await loadAllHistory(); // Aktualisiere auch Übersicht
      
      // Card automatisch schließen nach erfolgreichem Speichern
      setExpandedItems((prev) => {
        const next = { ...prev };
        delete next[symptomId];
        return next;
      });
      setExpandedTimeSlots((prev) => {
        const next = { ...prev };
        delete next[symptomId];
        return next;
      });
      
      // Temp-Ratings für gespeicherte Einträge beibehalten (für Anzeige)
      // Nur unsaved tempRatings entfernen
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toastService.show('Fehler beim Speichern', 'error');
    } finally {
      setSaving((prev) => {
        const next = { ...prev };
        delete next[symptomId];
        return next;
      });
    }
  };

  // Eintrag löschen
  const requestDeleteEntry = (date: string, symptomId: string, timeOfDay: TimeOfDay | 'allDay') => {
    setDeleteConfirmations((prev) => ({
      ...prev,
      [symptomId]: { date, timeOfDay },
    }));
  };

  const confirmDeleteEntry = async (symptomId: string) => {
    const confirmation = deleteConfirmations[symptomId];
    if (!confirmation) return;

    try {
      if (confirmation.timeOfDay === 'allDay') {
        // Alle Einträge für diesen Tag löschen
        const entries = history.filter(
          (h) => h.date === confirmation.date && h.symptom_id === symptomId
        );
        for (const entry of entries) {
          await befindenApi.delete(entry.id);
        }
        toastService.show('Alle Einträge für diesen Tag gelöscht', 'success');
      } else {
        // Einzelnen Eintrag löschen
        const entry = history.find(
          (h) =>
            h.date === confirmation.date &&
            h.symptom_id === symptomId &&
            h.time_of_day === confirmation.timeOfDay
        );

        if (entry) {
          await befindenApi.delete(entry.id);
          toastService.show('Eintrag gelöscht', 'success');
        }
      }
      await loadHistory();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toastService.show('Fehler beim Löschen', 'error');
    }

    setDeleteConfirmations((prev) => ({
      ...prev,
      [symptomId]: null,
    }));
  };

  // Eintrag löschen mit Undo
  const deleteEntry = async (date: string, symptomId: string, timeOfDay: TimeOfDay | 'allDay') => {
    try {
      let entriesToDelete: Befinden[] = [];
      let tempRatingToDelete: number | null = null;
      
      if (timeOfDay === 'allDay') {
        // Alle Einträge für diesen Tag löschen
        entriesToDelete = history.filter(
          (h) => h.date === date && h.symptom_id === symptomId
        );
        // Prüfe auch tempRatings
        if (entriesToDelete.length === 0 && tempRatings[symptomId]?.allDay !== undefined) {
          tempRatingToDelete = tempRatings[symptomId]?.allDay ?? null;
        }
      } else {
        // Einzelnen Eintrag löschen
        const entry = history.find(
          (h) => h.date === date && h.symptom_id === symptomId && h.time_of_day === timeOfDay
        );
        if (entry) {
          entriesToDelete = [entry];
        } else if (tempRatings[symptomId]?.[timeOfDay] !== undefined) {
          // Nur tempRating vorhanden
          tempRatingToDelete = tempRatings[symptomId]?.[timeOfDay] ?? null;
        }
      }

      // Wenn keine Einträge und keine tempRatings vorhanden, nichts zu löschen
      if (entriesToDelete.length === 0 && tempRatingToDelete === null) {
        return;
      }

      // Einträge/tempRatings speichern für Undo
      if (entriesToDelete.length > 0) {
        setUndoState({
          entries: JSON.parse(JSON.stringify(entriesToDelete)), // Deep copy
          symptomId,
          date,
          timeOfDay,
        });
      } else if (tempRatingToDelete !== null) {
        // Für tempRatings speichern wir den Wert in undoState
        setUndoState({
          entries: [],
          symptomId,
          date,
          timeOfDay,
          tempRating: tempRatingToDelete,
        });
      }

      // Einträge löschen
      for (const entry of entriesToDelete) {
        await befindenApi.delete(entry.id);
      }

      // tempRatings löschen
      if (tempRatingToDelete !== null || entriesToDelete.length > 0) {
        setTempRatings((prev) => {
          const next = { ...prev };
          if (next[symptomId]) {
            const nextSymptom = { ...next[symptomId] };
            if (timeOfDay === 'allDay') {
              delete nextSymptom.allDay;
              delete nextSymptom.morning;
              delete nextSymptom.noon;
              delete nextSymptom.evening;
            } else {
              delete nextSymptom[timeOfDay];
            }
            if (Object.keys(nextSymptom).length === 0) {
              delete next[symptomId];
            } else {
              next[symptomId] = nextSymptom;
            }
          }
          return next;
        });
      }

      // Undo nach 5 Sekunden entfernen
      setTimeout(() => {
        setUndoState(null);
      }, 5000);

      // Card automatisch schließen nach erfolgreichem Löschen
      setExpandedItems((prev) => {
        const next = { ...prev };
        delete next[symptomId];
        return next;
      });
      setExpandedTimeSlots((prev) => {
        const next = { ...prev };
        delete next[symptomId];
        return next;
      });

      if (entriesToDelete.length > 0) {
        await loadHistory();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toastService.show('Fehler beim Löschen', 'error');
    }
  };
    
  // Undo: Gelöschten Eintrag wiederherstellen
  const undoDelete = async () => {
    if (!undoState) return;

    try {
      // Einträge wiederherstellen
      for (const entry of undoState.entries) {
        await befindenApi.create({
          date: entry.date,
          category_id: entry.category_id,
          symptom_id: entry.symptom_id,
          time_of_day: entry.time_of_day,
          rating: entry.rating,
          questions: entry.questions,
          observation: entry.observation,
        });
      }

      // tempRatings wiederherstellen
      if (undoState.tempRating !== undefined && undoState.tempRating !== null) {
        setTempRatings((prev) => {
          const next = { ...prev };
          if (undoState.timeOfDay === 'allDay') {
            next[undoState.symptomId] = {
              ...next[undoState.symptomId],
              allDay: undoState.tempRating!,
              morning: undoState.tempRating!,
              noon: undoState.tempRating!,
              evening: undoState.tempRating!,
            };
          } else {
            next[undoState.symptomId] = {
              ...next[undoState.symptomId],
              [undoState.timeOfDay]: undoState.tempRating!,
            };
          }
          return next;
        });
      }

      setUndoState(null);
      if (undoState.entries.length > 0) {
        await loadHistory();
      }
    } catch (error) {
      console.error('Fehler beim Wiederherstellen:', error);
      toastService.show('Fehler beim Wiederherstellen', 'error');
    }
  };

  const cancelDeleteEntry = (symptomId: string) => {
    setDeleteConfirmations((prev) => ({
      ...prev,
      [symptomId]: null,
    }));
  };
    
  // Icon für Zeitpunkt
  const getTimeSlotIcon = (timeSlotId: TimeSlotId) => {
    switch (timeSlotId) {
      case 'allDay':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'morning':
        return (
          <svg className="h-6 w-6 overflow-visible" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19h18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19c-2.5 0-4.5-2-4.5-4.5S9.5 10 12 10s4.5 2 4.5 4.5S14.5 19 12 19z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10V8M10 19H8M14 19H16M7.5 11.5L6 10M7.5 16.5L6 18M16.5 11.5L18 10M16.5 16.5L18 18" />
          </svg>
        );
      case 'noon':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'evening':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Label für Zeitpunkt (für Tooltip)
  const getTimeSlotLabel = (timeSlotId: TimeSlotId): string => {
    switch (timeSlotId) {
      case 'allDay':
        return 'Ganzen Tag';
      case 'morning':
        return 'Morgen';
      case 'noon':
        return 'Mittag';
      case 'evening':
        return 'Abend';
      default:
        return '';
    }
  };

  const getRatingTextClass = (rating: number): string => {
    if (rating <= 4) return 'text-[#243B2E]';
    return 'text-[#243B2E]/80';
  };

  const getSliderStyle = (rating: number | null): React.CSSProperties => {
    const percentage = rating === null ? 50 : ((rating - 1) / 9) * 100;
    return {
      '--slider-fill-percentage': `${percentage}%`,
    } as React.CSSProperties;
  };

  // Render Rating Scale (wiederverwendbar für alle Items)
  const renderRatingScale = (itemId: string, selectedTimeSlot: TimeOfDay | 'allDay') => {
    const isAllDay = selectedTimeSlot === 'allDay';
    const timeOfDay = isAllDay ? 'morning' : selectedTimeSlot;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    let existingRating: number | null = null;
    let existingMedicationData: { medicationName?: string; reason?: string } | null = null;
    if (isAllDay) {
      const entries = history.filter(
        (h) => h.date === dateStr && h.symptom_id === itemId
      );
      if (entries.length > 0) {
        const sum = entries.reduce((acc, e) => acc + (e.rating || 0), 0);
        existingRating = Math.round(sum / entries.length);
        // Medikamente-Daten aus erstem Eintrag laden
        if (itemId === 'medication-adherence' && entries[0]?.questions) {
          const q = entries[0].questions as any;
          existingMedicationData = {
            medicationName: q.medicationName || '',
            reason: q.reason || '',
          };
        }
      }
    } else {
      existingRating = getRatingForTimeSlot(selectedDate, itemId, timeOfDay);
      // Medikamente-Daten aus Historie laden
      if (itemId === 'medication-adherence') {
        const entry = history.find(
          (h) => h.date === dateStr && h.symptom_id === itemId && h.time_of_day === timeOfDay
        );
        if (entry?.questions) {
          const q = entry.questions as any;
          existingMedicationData = {
            medicationName: q.medicationName || '',
            reason: q.reason || '',
          };
        }
      }
    }
    
    let tempRating: number | null = null;
    if (isAllDay) {
      const morningRating = tempRatings[itemId]?.['morning'] ?? getRatingForTimeSlot(selectedDate, itemId, 'morning');
      const noonRating = tempRatings[itemId]?.['noon'] ?? getRatingForTimeSlot(selectedDate, itemId, 'noon');
      const eveningRating = tempRatings[itemId]?.['evening'] ?? getRatingForTimeSlot(selectedDate, itemId, 'evening');
      
      const ratings = [morningRating, noonRating, eveningRating].filter((r): r is number => r !== null);
      if (ratings.length > 0) {
        tempRating = Math.round(ratings.reduce((acc, r) => acc + r, 0) / ratings.length);
      } else {
        tempRating = existingRating;
      }
    } else {
      tempRating = tempRatings[itemId]?.[timeOfDay] ?? existingRating ?? null;
    }
    
    const key = isAllDay ? `${itemId}:allDay` : `${itemId}:${timeOfDay}`;
    const isSaving = saving[key];
    const deleteConf = deleteConfirmations[itemId];

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          {[1, 3, 5, 8, 10].map((value) => {
            const isActive = tempRating !== null && tempRating === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (isAllDay) {
                    setTempRatings((prev) => ({
                      ...prev,
                      [itemId]: {
                        ...prev[itemId],
                        allDay: value,
                        morning: value,
                        noon: value,
                        evening: value,
                      },
                    }));
                  } else {
                    handleRatingChange(itemId, timeOfDay, value);
                  }
                }}
                disabled={isSaving}
                className={`flex-1 rounded-lg py-1.5 text-body-small font-medium transition-colors duration-150 ease-out ${
                  isActive
                    ? 'bg-[#EBF4EF] text-[#243B2E]'
                    : 'bg-[#F2F5F3] text-foreground-400 hover:bg-[#EBF4EF]/50'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={1}
          max={10}
          value={tempRating ?? 5}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value, 10);
            if (isAllDay) {
              setTempRatings((prev) => ({
                ...prev,
                [itemId]: {
                  ...prev[itemId],
                  allDay: value,
                  morning: value,
                  noon: value,
                  evening: value,
                },
              }));
            } else {
              handleRatingChange(itemId, timeOfDay, value);
            }
          }}
          disabled={isSaving}
          style={getSliderStyle(tempRating)}
          className="rating-slider"
        />

        {tempRating !== null && (
          <div className="flex flex-col items-center gap-0.5 pt-2 transition-opacity duration-150 ease-out">
            <span className={`text-[2.5rem] font-semibold leading-none tracking-tight ${getRatingTextClass(tempRating)}`}>{tempRating}</span>
            <p className="text-[12px] text-foreground-300 mt-1">
              {getScaleDescription(tempRating)}
            </p>
            <p className="text-[11px] text-foreground-300/70 mt-2">
              Danke, dass du das festhältst.
            </p>
            {existingRating !== null && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEntry(dateStr, itemId, selectedTimeSlot);
                }}
                className="mt-1 text-[12px] text-foreground-300 hover:text-foreground-500 transition-colors"
              >
                Eintrag löschen
              </button>
            )}
          </div>
        )}

        {/* Medikamente weggelassen? - Zusätzliche Felder */}
        {itemId === 'medication-adherence' && tempRating !== null && tempRating >= 1 && (() => {
          const medicationKey = `${itemId}:${timeOfDay}:${dateStr}`;
          const currentName = medicationName[medicationKey] || existingMedicationData?.medicationName || '';
          const currentReason = medicationReason[medicationKey] || existingMedicationData?.reason || '';

          return (
            <div className="mt-5 space-y-3 border-t border-background-200/40 pt-5">
              <div>
                <label className="mb-1 block text-body-small text-foreground-600">
                  Name des Medikaments
                </label>
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => {
                    setMedicationName((prev) => ({ ...prev, [medicationKey]: e.target.value }));
                  }}
                  placeholder="z.B. Lamotrigin"
                  className="w-full rounded-xl border border-[#EBF4EF] bg-[#FEFEFE] px-4 py-2 text-body text-foreground-900 placeholder:text-foreground-300 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-body-small text-foreground-600">
                  Warum? (wenn du möchtest)
                </label>
                <input
                  type="text"
                  value={currentReason}
                  onChange={(e) => {
                    setMedicationReason((prev) => ({ ...prev, [medicationKey]: e.target.value }));
                  }}
                  placeholder="z.B. Vergessen, Nebenwirkungen"
                  className="w-full rounded-xl border border-[#EBF4EF] bg-[#FEFEFE] px-4 py-2 text-body text-foreground-900 placeholder:text-foreground-300 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-100"
                />
              </div>
            </div>
          );
        })()}

        {/* Speichern/Abbrechen Buttons */}
        {tempRating !== null && (() => {
          // Prüfe ob es ungespeicherte Änderungen gibt
          const currentTempRating = isAllDay
            ? tempRatings[itemId]?.allDay
            : tempRatings[itemId]?.[timeOfDay];
          
          // Buttons anzeigen wenn:
          // 1. tempRating existiert in tempRatings UND
          // 2. (tempRating unterscheidet sich von existingRating ODER existingRating ist null)
          const hasUnsavedChanges = currentTempRating !== null && currentTempRating !== undefined && 
            (currentTempRating !== existingRating || existingRating === null);
          
          if (!hasUnsavedChanges) return null;
          
          return (
            <div className="mt-5 flex flex-col items-center gap-3 border-t border-background-200/40 pt-5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveChanges(itemId, selectedTimeSlot);
                }}
                disabled={isSaving}
                className="w-full rounded-xl bg-[#6FB48F] px-5 py-2.5 text-body-small font-medium text-white transition-colors hover:bg-[#5EA37E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteEntry(dateStr, itemId, selectedTimeSlot);
                }}
                disabled={isSaving}
                className="text-[11px] text-foreground-300 hover:text-foreground-400 transition-colors disabled:opacity-50"
              >
                Eintrag entfernen
              </button>
            </div>
          );
        })()}

        {deleteConf && ((isAllDay && deleteConf.timeOfDay === 'allDay') || (!isAllDay && deleteConf.timeOfDay === timeOfDay)) && (
          <div className="mt-3 rounded-xl border border-[#EBF4EF] bg-[#F2F5F3] p-3">
            <p className="mb-2 text-body-small text-foreground-700">
              {isAllDay ? 'Möchtest du alle Einträge für diesen Tag entfernen?' : 'Möchtest du diesen Eintrag entfernen?'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => confirmDeleteEntry(itemId)}
                className="rounded-lg bg-foreground-200 px-3 py-1.5 text-body-small font-medium text-foreground-700 hover:bg-foreground-300 transition"
              >
                Ja, entfernen
              </button>
              <button
                type="button"
                onClick={() => cancelDeleteEntry(itemId)}
                className="rounded-lg px-3 py-1.5 text-body-small text-foreground-400 hover:text-foreground-600 transition"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Eigenes Symptom hinzufügen
  const handleAddCustomSymptom = () => {
    if (!newCustomSymptomName.trim()) {
      toastService.show(t('Bitte gib einen Namen ein'), 'error');
      return;
    }

    const newSymptom: CustomSymptom = {
      id: `custom-${Date.now()}`,
      label: newCustomSymptomName.trim(),
      createdAt: new Date().toISOString(),
    };

    setCustomSymptoms((prev) => [...prev, newSymptom]);
    setNewCustomSymptomName('');
    setShowAddCustomSymptom(false);
    toastService.show(t('Eigenes Symptom hinzugefügt'), 'success');
  };

  // Eigenes Symptom entfernen
  const handleRemoveCustomSymptom = (symptomId: string) => {
    setCustomSymptoms((prev) => prev.filter((s) => s.id !== symptomId));
    toastService.show(t('Eigenes Symptom entfernt'), 'success');
  };

  // Favoriten - Items die besonders oft eingetragen wurden (basierend auf allen Daten)
  // Einschließlich eigener Symptome, wenn sie regelmäßig verwendet werden
  const favoriteItems = useMemo(() => {
    const itemCounts: Record<string, number> = {};

    // Verwende allHistory statt history, um alle Daten zu berücksichtigen
    allHistory.forEach((entry) => {
      if (entry.symptom_id && entry.symptom_id !== 'observation') {
        itemCounts[entry.symptom_id] = (itemCounts[entry.symptom_id] || 0) + 1;
      }
    });

    // Sortiere nach Häufigkeit (nur Items mit mindestens 15 Einträgen)
    // Filtere nur Items, die auch in allItems existieren (inkl. eigene Symptome)
    return Object.keys(itemCounts)
      .filter((id) => {
        // Mindestens 15 Einträge UND Item existiert in allItems (inkl. eigene Symptome)
        return itemCounts[id] >= 15 && allItems.some(item => item.id === id);
      })
      .sort((a, b) => itemCounts[b] - itemCounts[a]) // Sortiere nach Häufigkeit (absteigend)
      .slice(0, 8); // Top 8
  }, [allHistory, allItems]);

  // "Deine Symptome": Favoriten oder alle Kern-Items als Fallback
  const personalItemIds = useMemo(() => {
    if (favoriteItems.length > 0) return favoriteItems;
    return coreItems.map(i => i.id);
  }, [favoriteItems]);

  // "Weitere Symptome": Alles was nicht in personalItemIds ist (Core + Observation + Optional)
  const weitereItems = useMemo(() => {
    const personalSet = new Set(personalItemIds);
    return [
      ...coreItems.filter(i => !personalSet.has(i.id)),
      ...observationItems.filter(i => !personalSet.has(i.id)),
      ...optionalItems,
    ];
  }, [personalItemIds, observationItems]);

  const WEITERE_INITIAL_COUNT = 4;

  const getItemStats = (itemId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const entries = history.filter((h) => h.date === dateStr && h.symptom_id === itemId);
    const avgRating = entries.length === 0
      ? null
      : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
    return { dateStr, entries, hasEntry: entries.length > 0, avgRating };
  };

  const getChipClass = (isSelected: boolean): string =>
    `flex flex-col w-full min-h-12 items-center justify-center gap-1 rounded-xl px-3 py-2 text-body-small transition-all duration-200 border ${
      isSelected
        ? 'bg-[#EBF4EF] border-[#EBF4EF] text-[#243B2E]'
        : 'bg-[#F2F5F3] border-transparent text-foreground-400 hover:bg-[#EBF4EF]/50 hover:text-foreground-500'
    }`;


  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20" style={{ background: "#F7F8F7" }}>
        <div className="mx-auto max-w-4xl px-4 pt-0 pb-6 sm:px-6 lg:px-8">
          {/* Hero */}
          <div
            className="rounded-b-3xl px-4 pt-10 pb-8 -mx-4 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8 mb-8"
            style={{ background: "linear-gradient(180deg, #EEF5F2 0%, #F6F9F8 100%)" }}
          >
            <h1 className="text-center text-h4 sm:text-h3 font-medium" style={{ color: "#243B2E" }}>
              {t("Wie geht es dir heute?")}
            </h1>
            <p className="mt-1 text-center text-body-small" style={{ color: "#5E7468" }}>
              {format(selectedDate, 'd. MMMM yyyy', { locale: de })}
            </p>
            <p className="mt-3 text-center text-[13px]" style={{ color: "#8A9E93" }}>
              Ein kurzer Check-in hilft dir, Muster zu erkennen.
            </p>
          </div>

          {/* Datumsauswahl */}
          <div className="mb-8">
            <Calendar
              selectedDate={format(selectedDate, 'yyyy-MM-dd')}
              onDateSelect={(dateStr) => {
                setSelectedDate(parseISO(dateStr));
                setExpandedItems({});
                setExpandedTimeSlots({});
              }}
              maxDate={new Date()}
            />
          </div>

          {/* ═══ SEKTION 1: Deine Symptome ═══ */}
          <div className="mb-8">
            <h2 className="text-body font-medium text-foreground-800 mb-1">
              Deine Symptome
            </h2>
            <p className="text-[13px] text-foreground-300 mb-4">
              Symptome, die du regelmäßig erfasst.
            </p>
            <div className="rounded-2xl bg-[#FEFEFE] divide-y divide-background-200/40">
              {personalItemIds.map((itemId) => {
                const item = allItems.find((i) => i.id === itemId) || coreItems.find((i) => i.id === itemId);
                if (!item) return null;
                const { dateStr, hasEntry, avgRating } = getItemStats(itemId);
                const isExpanded = expandedItems[itemId];
                const selectedTimeSlot = expandedTimeSlots[itemId];
                return (
                  <div key={itemId} className="relative overflow-hidden first:rounded-t-2xl last:rounded-b-2xl">
                    {isRecentlySaved(itemId) && (
                      <div className="absolute top-2.5 right-3 z-10 animate-in fade-in duration-150">
                        <svg className="h-3.5 w-3.5 text-[#243B2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <button type="button" onClick={(e) => toggleItem(itemId, e)} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-all duration-200 hover:bg-background-50">
                      <span className="text-body font-normal text-foreground-800">{item.label}</span>
                      <div className="flex items-center gap-2">
                        {hasEntry && <span className="rounded-full bg-[#EBF4EF] px-2 py-0.5 text-[10px] font-medium text-[#243B2E]">Heute</span>}
                        {avgRating !== null && <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-medium text-foreground-500">Ø {avgRating}</span>}
                        <svg className={`h-3.5 w-3.5 text-foreground-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-background-200/40 p-5">
                        <p className="text-[11px] text-foreground-300 mb-3">Wann war das?</p>
                        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {TIME_SLOTS.map((slot) => (
                            <button key={slot.id} type="button" onClick={() => toggleTimeSlot(itemId, slot.id)}
                              className={getChipClass(selectedTimeSlot === slot.id)}
                              title={getTimeSlotLabel(slot.id)}
                            >
                              {getTimeSlotIcon(slot.id)}
                              <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                            </button>
                          ))}
                        </div>
                        {selectedTimeSlot && renderRatingScale(itemId, selectedTimeSlot)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ SEKTION 2: Weitere Symptome ═══ */}
          {(weitereItems.length > 0 || customSymptoms.length > 0) && (
            <div className="mb-8">
              <h2 className="text-[13px] font-medium text-foreground-400 mb-4">
                Weitere Symptome
              </h2>
              <div className="rounded-2xl bg-[#FEFEFE] divide-y divide-background-200/40">
                {(showAllWeitere ? weitereItems : weitereItems.slice(0, WEITERE_INITIAL_COUNT)).map((item) => {
                  const { avgRating } = getItemStats(item.id);
                  const isExpanded = expandedItems[item.id];
                  const selectedTimeSlot = expandedTimeSlots[item.id];
                  return (
                    <div key={item.id} className="relative overflow-hidden first:rounded-t-2xl last:rounded-b-2xl">
                      {isRecentlySaved(item.id) && (
                        <div className="absolute top-2.5 right-3 z-10 animate-in fade-in duration-150">
                          <svg className="h-3.5 w-3.5 text-[#243B2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <button type="button" onClick={(e) => toggleItem(item.id, e)} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-all duration-200 hover:bg-background-50">
                        <span className="text-body font-normal text-foreground-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {avgRating !== null && <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-medium text-foreground-500">Ø {avgRating}</span>}
                          <svg className={`h-3.5 w-3.5 text-foreground-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-background-200/40 p-5">
                          <p className="text-[11px] text-foreground-300 mb-3">Wann war das?</p>
                          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {TIME_SLOTS.map((slot) => (
                              <button key={slot.id} type="button" onClick={() => toggleTimeSlot(item.id, slot.id)}
                                className={getChipClass(selectedTimeSlot === slot.id)}
                                title={getTimeSlotLabel(slot.id)}
                              >
                                {getTimeSlotIcon(slot.id)}
                                <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                              </button>
                            ))}
                          </div>
                          {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Eigene Symptome inline */}
                {customSymptoms.map((item) => {
                  const { avgRating } = getItemStats(item.id);
                  const isExpanded = expandedItems[item.id];
                  const selectedTimeSlot = expandedTimeSlots[item.id];
                  return (
                    <div key={item.id} className="relative overflow-hidden first:rounded-t-2xl last:rounded-b-2xl">
                      {isRecentlySaved(item.id) && (
                        <div className="absolute top-2.5 right-14 z-10 animate-in fade-in duration-150">
                          <svg className="h-3.5 w-3.5 text-[#243B2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <div className="flex w-full items-center">
                        <button type="button" onClick={(e) => toggleItem(item.id, e)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-5 py-3.5 text-left transition-all duration-200 hover:bg-background-50">
                          <span className={`text-body font-normal text-foreground-700 ${isExpanded ? '' : 'truncate'}`}>{item.label}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {avgRating !== null && <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-medium text-foreground-500">Ø {avgRating}</span>}
                            <svg className={`h-3.5 w-3.5 text-foreground-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCustomSymptom(item.id); }}
                          className="flex h-8 w-10 flex-shrink-0 items-center justify-center mr-2 text-foreground-300 transition-colors hover:text-foreground-500" aria-label="Entfernen">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-background-200/40 p-5">
                          <p className="text-[11px] text-foreground-300 mb-3">Wann war das?</p>
                          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {TIME_SLOTS.map((slot) => (
                              <button key={slot.id} type="button" onClick={() => toggleTimeSlot(item.id, slot.id)}
                                className={getChipClass(selectedTimeSlot === slot.id)}
                                title={getTimeSlotLabel(slot.id)}
                              >
                                {getTimeSlotIcon(slot.id)}
                                <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                              </button>
                            ))}
                          </div>
                          {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Eigenes Symptom hinzufügen – Inline-Zeile */}
                <div className="px-5 py-3.5">
                  {showAddCustomSymptom ? (
                    <div className="flex items-center gap-2">
                      <input ref={newSymptomInputRef} type="text" value={newCustomSymptomName} onChange={(e) => setNewCustomSymptomName(e.target.value)}
                        placeholder="Name eingeben…" autoComplete="off"
                        className="min-w-0 flex-1 rounded-xl border border-[#EBF4EF] bg-[#FEFEFE] px-3 py-2 text-body text-foreground-900 placeholder:text-foreground-300 focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-100"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomSymptom(); if (e.key === 'Escape') { setNewCustomSymptomName(''); setShowAddCustomSymptom(false); } }}
                      />
                      <button type="button" onClick={handleAddCustomSymptom} className="rounded-xl bg-[#6FB48F] px-3 py-2 text-body-small font-medium text-white hover:bg-[#5EA37E] transition">Speichern</button>
                      <button type="button" onClick={() => { setNewCustomSymptomName(''); setShowAddCustomSymptom(false); }} className="text-[12px] text-foreground-300 hover:text-foreground-500 transition">Abbrechen</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowAddCustomSymptom(true)} className="flex items-center gap-2 text-[13px] text-foreground-400 hover:text-foreground-600 transition">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      Eigenes Symptom hinzufügen
                    </button>
                  )}
                </div>
              </div>

              {!showAllWeitere && weitereItems.length > WEITERE_INITIAL_COUNT && (
                <button type="button" onClick={() => setShowAllWeitere(true)} className="mt-3 flex items-center gap-1.5 text-[13px] text-foreground-400 hover:text-foreground-600 transition mx-auto">
                  <span>{weitereItems.length - WEITERE_INITIAL_COUNT} weitere anzeigen</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
              {showAllWeitere && weitereItems.length > WEITERE_INITIAL_COUNT && (
                <button type="button" onClick={() => setShowAllWeitere(false)} className="mt-3 flex items-center gap-1.5 text-[13px] text-foreground-300 hover:text-foreground-500 transition mx-auto">
                  <span>Weniger anzeigen</span>
                  <svg className="h-3 w-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Snackbar für Undo nach Löschen */}
      {undoState && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 rounded-xl bg-[#FEFEFE] px-4 py-3 border border-[#EBF4EF]">
            <span className="text-body-small text-foreground-600">Eintrag gelöscht</span>
            <button type="button" onClick={undoDelete} className="text-body-small font-medium text-primary-500 hover:text-primary-600 transition-colors">
              Rückgängig
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
