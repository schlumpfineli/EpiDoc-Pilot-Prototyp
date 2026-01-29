/**
 * Zod-Schemas für Form-Validierung
 */

import { z } from 'zod';

// Auth Schemas
// Passwort-Stärke-Validierung
const passwordSchema = z.string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  role: z.enum(['patient', 'relative'], {
    errorMap: () => ({ message: 'Bitte wähle eine Rolle' }),
  } as any),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

// Befinden Schemas
export const befindenSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  category_id: z.enum(['physical', 'mental', 'lifestyle', 'alternative']),
  symptom_id: z.string().min(1, 'Symptom-ID ist erforderlich'),
  time_of_day: z.enum(['morning', 'noon', 'evening']),
  rating: z.number().int().min(0).max(10),
  questions: z.record(z.string(), z.any()).optional(),
});

// Seizure Schemas
export const seizureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  type: z.array(z.string()).optional(),
  custom_type: z.string().max(255).optional(),
  felt_before: z.string().max(1000).optional(),
  felt_symptoms: z.string().max(1000).optional(),
  seizure_count: z.number().int().min(1),
  duration_minutes: z.number().int().min(0).optional(),
  duration_seconds: z.number().int().min(0).max(59).optional(),
  after_effects: z.array(z.string()).optional(),
  custom_after_effects: z.string().max(500).optional(),
  triggers: z.array(z.string()).optional(),
  custom_triggers: z.string().max(500).optional(),
  emergency_med: z.boolean(),
  emergency_med_name: z.string().max(255).optional(),
  video_path: z.string().max(500).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  token: z.string().min(1, 'Token ist erforderlich'),
  password: passwordSchema,
  password_confirmation: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwörter stimmen nicht überein',
  path: ['password_confirmation'],
});

// Schema für Passwort-Änderung (in Profil)
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  new_password: passwordSchema,
  new_password_confirmation: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'Passwörter stimmen nicht überein',
  path: ['new_password_confirmation'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BefindenInput = z.infer<typeof befindenSchema>;
export type SeizureInput = z.infer<typeof seizureSchema>;

