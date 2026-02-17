"use client";

import { useState, useEffect, type ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile, feedbackApi, FeedbackData, Seizure, Befinden } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoleText } from "@/lib/hooks/useRoleText";
import { useRouter } from "next/navigation";
import { format, parseISO, subMonths, eachDayOfInterval, isSameDay } from "date-fns";
import { de } from "date-fns/locale";

// ─── Shared CSS Classes ──────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-xl border border-background-200/60 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200";

const CSS = {
  input: `${inputBase} transition`,
  select: inputBase,
  textarea: `${inputBase} resize-none`,
  btnCancel:
    "flex-1 rounded-xl border-2 border-background-200/60 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-700 transition hover:bg-background-50",
  btnPrimary:
    "flex-1 rounded-xl bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-white transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed",
  btnDanger:
    "flex-1 rounded-xl bg-warning-500 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-white transition hover:bg-warning-600 disabled:opacity-60 disabled:cursor-not-allowed",
  btnClose:
    "flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl text-foreground-600 transition hover:bg-background-100",
  actionBtn:
    "w-full rounded-xl border border-background-200/60 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-700 transition hover:bg-background-50 text-left",
} as const;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

interface IconProps { className?: string }

const IconUser = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const IconDownload = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const IconBell = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const IconChat = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

const IconScale = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
  </svg>
);

const IconInfo = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const IconCog = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const IconWarning = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const IconLogout = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const IconChevronDown = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Reusable UI Components ──────────────────────────────────────────────────

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white border border-background-200/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-[var(--spacing-m)] py-[var(--spacing-s)] bg-white transition-colors hover:bg-background-100 cursor-pointer"
      >
        <div className="flex items-center gap-[var(--spacing-xs)] min-w-0">
          <span className="text-primary-400 shrink-0">{icon}</span>
          <h2 className="text-body font-medium text-foreground-900 truncate">{title}</h2>
        </div>
        <span className={`text-foreground-300 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <IconChevronDown className="w-4 h-4" />
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-background-100">
          <div className="px-[var(--spacing-m)] py-[var(--spacing-m)]">{children}</div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-body-small text-foreground-400">{label}</span>
      <span className="text-body-small font-medium text-foreground-900">{value}</span>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-[var(--spacing-m)]">
      <div className="min-w-0">
        <p className="text-body font-medium text-foreground-800">{label}</p>
        <p className="text-body-small text-foreground-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
          checked ? "bg-primary-500" : "bg-background-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function InlineModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay">
      <div className="modal-container border border-primary-500 ring-2 ring-primary-200 overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200/60 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
            <h2 className="text-body font-medium text-foreground-900">{title}</h2>
            <button type="button" onClick={onClose} className={CSS.btnClose} aria-label="Schließen">
              <CloseIcon />
            </button>
          </div>
          <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, required, hint }: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-[var(--spacing-xs)]">
      <label className="text-body font-medium text-foreground-800">
        {label} {required && <span className="text-foreground-800">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={CSS.input}
      />
      {hint && <p className="text-body-small text-foreground-600">{hint}</p>}
    </div>
  );
}

function ModalActions({ onCancel, onSave, isSaving, saveLabel = "Speichern", savingLabel = "Speichert...", variant = "primary", disabled }: {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
  savingLabel?: string;
  variant?: "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
      <button type="button" onClick={onCancel} className={CSS.btnCancel}>Abbrechen</button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || disabled}
        className={variant === "danger" ? CSS.btnDanger : CSS.btnPrimary}
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </div>
  );
}

// ─── Chart Helpers for PDF Export ─────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
  "sleep-rhythm": "Schlaf-Wach-Rhythmus",
  fatigue: "Müdigkeit / Erschöpfung",
  concentration: "Konzentration",
  restlessness: "Innere Unruhe",
  sensitivity: "Reizempfindlichkeit",
  stress: "Stress",
  irritability: "Reizbarkeit",
  "medication-adherence": "Medikamente weggelassen?",
  pain: "Schmerzen",
  depression: "Depressive Belastung",
  anxiety: "Angst",
  headache: "Kopfschmerz",
  menstrual: "Zyklusbezogene Beschwerden",
};

function buildSeizureBarChartSvg(seizures: Seizure[]): string {
  // Anfälle pro Monat als Balkendiagramm (letzte 12 Monate)
  const end = new Date();
  const start = subMonths(end, 11);
  const months: { key: string; label: string; count: number }[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM yy", { locale: de });
    const count = seizures.filter((s) => s.date.startsWith(key)).reduce((sum, s) => sum + (s.seizure_count || 1), 0);
    months.push({ key, label, count });
    d.setMonth(d.getMonth() + 1);
  }

  const maxCount = Math.max(...months.map((m) => m.count), 1);
  const barW = 1000 / months.length;
  const bars = months.map((m, i) => {
    const barH = (m.count / maxCount) * 160;
    const x = i * barW + barW * 0.15;
    const w = barW * 0.7;
    return `<rect x="${x}" y="${200 - barH - 20}" width="${w}" height="${barH}" fill="#1f2a44" opacity="0.7" rx="2"/>
      <text x="${x + w / 2}" y="${195}" text-anchor="middle" font-size="18" fill="#555">${m.label}</text>
      ${m.count > 0 ? `<text x="${x + w / 2}" y="${200 - barH - 25}" text-anchor="middle" font-size="16" fill="#1f2a44" font-weight="bold">${m.count}</text>` : ""}`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" width="1000" height="200">
  <line x1="0" y1="180" x2="1000" y2="180" stroke="#ddd" stroke-width="1"/>
  ${bars}
</svg>`;
}

