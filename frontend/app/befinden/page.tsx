"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { befindenApi, Befinden } from "@/lib/api";
import { toastService } from "@/components/ui";
import { Calendar } from "@/components/ui/Calendar";
import { useRoleText } from "@/lib/hooks/useRoleText";

type TimeOfDay = "morning" | "noon" | "evening";

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
  if (value <= 2) return "kaum belastend";
  if (value <= 4) return "leicht belastend";
  if (value <= 6) return "mäßig belastend";
  if (value <= 8) return "stark belastend";
  return "sehr stark belastend";
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
  
  // Optionale Symptome ein-/ausblenden
  const [showOptionalItems, setShowOptionalItems] = useState(false);

  // Alle verfügbaren Items (Kern + Beobachtungen + Optional + Custom)
  const allItems = useMemo(() => {
    const items: Array<{ id: string; label: string; type: 'core' | 'optional' | 'custom' | 'observation' }> = [];
    
    items.push(...coreItems.map(item => ({ ...item, type: 'core' as const })));
    items.push(...observationItems.map(item => ({ ...item, type: 'observation' as const })));
    
    if (showOptionalItems) {
      items.push(...optionalItems.map(item => ({ ...item, type: 'optional' as const })));
    }
    
    items.push(...customSymptoms.map(item => ({ ...item, type: 'custom' as const })));
    
    return items;
  }, [showOptionalItems, customSymptoms, observationItems]);
      
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
    } catch (error: any) {
      const errorMessage = error?.message || 'Fehler beim Laden der Daten';
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
  const getTimeSlotIcon = (timeSlotId: TimeOfDay | 'allDay') => {
    switch (timeSlotId) {
      case 'allDay':
          return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
      case 'morning':
        // Sonnenaufgang-Icon - Sonne über dem Horizont
          return (
          <svg className="h-6 w-6 overflow-visible" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {/* Horizont-Linie */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19h18" />
            {/* Sonne (Halbkreis über dem Horizont) */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19c-2.5 0-4.5-2-4.5-4.5S9.5 10 12 10s4.5 2 4.5 4.5S14.5 19 12 19z" />
            {/* Sonnenstrahlen */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10V8M10 19H8M14 19H16M7.5 11.5L6 10M7.5 16.5L6 18M16.5 11.5L18 10M16.5 16.5L18 18" />
            </svg>
          );
      case 'noon':
        // Sonne hoch am Himmel
          return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          );
      case 'evening':
          return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          );
        default:
        return null;
    }
  };

  // Label für Zeitpunkt (für Tooltip)
  const getTimeSlotLabel = (timeSlotId: TimeOfDay | 'allDay'): string => {
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

  // Farbe basierend auf Rating-Wert (Grün → Gelb → Orange → Rot, gedeckte Farben)
  const getRatingColor = (rating: number): string => {
    if (rating <= 2) return 'rating-green';
    if (rating <= 4) return 'rating-lime';
    if (rating <= 6) return 'rating-yellow';
    if (rating <= 8) return 'rating-orange';
    return 'rating-red';
  };

  // Farbe als CSS-Wert für Slider-Thumb
  const getRatingColorVar = (rating: number): string => {
    const colorMap: Record<string, string> = {
      'rating-green': 'oklch(0.65 0.12 145)',
      'rating-lime': 'oklch(0.65 0.10 120)',
      'rating-yellow': 'oklch(0.68 0.12 85)',
      'rating-orange': 'oklch(0.62 0.14 55)',
      'rating-red': 'oklch(0.55 0.14 25)',
    };
    return colorMap[getRatingColor(rating)] || colorMap['rating-green'];
  };

  // Slider-Style basierend auf Rating-Wert
  const getSliderStyle = (rating: number | null): React.CSSProperties => {
    if (rating === null) {
      return {
        '--slider-thumb-color': 'oklch(0.65 0.12 145)',
        '--slider-fill-color': 'oklch(0.65 0.12 145)',
        '--slider-fill-percentage': '50%',
      } as React.CSSProperties;
    }
    const percentage = ((rating - 1) / 9) * 100;
    const color = getRatingColorVar(rating);
    return {
      '--slider-thumb-color': color,
      '--slider-fill-color': color,
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
    const isSaved = savedConfirmations[key];
    const deleteConf = deleteConfirmations[itemId];

    return (
      <div className="mt-4 space-y-3 rounded-lg border border-background-200 bg-background-25 p-4">
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
                className={`flex-1 rounded border py-1 text-body-small font-medium transition-colors duration-150 ease-out ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-foreground-900'
                    : 'border-transparent bg-background-10 text-foreground-700 hover:bg-background-25'
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
          value={tempRating ?? 5.5}
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
          <div className="flex flex-col items-center gap-2 transition-opacity duration-150 ease-out">
            <p className="text-body-small font-medium text-foreground-700">
              {tempRating} - {getScaleDescription(tempRating)}
              {isSaved && (
                <span className="ml-2 text-[11px] text-foreground-500 animate-in fade-in duration-300">Gespeichert</span>
              )}
            </p>
            {existingRating !== null && (
                    <button
                      type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEntry(dateStr, itemId, selectedTimeSlot);
                }}
                className="text-body-small text-foreground-500 hover:text-foreground-700 transition-colors duration-150 ease-out underline"
              >
                Eintrag für diesen Tag löschen
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
            <div className="mt-4 space-y-3 border-t border-background-200 pt-4">
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
                  className="w-full rounded-lg border border-background-200 bg-background-10 px-4 py-2 text-body text-foreground-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                  </div>
              <div>
                <label className="mb-1 block text-body-small text-foreground-600">
                  Grund (optional)
                </label>
                <input
                  type="text"
                  value={currentReason}
                  onChange={(e) => {
                    setMedicationReason((prev) => ({ ...prev, [medicationKey]: e.target.value }));
                  }}
                  placeholder="z.B. Vergessen, Nebenwirkungen"
                  className="w-full rounded-lg border border-background-200 bg-background-10 px-4 py-2 text-body text-foreground-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div className="mt-4 flex gap-2 border-t border-background-200 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveChanges(itemId, selectedTimeSlot);
                }}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-primary-500 bg-primary-500 px-4 py-2 text-body-small font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 rounded-lg border border-background-300 bg-background-10 px-4 py-2 text-body-small font-medium text-foreground-700 transition-colors hover:bg-background-25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Löschen
              </button>
            </div>
          );
        })()}

        {deleteConf && ((isAllDay && deleteConf.timeOfDay === 'allDay') || (!isAllDay && deleteConf.timeOfDay === timeOfDay)) && (
          <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3">
            <p className="mb-2 text-body-small text-foreground-900">
              {isAllDay ? 'Alle Einträge für diesen Tag wirklich löschen?' : 'Eintrag wirklich löschen?'}
              </p>
            <div className="flex gap-2">
                <button
                  type="button"
                onClick={() => confirmDeleteEntry(itemId)}
                className="rounded bg-warning-500 px-3 py-1.5 text-body-small font-medium text-white hover:bg-warning-600"
                >
                Löschen
                </button>
                <button
                  type="button"
                onClick={() => cancelDeleteEntry(itemId)}
                className="rounded border border-background-300 bg-background-10 px-3 py-1.5 text-body-small font-medium text-foreground-700 hover:bg-background-25"
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


                    return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-50 pb-20">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-center text-h3 font-semibold text-foreground-900">
            {t("Wie geht es dir?")}
          </h1>
          <p className="mb-6 text-center text-body-small text-foreground-500">
            {t("Erfasse dein Befinden täglich. Detaillierte Werte und Muster findest du in der Analyse.")}
          </p>

          {/* Datumsauswahl */}
          <div className="mb-6">
            <Calendar
              selectedDate={format(selectedDate, 'yyyy-MM-dd')}
              onDateSelect={(dateStr) => {
                setSelectedDate(parseISO(dateStr));
                // Reset expanded items when date changes
                setExpandedItems({});
                setExpandedTimeSlots({});
              }}
              maxDate={new Date()}
            />
          </div>

          {/* Favoriten (häufig verwendete Items) – Bewertung öffnet direkt darunter */}
          {favoriteItems.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 mt-2 text-h4 font-semibold text-foreground-900">
                {t("Deine häufigsten Beschwerden")}
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {favoriteItems.map((itemId) => {
                  const item = allItems.find((i) => i.id === itemId);
                  if (!item) return null;

                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const entries = history.filter(
                    (h) => h.date === dateStr && h.symptom_id === itemId
                  );
                  const hasEntry = entries.length > 0;
                  const avgRating = entries.length === 0
                    ? null
                    : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
                  const isExpanded = expandedItems[itemId];
                  const selectedTimeSlot = expandedTimeSlots[itemId];

                  return (
                    <div key={itemId} className="rounded-lg border border-background-200 bg-background-10 overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => toggleItem(itemId, e)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-25"
                      >
                        <span className="text-body font-medium text-foreground-900">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {hasEntry && (
                            <span className="rounded-full bg-primary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Heute
                            </span>
                          )}
                          {avgRating !== null && (
                            <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Ø {avgRating}
                            </span>
                          )}
                          {(entries.length > 0 || Object.keys(tempRatings[itemId] || {}).length > 0) && (
                            <svg className="h-5 w-5 text-foreground-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <svg className="h-4 w-4 text-foreground-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-background-200 p-4">
                          {(() => {
                            const timeSlots: Array<{ id: TimeOfDay | 'allDay' }> = [
                              { id: 'allDay' },
                              { id: 'morning' },
                              { id: 'noon' },
                              { id: 'evening' },
                            ];
                            return (
                              <>
                                <div className="mb-3">
                                  <p className="text-[11px] text-foreground-500 mb-2">Optional</p>
                                </div>
                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.id;
                                    const isAllDay = slot.id === 'allDay';
                                    let displayRating: number | null = null;
                                    if (isAllDay) {
                                      const dayEntries = history.filter(
                                        (h) => h.date === dateStr && h.symptom_id === itemId
                                      );
                                      if (dayEntries.length > 0) {
                                        const sum = dayEntries.reduce((acc, e) => acc + (e.rating || 0), 0);
                                        displayRating = Math.round(sum / dayEntries.length);
                                      }
                                    } else {
                                      displayRating = getRatingForTimeSlot(selectedDate, itemId, slot.id as TimeOfDay);
                                    }
                                    const hasExistingEntry = isAllDay
                                      ? (history.some((h) => h.date === dateStr && h.symptom_id === itemId) || (tempRatings[itemId]?.allDay !== undefined && tempRatings[itemId]?.allDay !== null))
                                      : (history.some((h) => h.date === dateStr && h.symptom_id === itemId && h.time_of_day === slot.id) || (tempRatings[itemId]?.[slot.id as TimeOfDay] !== undefined && tempRatings[itemId]?.[slot.id as TimeOfDay] !== null));
                                    return (
                                      <div key={slot.id} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => toggleTimeSlot(itemId, slot.id)}
                                          className={`flex flex-col w-full min-h-16 items-center justify-center gap-1 rounded-lg border px-3 py-3 text-body transition-colors duration-150 ease-out relative ${
                                            isSelected
                                              ? 'border-primary-500 bg-primary-50 text-foreground-900'
                                              : 'border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25'
                                          }`}
                                          title={getTimeSlotLabel(slot.id)}
                                        >
                                          {hasExistingEntry && (
                                            <svg className="absolute top-2 right-2 h-4 w-4 text-foreground-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                          {getTimeSlotIcon(slot.id)}
                                          <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                                {selectedTimeSlot && renderRatingScale(itemId, selectedTimeSlot)}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Häufige Beschwerden */}
          <div className="mb-6">
              <div className="mb-4 mt-2">
                <h2 className="text-h4 font-semibold text-foreground-900">
                  Häufige Beschwerden
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {/* Standard Kern-Items */}
                {coreItems.map((item) => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const entries = history.filter(
                    (h) => h.date === dateStr && h.symptom_id === item.id
                  );
                  const avgRating = entries.length === 0 
                    ? null 
                    : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
                  const isExpanded = expandedItems[item.id];

                    return (
                    <div key={item.id} className="rounded-lg border border-background-200 bg-background-10 overflow-hidden">
                        <button
                          type="button"
                        onClick={(e) => toggleItem(item.id, e)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-25"
                      >
                        <span className="text-body font-medium text-foreground-900">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {avgRating !== null && (
                            <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Ø {avgRating}
                                </span>
                              )}
                          {(entries.length > 0 || Object.keys(tempRatings[item.id] || {}).length > 0) && (
                            <svg className="h-5 w-5 text-foreground-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                              )}
                          <svg className="h-4 w-4 text-foreground-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                            </div>
                        </button>

                      {/* Tageszeit-Auswahl - erscheint direkt unter dem Item */}
                        {isExpanded && (
                        <div className="border-t border-background-200 p-4">
                          {(() => {
                            const timeSlots: Array<{ id: TimeOfDay | 'allDay' }> = [
                              { id: 'allDay' },
                              { id: 'morning' },
                              { id: 'noon' },
                              { id: 'evening' },
                            ];
                            const selectedTimeSlot = expandedTimeSlots[item.id];

                                              return (
                              <>
                                {/* Tageszeit-Auswahl */}
                                <div className="mb-3">
                                  <p className="text-[11px] text-foreground-500 mb-2">Optional</p>
                                          </div>
                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.id;
                                    const isAllDay = slot.id === 'allDay';
                                    
                                    let displayRating: number | null = null;
                                    if (isAllDay) {
                                      const entries = history.filter(
                                        (h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id
                                      );
                                      if (entries.length > 0) {
                                        const sum = entries.reduce((acc, e) => acc + (e.rating || 0), 0);
                                        displayRating = Math.round(sum / entries.length);
                                      }
                                    } else {
                                      displayRating = getRatingForTimeSlot(selectedDate, item.id, slot.id as TimeOfDay);
                                    }
                                    
                                    const tempRating = isAllDay 
                                      ? (tempRatings[item.id]?.allDay ?? displayRating ?? null)
                                      : (tempRatings[item.id]?.[slot.id as TimeOfDay] ?? displayRating ?? null);
                                    
                                    // Prüfe ob Eintrag existiert: in History oder in tempRatings (während Speichern)
                                    const hasExistingEntry = isAllDay 
                                      ? (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id) || (tempRatings[item.id]?.allDay !== undefined && tempRatings[item.id]?.allDay !== null))
                                      : (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id && h.time_of_day === slot.id) || (tempRatings[item.id]?.[slot.id as TimeOfDay] !== undefined && tempRatings[item.id]?.[slot.id as TimeOfDay] !== null));
                                    
                                              return (
                                      <div key={slot.id} className="relative">
                                                <button
                                                  type="button"
                                          onClick={() => toggleTimeSlot(item.id, slot.id)}
                                              className={`flex flex-col w-full min-h-16 items-center justify-center gap-1 rounded-lg border px-3 py-3 text-body transition-colors duration-150 ease-out relative ${
                                                    isSelected
                                              ? 'border-primary-500 bg-primary-50 text-foreground-900'
                                              : 'border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25'
                                          }`}
                                          title={getTimeSlotLabel(slot.id)}
                                        >
                                          {hasExistingEntry && (
                                            <svg className="absolute top-2 right-2 h-4 w-4 text-foreground-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                          {getTimeSlotIcon(slot.id)}
                                          <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                                                </button>
                                      </div>
                                              );
                                            })}
                                          </div>

                                {/* Skala - erscheint direkt unter der Tageszeit-Auswahl */}
                                {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                              </>
                              );
                            })()}
                          </div>
                                        )}
                                      </div>
                    );
                  })}
                {/* Beobachtungs-Items (automatisch hinzugefügt) */}
                {observationItems.map((item) => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const entries = history.filter(
                    (h) => h.date === dateStr && h.symptom_id === item.id
                  );
                  const avgRating = entries.length === 0 
                    ? null 
                    : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
                  const isExpanded = expandedItems[item.id];

                      return (
                    <div key={item.id} className="rounded-lg border border-background-200 bg-background-10 overflow-hidden">
                                                <button
                                                  type="button"
                        onClick={(e) => toggleItem(item.id, e)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-25"
                      >
                        <span className="text-body font-medium text-foreground-900">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {avgRating !== null && (
                            <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Ø {avgRating}
                            </span>
                          )}
                          <svg className="h-4 w-4 text-foreground-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                                            </button>

                      {/* Tageszeit-Auswahl - erscheint direkt unter dem Item */}
                        {isExpanded && (
                        <div className="border-t border-background-200 p-4">
                          {(() => {
                            const timeSlots: Array<{ id: TimeOfDay | 'allDay' }> = [
                              { id: 'allDay' },
                              { id: 'morning' },
                              { id: 'noon' },
                              { id: 'evening' },
                            ];
                            const selectedTimeSlot = expandedTimeSlots[item.id];
                                
                                  return (
                              <>
                                {/* Tageszeit-Auswahl */}
                                <div className="mb-3">
                                  <p className="text-[11px] text-foreground-500 mb-2">Optional</p>
                                        </div>
                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.id;
                                    const isAllDay = slot.id === 'allDay';
                                    
                                    let displayRating: number | null = null;
                                    if (isAllDay) {
                                      const entries = history.filter(
                                        (h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id
                                      );
                                      if (entries.length > 0) {
                                        const sum = entries.reduce((acc, e) => acc + (e.rating || 0), 0);
                                        displayRating = Math.round(sum / entries.length);
                                      }
                                    } else {
                                      displayRating = getRatingForTimeSlot(selectedDate, item.id, slot.id as TimeOfDay);
                                    }
                                    
                                    const tempRating = isAllDay 
                                      ? (tempRatings[item.id]?.allDay ?? displayRating ?? null)
                                      : (tempRatings[item.id]?.[slot.id as TimeOfDay] ?? displayRating ?? null);
                                    
                                    // Prüfe ob Eintrag existiert: in History oder in tempRatings (während Speichern)
                                    const hasExistingEntry = isAllDay 
                                      ? (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id) || (tempRatings[item.id]?.allDay !== undefined && tempRatings[item.id]?.allDay !== null))
                                      : (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id && h.time_of_day === slot.id) || (tempRatings[item.id]?.[slot.id as TimeOfDay] !== undefined && tempRatings[item.id]?.[slot.id as TimeOfDay] !== null));
                                    
                                    return (
                                      <div key={slot.id} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => toggleTimeSlot(item.id, slot.id)}
                                          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-body transition-colors duration-150 ease-out ${
                                            isSelected
                                              ? 'border-primary-500 bg-primary-50 text-foreground-900'
                                              : 'border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25'
                                          }`}
                                          title={getTimeSlotLabel(slot.id)}
                                        >
                                          {getTimeSlotIcon(slot.id)}
                                        </button>
                                        {hasExistingEntry && !isSelected && (
                                          <button
                                            type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                              requestDeleteEntry(format(selectedDate, 'yyyy-MM-dd'), item.id, slot.id);
                                        }}
                                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning-500 text-white hover:bg-warning-600"
                                            title="Löschen"
                                          >
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                    );
                  })}
                                  </div>

                                {/* Skala - erscheint direkt unter der Tageszeit-Auswahl */}
                                {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                              </>
                              );
                            })()}
                                            </div>
                                          )}
                                        </div>
                    );
                  })}
                                      </div>
                                    </div>

          {/* Optionale Symptome */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowOptionalItems(!showOptionalItems)}
              className="mb-4 mt-2 flex items-center gap-2 text-body font-medium text-foreground-600 hover:text-foreground-700 transition-colors"
            >
              <span className="text-foreground-400 text-sm">{showOptionalItems ? '▼' : '▶'}</span>
              <span>Optionale Symptome</span>
            </button>
            {showOptionalItems && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {optionalItems.map((item) => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const entries = history.filter(
                    (h) => h.date === dateStr && h.symptom_id === item.id
                  );
                  const avgRating = entries.length === 0
                    ? null
                    : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
                  const isExpanded = expandedItems[item.id];
                  const selectedTimeSlot = expandedTimeSlots[item.id];

                  return (
                    <div key={item.id} className="rounded-lg border border-background-200 bg-background-10 overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => toggleItem(item.id, e)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-25"
                      >
                        <span className="text-body font-medium text-foreground-900">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {entries.length > 0 && (
                            <span className="rounded-full bg-primary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Heute
                            </span>
                          )}
                          {avgRating !== null && (
                            <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                              Ø {avgRating}
                            </span>
                          )}
                          {(entries.length > 0 || Object.keys(tempRatings[item.id] || {}).length > 0) && (
                            <svg className="h-5 w-5 text-foreground-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <svg className="h-4 w-4 text-foreground-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-background-200 p-4">
                          {(() => {
                            const timeSlots: Array<{ id: TimeOfDay | 'allDay' }> = [
                              { id: 'allDay' },
                              { id: 'morning' },
                              { id: 'noon' },
                              { id: 'evening' },
                            ];
                            return (
                              <>
                                <div className="mb-3">
                                  <p className="text-[11px] text-foreground-500 mb-2">Optional</p>
                                </div>
                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.id;
                                    const isAllDay = slot.id === 'allDay';
                                    let displayRating: number | null = null;
                                    if (isAllDay) {
                                      const dayEntries = history.filter(
                                        (h) => h.date === dateStr && h.symptom_id === item.id
                                      );
                                      if (dayEntries.length > 0) {
                                        const sum = dayEntries.reduce((acc, e) => acc + (e.rating || 0), 0);
                                        displayRating = Math.round(sum / dayEntries.length);
                                      }
                                    } else {
                                      displayRating = getRatingForTimeSlot(selectedDate, item.id, slot.id as TimeOfDay);
                                    }
                                    const hasExistingEntry = isAllDay
                                      ? (history.some((h) => h.date === dateStr && h.symptom_id === item.id) || (tempRatings[item.id]?.allDay !== undefined && tempRatings[item.id]?.allDay !== null))
                                      : (history.some((h) => h.date === dateStr && h.symptom_id === item.id && h.time_of_day === slot.id) || (tempRatings[item.id]?.[slot.id as TimeOfDay] !== undefined && tempRatings[item.id]?.[slot.id as TimeOfDay] !== null));
                                    return (
                                      <div key={slot.id} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => toggleTimeSlot(item.id, slot.id)}
                                          className={`flex flex-col w-full min-h-16 items-center justify-center gap-1 rounded-lg border px-3 py-3 text-body transition-colors duration-150 ease-out relative ${
                                            isSelected
                                              ? 'border-primary-500 bg-primary-50 text-foreground-900'
                                              : 'border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25'
                                          }`}
                                          title={getTimeSlotLabel(slot.id)}
                                        >
                                          {hasExistingEntry && (
                                            <svg className="absolute top-2 right-2 h-4 w-4 text-foreground-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                          {getTimeSlotIcon(slot.id)}
                                          <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                                {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Eigene Symptome */}
          <div className="mb-6">
            <div className="mb-4 mt-2 flex items-center justify-between">
              <h2 className="text-h4 font-semibold text-foreground-900">
                {t("Eigene Symptome")}
              </h2>
                                        <button
                                          type="button"
                onClick={() => setShowAddCustomSymptom(!showAddCustomSymptom)}
                className="rounded-lg border border-primary-500 bg-primary-50 px-3 py-1.5 text-body-small font-medium text-foreground-700 hover:bg-primary-100"
              >
                + Hinzufügen
                                        </button>
                        </div>
            {showAddCustomSymptom && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  ref={newSymptomInputRef}
                  type="text"
                  value={newCustomSymptomName}
                  onChange={(e) => setNewCustomSymptomName(e.target.value)}
                  placeholder="Name des Symptoms"
                  autoComplete="off"
                  className="min-w-[12rem] max-w-xs flex-1 rounded-lg border border-background-200 bg-background-10 px-4 py-2 text-body text-foreground-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomSymptom();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomSymptomName('');
                    setShowAddCustomSymptom(false);
                  }}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-foreground-400 transition-colors hover:bg-background-200 hover:text-foreground-600"
                  aria-label="Eingabe verwerfen"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomSymptom}
                  className="rounded-lg border border-primary-500 bg-primary-500 px-4 py-2 text-body-small font-medium text-white hover:bg-primary-600"
                >
                  Speichern
                </button>
              </div>
            )}
            {customSymptoms.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {customSymptoms.map((item) => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const entries = history.filter(
                    (h) => h.date === dateStr && h.symptom_id === item.id
                  );
                  const avgRating = entries.length === 0 
                    ? null 
                    : Math.round(entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length);
                  const isExpanded = expandedItems[item.id];

                      return (
                    <div key={item.id} className="rounded-lg border border-background-200 bg-background-10 overflow-hidden">
                      <div className="flex min-h-[48px] w-full items-stretch">
                        <button
                          type="button"
                          onClick={(e) => toggleItem(item.id, e)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 px-4 py-3 pr-2 text-left transition-colors hover:bg-background-25 active:bg-background-200 sm:max-w-[calc(100%-3rem)]"
                        >
                          <span className={`text-body font-medium text-foreground-900 ${isExpanded ? '' : 'truncate'}`}>{item.label}</span>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {avgRating !== null && (
                              <span className="rounded-full bg-secondary-200 px-2 py-0.5 text-[10px] font-medium text-foreground-700">
                                Ø {avgRating}
                              </span>
                            )}
                            {(entries.length > 0 || Object.keys(tempRatings[item.id] || {}).length > 0) && (
                              <svg className="h-5 w-5 text-foreground-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <svg className="h-4 w-4 text-foreground-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveCustomSymptom(item.id);
                          }}
                          className="flex h-10 w-12 min-w-[48px] flex-shrink-0 items-center justify-center self-center text-foreground-400 transition-colors hover:bg-background-200 hover:text-foreground-600"
                          aria-label="Symptom aus Liste entfernen"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Tageszeit-Auswahl - erscheint direkt unter dem Item */}
                        {isExpanded && (
                        <div className="border-t border-background-200 p-4">
                          {(() => {
                            const timeSlots: Array<{ id: TimeOfDay | 'allDay' }> = [
                              { id: 'allDay' },
                              { id: 'morning' },
                              { id: 'noon' },
                              { id: 'evening' },
                            ];
                            const selectedTimeSlot = expandedTimeSlots[item.id];
                                
                                return (
                              <>
                                {/* Tageszeit-Auswahl */}
                                <div className="mb-3">
                                  <p className="text-[11px] text-foreground-500 mb-2">Optional</p>
                                      </div>
                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {timeSlots.map((slot) => {
                                    const isSelected = selectedTimeSlot === slot.id;
                                    const isAllDay = slot.id === 'allDay';
                                    
                                    let displayRating: number | null = null;
                                    if (isAllDay) {
                                      const entries = history.filter(
                                        (h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id
                                      );
                                      if (entries.length > 0) {
                                        const sum = entries.reduce((acc, e) => acc + (e.rating || 0), 0);
                                        displayRating = Math.round(sum / entries.length);
                                      }
                                    } else {
                                      displayRating = getRatingForTimeSlot(selectedDate, item.id, slot.id as TimeOfDay);
                                    }
                                    
                                    const tempRating = isAllDay 
                                      ? (tempRatings[item.id]?.allDay ?? displayRating ?? null)
                                      : (tempRatings[item.id]?.[slot.id as TimeOfDay] ?? displayRating ?? null);
                                    
                                    // Prüfe ob Eintrag existiert: in History oder in tempRatings (während Speichern)
                                    const hasExistingEntry = isAllDay 
                                      ? (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id) || (tempRatings[item.id]?.allDay !== undefined && tempRatings[item.id]?.allDay !== null))
                                      : (history.some((h) => h.date === format(selectedDate, 'yyyy-MM-dd') && h.symptom_id === item.id && h.time_of_day === slot.id) || (tempRatings[item.id]?.[slot.id as TimeOfDay] !== undefined && tempRatings[item.id]?.[slot.id as TimeOfDay] !== null));
                              
                              return (
                                      <div key={slot.id} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => toggleTimeSlot(item.id, slot.id)}
                                          className={`flex flex-col w-full min-h-16 items-center justify-center gap-1 rounded-lg border px-3 py-3 text-body transition-colors duration-150 ease-out relative ${
                                            isSelected
                                              ? 'border-primary-500 bg-primary-50 text-foreground-900'
                                              : 'border-background-200 bg-background-10 text-foreground-700 hover:bg-background-25'
                                          }`}
                                          title={getTimeSlotLabel(slot.id)}
                                        >
                                          {hasExistingEntry && (
                                            <svg className="absolute top-2 right-2 h-4 w-4 text-foreground-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                          {getTimeSlotIcon(slot.id)}
                                          <span className="text-[10px] font-medium leading-none">{getTimeSlotLabel(slot.id)}</span>
                                        </button>
                                      </div>
                      );
                    })}
                </div>

                                {/* Skala - erscheint direkt unter der Tageszeit-Auswahl */}
                                {selectedTimeSlot && renderRatingScale(item.id, selectedTimeSlot)}
                              </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                                </div>
                              )}
                            </div>
                                              </div>
                                            </div>

      {/* Snackbar für Undo nach Löschen */}
      {undoState && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-background-200 bg-background-10 px-4 py-3 shadow-lg">
            <span className="text-body-small text-foreground-700">Eintrag gelöscht ·</span>
                        <button
                          type="button"
              onClick={undoDelete}
              className="text-body-small font-medium text-foreground-900 underline hover:text-foreground-700 transition-colors"
            >
              Rückgängig
                        </button>
                                        </div>
                                              </div>
                                            )}
    </ProtectedRoute>
  );
}