function buildSignalChartSvg(befindenData: Befinden[], seizures: Seizure[], symptomId: string): string {
  const end = new Date();
  const start = subMonths(end, 5);
  const days = eachDayOfInterval({ start, end });

  // Tagesschnitte berechnen
  const dayMap: Record<string, number[]> = {};
  befindenData
    .filter((b) => b.symptom_id === symptomId && b.rating != null)
    .forEach((b) => {
      const key = b.date.slice(0, 10);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(b.rating!);
    });
  const avgByDay: Record<string, number> = {};
  for (const [k, v] of Object.entries(dayMap)) {
    avgByDay[k] = v.reduce((a, b) => a + b, 0) / v.length;
  }

  const values = Object.values(avgByDay);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 10;

  const points = days.map((day, i) => {
    const key = format(day, "yyyy-MM-dd");
    const val = avgByDay[key];
    if (val === undefined) return null;
    const x = (i / Math.max(days.length - 1, 1)) * 1000;
    const normalized = max > min ? ((val - min) / (max - min)) * 160 + 20 : 100;
    return { x, y: 200 - normalized };
  }).filter(Boolean) as { x: number; y: number }[];

  const polyline = points.length > 1 ? `<polyline points="${points.map((p) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#9ed2be" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>` : "";

  const seizureLines = days.map((day, i) => {
    const hasSeizure = seizures.some((s) => isSameDay(parseISO(s.date), day));
    if (!hasSeizure) return "";
    const x = days.length > 1 ? (i / (days.length - 1)) * 1000 : 500;
    return `<line x1="${x}" y1="200" x2="${x}" y2="0" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" width="1000" height="200">
  ${polyline}
  ${seizureLines}
</svg>`;
}

async function svgToCanvas(svg: string): Promise<HTMLCanvasElement> {
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
}

// ─── Notification Preferences (localStorage) ────────────────────────────────

type NotificationPrefs = {
  diary: boolean;
  medication: boolean;
  befinden: boolean;
};

const NOTIFICATION_KEY = "epidoc_notification_prefs";

function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return { diary: false, medication: false, befinden: false };
  try {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    if (stored) return JSON.parse(stored) as NotificationPrefs;
  } catch { /* ignore */ }
  return { diary: false, medication: false, befinden: false };
}

function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EinstellungenPage() {
  const { user, logout } = useAuth();
  const { t } = useRoleText();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  // ── Notification Prefs ──
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({ diary: false, medication: false, befinden: false });

  useEffect(() => {
    setNotifPrefs(loadNotificationPrefs());
  }, []);

  const updateNotifPref = (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    toastService.show(value ? "Erinnerung aktiviert" : "Erinnerung deaktiviert", "success");
  };

  // ── Modal State ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Form State ──
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [feedbackForm, setFeedbackForm] = useState<FeedbackData>({
    type: "other",
    message: "",
  });
  const [deletePassword, setDeletePassword] = useState("");

  // ── Data Loading ──
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      setProfileData(response.user as UserProfile);
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Fehler beim Laden der Einstellungen";
      toastService.show(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Datenexport als PDF mit Grafiken ──
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await profileApi.exportData();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 14;
      const contentW = W - 2 * M;
      const chartH = 48;
      let y = M;

      const checkPage = (needed = 20) => {
        if (y + needed > H - M) { pdf.addPage(); y = M; }
      };

      const drawLine = () => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(M, y, W - M, y);
        y += 4;
      };

      const heading = (text: string) => {
        checkPage(16);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 42, 68);
        pdf.text(text, M, y);
        y += 7;
        drawLine();
      };

      const label = (l: string, v: string) => {
        checkPage(8);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(80, 80, 80);
        pdf.text(l, M, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(30, 30, 30);
        pdf.text(v || "—", M + 45, y);
        y += 5;
      };

      const bodyText = (text: string) => {
        checkPage(8);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        const lines = pdf.splitTextToSize(text, contentW);
        for (const line of lines) {
          checkPage(5);
          pdf.text(line, M, y);
          y += 4;
        }
        y += 2;
      };

      const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

      // ── Titel ──
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 42, 68);
      pdf.text("EpiDoc – Datenexport", M, y);
      y += 8;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Exportiert am ${fmtDateTime(data.exported_at)}`, M, y);
      y += 10;

      // ── Profil ──
      heading("Profil");
      const p = data.profile;
      if (p) {
        label("User-ID:", p.display_name || `User-${p.id}`);
        label("E-Mail:", p.email || "—");
        label("Rolle:", p.role === "patient" ? "Patient" : "Angehöriger");
        if (p.diagnoses && p.diagnoses.length > 0) {
          label("Diagnosen:", p.diagnoses.map((d) => d.type).join(", "));
        } else if (p.disease) {
          label("Diagnose:", p.disease);
        }
        if (p.doctors && p.doctors.length > 0) {
          label("Ärzte:", p.doctors.map((d) => d.name).join(", "));
        }
        if (p.clinics && p.clinics.length > 0) {
          label("Kliniken:", p.clinics.map((c) => c.name).join(", "));
        }
        if (p.pharmacies && p.pharmacies.length > 0) {
          label("Apotheken:", p.pharmacies.map((ph) => ph.name).join(", "));
        }
        if (p.emergency_contact?.name) {
          label("Notfallkontakt:", `${p.emergency_contact.name}${p.emergency_contact.phone ? ` (${p.emergency_contact.phone})` : ""}`);
        }
      }
      y += 4;

      // ── Anfälle als Grafik ──
      const seizures = data.seizures ?? [];
      heading("Anfallstagebuch");
      if (seizures.length === 0) {
        bodyText("Keine Anfälle erfasst.");
      } else {
        bodyText(`Total: ${seizures.length} Einträge · Letzte 12 Monate`);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text("Balken = Anfälle pro Monat", M, y);
        y += 5;

        // Balkendiagramm
        checkPage(chartH + 10);
        const barSvg = buildSeizureBarChartSvg(seizures);
        const barCanvas = await svgToCanvas(barSvg);
        const barImg = barCanvas.toDataURL("image/png");
        pdf.addImage(barImg, "PNG", M, y, contentW, chartH);
        y += chartH + 6;

        // Zusammenfassung darunter
        const emergencyCount = seizures.filter((s) => Boolean(s.emergency_med)).length;
        if (emergencyCount > 0) {
          bodyText(`Notfallmedikament eingesetzt: ${emergencyCount}x`);
        }
        const allTypes = seizures.flatMap((s) => s.type || []);
        const typeCounts: Record<string, number> = {};
        allTypes.forEach((t) => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
        const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topTypes.length > 0) {
          bodyText(`Häufigste Anfallstypen: ${topTypes.map(([t, c]) => `${t} (${c}x)`).join(", ")}`);
        }
      }
      y += 4;

      // ── Befinden als Grafiken ──
      const befinden = data.befinden ?? [];
      heading("Befinden – Symptomverläufe");
      if (befinden.length === 0) {
        bodyText("Keine Befinden-Einträge erfasst.");
      } else {
        // Symptome mit Daten finden
        const symptomIds = new Set<string>();
        befinden.forEach((b) => symptomIds.add(b.symptom_id));
        const symptomsWithData = Array.from(symptomIds).filter((id) =>
          befinden.some((b) => b.symptom_id === id && b.rating != null)
        );

        bodyText(`${befinden.length} Einträge · ${symptomsWithData.length} Symptome · Letzte 6 Monate`);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text("Grüne Linie = Symptomverlauf · Gestrichelte Linie = Anfallsereignis", M, y);
        pdf.setTextColor(0, 0, 0);
        y += 6;

        for (const symptomId of symptomsWithData) {
          const signalLabel = SIGNAL_LABELS[symptomId] || symptomId;
          const blockH = 8 + chartH + 8;

          checkPage(blockH);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(31, 42, 68);
          pdf.text(signalLabel, M, y);
          y += 7;

          const svg = buildSignalChartSvg(befinden, seizures, symptomId);
          const canvas = await svgToCanvas(svg);
          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", M, y, contentW, chartH);
          y += chartH + 4;
          drawLine();
          y += 2;
        }
      }

      // ── Fusszeile ──
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(160, 160, 160);
        pdf.text(`EpiDoc – Kein Medizinprodukt · Seite ${i}/${pageCount}`, M, H - 6);
      }

      pdf.save(`epidoc-export-${new Date().toISOString().slice(0, 10)}.pdf`);
      toastService.show("PDF erfolgreich exportiert", "success");
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Fehler beim Exportieren der Daten";
      toastService.show(msg, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // ── Passwort ändern ──
  const openPasswordModal = () => {
    setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
  };

  const savePassword = async () => {
    if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim()) {
      toastService.show("Alle Felder sind erforderlich", "error");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toastService.show("Das neue Passwort muss mindestens 8 Zeichen lang sein", "error");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toastService.show("Die Passwörter stimmen nicht überein", "error");
      return;
    }
    try {
      setIsSaving(true);
      await profileApi.changePassword(passwordForm);
      toastService.show("Passwort erfolgreich geändert", "success");
      closePasswordModal();
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Fehler beim Ändern des Passworts";
      toastService.show(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Feedback senden ──
  const openFeedbackModal = () => {
    setFeedbackForm({ type: "other", message: "" });
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({ type: "other", message: "" });
  };

  const handleSendFeedback = async () => {
    const trimmedMessage = feedbackForm.message.trim();
    if (!trimmedMessage || trimmedMessage.length < 10) {
      toastService.show("Bitte geben Sie mindestens 10 Zeichen ein", "error");
      return;
    }
    try {
      setIsSaving(true);
      await feedbackApi.sendFeedback({ ...feedbackForm, message: trimmedMessage });
      toastService.show("Feedback erfolgreich gesendet. Vielen Dank!", "success");
      closeFeedbackModal();
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Fehler beim Senden des Feedbacks";
      toastService.show(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Konto löschen (2-stufig) ──
  const startDeleteFlow = () => setShowDeleteConfirm(true);

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword("");
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShowDeleteModal(false);
    setDeletePassword("");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toastService.show("Bitte geben Sie Ihr Passwort ein.", "error");
      return;
    }
    try {
      setIsSaving(true);
      await profileApi.delete(deletePassword);
      toastService.show("Konto erfolgreich gelöscht", "success");
      logout();
      router.push("/login");
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Fehler beim Löschen des Kontos";
      toastService.show(msg, "error");
    } finally {
      setIsSaving(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-[var(--spacing-s)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
            <p className="text-body-small text-foreground-500">Einstellungen werden geladen...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Page ──
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-50 px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">

          {/* ── Header ── */}
          <div className="space-y-[var(--spacing-2xs)]">
            <h1 className="text-h4 sm:text-h3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
              Einstellungen
            </h1>
          </div>

          <div className="space-y-[var(--spacing-s)]">

            {/* ── 1. Konto-Informationen ── */}
            {profileData && (
              <SectionCard icon={<IconUser className="w-5 h-5" />} title="Konto-Informationen">
                <div className="space-y-[var(--spacing-xs)]">
                  <InfoRow label="User-ID" value={profileData.display_name || `User-${profileData.id}`} />
                  <InfoRow label="E-Mail" value={profileData.email || "—"} />
                  <InfoRow label="Konto erstellt" value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString("de-CH") : "—"} />
                  {profileData.last_login_at && (
                    <InfoRow
                      label="Letzte Anmeldung"
                      value={new Date(profileData.last_login_at).toLocaleDateString("de-CH", {
                        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    />
                  )}
                  <InfoRow label="Rolle" value={profileData.role === "patient" ? "Patient" : "Angehöriger"} />
                </div>
              </SectionCard>
            )}

            {/* ── 2. Datenexport ── */}
            <SectionCard icon={<IconDownload className="w-5 h-5" />} title="Datenexport">
              <div className="space-y-[var(--spacing-s)]">
                <p className="text-body-small text-foreground-600">
                  {t("Exportieren Sie alle Ihre Daten (Profil, Anfallstagebuch, Befinden) als PDF-Dokument. Ideal für Arztbesuche oder zur persönlichen Sicherung.")}
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full rounded-xl bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-white transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-[var(--spacing-xs)]"
                >
                  {isExporting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Erstellt PDF...
                    </>
                  ) : (
                    <>
                      <IconDownload className="w-4 h-4" />
                      Als PDF herunterladen
                    </>
                  )}
                </button>
              </div>
            </SectionCard>

            {/* ── 3. Benachrichtigungen ── */}
            <SectionCard icon={<IconBell className="w-5 h-5" />} title="Erinnerungen">
              <div className="space-y-[var(--spacing-m)]">
                <p className="text-body-small text-foreground-500">
                  Aktivieren Sie Erinnerungen, um regelmässig an wichtige Einträge erinnert zu werden.
                </p>
                <Toggle
                  label="Tagebuch-Erinnerung"
                  description="Tägliche Erinnerung, Anfälle im Tagebuch zu erfassen"
                  checked={notifPrefs.diary}
                  onChange={(v) => updateNotifPref("diary", v)}
                />
                <Toggle
                  label="Medikamenten-Erinnerung"
                  description="Erinnerung an die Medikamenten-Einnahme"
                  checked={notifPrefs.medication}
                  onChange={(v) => updateNotifPref("medication", v)}
                />
                <Toggle
                  label="Befinden erfassen"
                  description={t("Regelmässige Erinnerung, Ihr Befinden zu dokumentieren")}
                  checked={notifPrefs.befinden}
                  onChange={(v) => updateNotifPref("befinden", v)}
                />
                <p className="text-body-small text-foreground-400 italic">
                  Hinweis: Erinnerungen werden derzeit als Einstellung gespeichert. Push-Benachrichtigungen folgen in einer zukünftigen Version.
                </p>
              </div>
            </SectionCard>

            {/* ── 4. Feedback & Support ── */}
            <SectionCard icon={<IconChat className="w-5 h-5" />} title="Feedback & Support">
              <div className="space-y-[var(--spacing-s)]">
                <p className="text-body-small text-foreground-600">
                  Haben Sie Feedback, Fragen oder Verbesserungsvorschläge? Wir freuen uns über Ihre Rückmeldung!
                </p>
                <button
                  type="button"
                  onClick={openFeedbackModal}
                  className="w-full rounded-xl bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-white transition hover:bg-primary-700 text-left"
                >
                  Feedback senden
                </button>
              </div>
            </SectionCard>

            {/* ── 5. Rechtliches ── */}
            <SectionCard icon={<IconScale className="w-5 h-5" />} title="Rechtliches">
              <div className="space-y-[var(--spacing-m)]">

                {/* Kein Medizinprodukt */}
                <div className="rounded-xl border border-warning-200 bg-warning-50 p-[var(--spacing-s)]">
                  <div className="flex items-start gap-[var(--spacing-xs)]">
                    <IconWarning className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-medium text-warning-800">Kein Medizinprodukt</p>
                      <p className="text-body-small text-warning-700 mt-[var(--spacing-3xs)]">
                        EpiDoc ist kein Medizinprodukt und ersetzt keine ärztliche Beratung, Diagnose oder Behandlung.
                        Die App dient ausschliesslich der persönlichen Dokumentation und Selbstbeobachtung. Bei medizinischen
                        Fragen wenden Sie sich bitte an Ihre behandelnde Ärztin oder Ihren behandelnden Arzt.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datenschutz */}
                <div>
                  <h3 className="text-body font-medium text-foreground-900 mb-[var(--spacing-2xs)]">Datenschutzerklärung</h3>
                  <div className="text-body-small text-foreground-600 space-y-[var(--spacing-2xs)]">
                    <p>
                      Ihre Daten werden vertraulich behandelt und ausschliesslich für die Funktionalität der App verwendet.
                      Es findet keine Weitergabe an Dritte statt.
                    </p>
                    <p>
                      Alle Gesundheitsdaten werden verschlüsselt auf dem Server gespeichert und sind nur mit Ihrem persönlichen
                      Login zugänglich. Sie können Ihre Daten jederzeit exportieren oder Ihr Konto vollständig löschen.
                    </p>
                    <p>
                      Die Datenverarbeitung erfolgt in Übereinstimmung mit dem Schweizer Datenschutzgesetz (DSG)
                      und der Europäischen Datenschutz-Grundverordnung (DSGVO).
                    </p>
                  </div>
                </div>

                {/* Nutzungsbedingungen */}
                <div>
                  <h3 className="text-body font-medium text-foreground-900 mb-[var(--spacing-2xs)]">Nutzungsbedingungen</h3>
                  <div className="text-body-small text-foreground-600 space-y-[var(--spacing-2xs)]">
                    <p>
                      Die Nutzung von EpiDoc ist freiwillig und kostenlos. Die App befindet sich im Pilotstadium
                      und kann jederzeit weiterentwickelt oder angepasst werden.
                    </p>
                    <p>
                      Für die Richtigkeit und Vollständigkeit der eingegebenen Daten sind die Nutzerinnen und Nutzer
                      selbst verantwortlich. Die Betreiber übernehmen keine Haftung für Schäden, die aus der
                      Nutzung der App entstehen.
                    </p>
                  </div>
                </div>

                {/* Impressum */}
                <div>
                  <h3 className="text-body font-medium text-foreground-900 mb-[var(--spacing-2xs)]">Impressum</h3>
                  <div className="text-body-small text-foreground-600 space-y-[var(--spacing-2xs)]">
                    <p>
                      EpiDoc – Digitales Epilepsie-Tagebuch (Prototyp/Pilot)
                    </p>
                    <p>
                      Entwickelt im Rahmen eines Pilotprojekts.
                      <br />
                      Kontakt: <span className="text-primary-600">epidoc@kontakt.ch</span>
                    </p>
                  </div>
                </div>

              </div>
            </SectionCard>

            {/* ── 6. App-Info ── */}
            <SectionCard icon={<IconInfo className="w-5 h-5" />} title="Über EpiDoc">
              <div className="space-y-[var(--spacing-s)]">
                <div className="space-y-[var(--spacing-xs)]">
                  <InfoRow label="App" value="EpiDoc" />
                  <InfoRow label="Version" value="0.1.0 (Pilot)" />
                  <InfoRow label="Status" value="Prototyp / Pilotphase" />
                </div>
                <p className="text-body-small text-foreground-500">
                  EpiDoc ist ein digitales Epilepsie-Tagebuch, das Menschen mit Epilepsie dabei unterstützt,
                  Anfälle, Medikamente und ihr Befinden zu dokumentieren – einfach, sicher und übersichtlich.
                </p>
              </div>
            </SectionCard>

            {/* ── 7. Konto-Verwaltung (ganz unten) ── */}
            <SectionCard icon={<IconCog className="w-5 h-5" />} title="Konto-Verwaltung">
              <div className="space-y-[var(--spacing-s)]">
                <button type="button" onClick={openPasswordModal} className={CSS.actionBtn}>
                  Passwort ändern
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-background-200/60 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-700 transition hover:bg-background-50 text-left flex items-center gap-[var(--spacing-xs)]"
                >
                  <IconLogout className="w-4 h-4" />
                  Abmelden
                </button>
                <div className="border-t border-background-200/60 pt-[var(--spacing-s)]">
                  <button
                    type="button"
                    onClick={startDeleteFlow}
                    className="w-full rounded-xl border border-warning-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-warning-600 transition hover:bg-warning-50 text-left"
                  >
                    Konto löschen
                  </button>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>

      {/* ── Bestätigungs-Dialog vor Kontolöschung (Stufe 1) ── */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md border border-warning-300 ring-2 ring-warning-100 overflow-hidden">
            <div className="p-[var(--spacing-m)] space-y-[var(--spacing-m)]">
              <div className="flex items-center gap-[var(--spacing-s)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-100">
                  <IconWarning className="w-5 h-5 text-warning-600" />
                </div>
                <h2 className="text-body font-medium text-foreground-900">Konto wirklich löschen?</h2>
              </div>
              <div className="space-y-[var(--spacing-xs)]">
                <p className="text-body text-foreground-700">
                  Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden.
                </p>
                <p className="text-body-small text-foreground-500">
                  Alle Ihre Daten – einschliesslich Profildaten, Anfallstagebuch, Medikamente und Befinden-Einträge – werden unwiderruflich gelöscht.
                </p>
              </div>
              <div className="flex gap-[var(--spacing-m)]">
                <button type="button" onClick={cancelDelete} className={CSS.btnCancel}>
                  Abbrechen
                </button>
                <button type="button" onClick={confirmDelete} className={CSS.btnDanger}>
                  Ja, Konto löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Passwort-Eingabe zum Löschen (Stufe 2) ── */}
      {showDeleteModal && (
        <InlineModal title="Konto löschen – Passwort bestätigen" onClose={cancelDelete}>
          <p className="text-body text-foreground-700">
            Bitte geben Sie Ihr Passwort ein, um die Löschung zu bestätigen.
          </p>
          <FormField label="Passwort" type="password" value={deletePassword} onChange={setDeletePassword} required />
          <ModalActions onCancel={cancelDelete} onSave={handleDeleteAccount} isSaving={isSaving} saveLabel="Konto endgültig löschen" savingLabel="Löscht..." variant="danger" disabled={!deletePassword} />
        </InlineModal>
      )}

      {/* ── Feedback Modal ── */}
      {showFeedbackModal && (
        <InlineModal title="Feedback senden" onClose={closeFeedbackModal}>
          <div className="space-y-[var(--spacing-xs)]">
            <label className="text-body font-medium text-foreground-800">
              Feedback-Typ <span className="text-foreground-800">*</span>
            </label>
            <select
              value={feedbackForm.type}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value as FeedbackData["type"] })}
              className={CSS.select}
            >
              <option value="bug">Fehler melden</option>
              <option value="improvement">Verbesserungsvorschlag</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
          <div className="space-y-[var(--spacing-xs)]">
            <label className="text-body font-medium text-foreground-800">
              Nachricht <span className="text-foreground-800">*</span>
            </label>
            <textarea
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
              required
              minLength={10}
              rows={6}
              placeholder="Beschreiben Sie Ihr Feedback, Ihre Frage oder Ihren Vorschlag..."
              className={CSS.textarea}
            />
            <p className="text-body-small text-foreground-600">
              Mindestens 10 Zeichen ({feedbackForm.message.trim().length}/10)
            </p>
          </div>
          <ModalActions onCancel={closeFeedbackModal} onSave={handleSendFeedback} isSaving={isSaving} saveLabel="Feedback senden" savingLabel="Sendet..." disabled={feedbackForm.message.trim().length < 10} />
        </InlineModal>
      )}

      {/* ── Passwort ändern Modal ── */}
      {showPasswordModal && (
        <InlineModal title="Passwort ändern" onClose={closePasswordModal}>
          <FormField label="Aktuelles Passwort" type="password" value={passwordForm.current_password} onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })} required />
          <FormField label="Neues Passwort" type="password" value={passwordForm.new_password} onChange={(v) => setPasswordForm({ ...passwordForm, new_password: v })} required hint="Mindestens 8 Zeichen" />
          <FormField label="Neues Passwort bestätigen" type="password" value={passwordForm.new_password_confirmation} onChange={(v) => setPasswordForm({ ...passwordForm, new_password_confirmation: v })} required />
          <ModalActions onCancel={closePasswordModal} onSave={savePassword} isSaving={isSaving} saveLabel="Passwort ändern" savingLabel="Speichert..." />
        </InlineModal>
      )}
    </ProtectedRoute>
  );
}
