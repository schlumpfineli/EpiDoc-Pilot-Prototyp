import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  befindenSchema,
  seizureSchema,
} from './validations';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'Password123',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('rejects password without uppercase', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'password123',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects password without lowercase', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'PASSWORD123',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'Password',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'Pass1',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        role: 'patient' as const,
        password: 'Password123',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'invalid' as any,
        password: 'Password123',
        privacyAccepted: true,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('rejects missing privacy consent', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'patient' as const,
        password: 'Password123',
        privacyAccepted: false,
        healthDataConsent: true,
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('rejects empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates correct reset password data', () => {
      const validData = {
        email: 'test@example.com',
        token: 'reset-token',
        password: 'NewPassword123',
        password_confirmation: 'NewPassword123',
      };
      expect(() => resetPasswordSchema.parse(validData)).not.toThrow();
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        token: 'reset-token',
        password: 'NewPassword123',
        password_confirmation: 'DifferentPassword123',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });

    it('rejects weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        token: 'reset-token',
        password: 'weak',
        password_confirmation: 'weak',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow();
    });
  });

  describe('changePasswordSchema', () => {
    it('validates correct change password data', () => {
      const validData = {
        current_password: 'OldPassword123',
        new_password: 'NewPassword123',
        new_password_confirmation: 'NewPassword123',
      };
      expect(() => changePasswordSchema.parse(validData)).not.toThrow();
    });

    it('rejects mismatched new passwords', () => {
      const invalidData = {
        current_password: 'OldPassword123',
        new_password: 'NewPassword123',
        new_password_confirmation: 'DifferentPassword123',
      };
      expect(() => changePasswordSchema.parse(invalidData)).toThrow();
    });
  });

  describe('befindenSchema', () => {
    it('validates correct befinden data', () => {
      const validData = {
        date: '2025-01-15',
        category_id: 'physical',
        symptom_id: 'headache',
        time_of_day: 'morning',
        rating: 5,
      };
      expect(() => befindenSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid rating (too high)', () => {
      const invalidData = {
        date: '2025-01-15',
        category_id: 'physical',
        symptom_id: 'headache',
        time_of_day: 'morning',
        rating: 15,
      };
      expect(() => befindenSchema.parse(invalidData)).toThrow();
    });

    it('rejects invalid rating (negative)', () => {
      const invalidData = {
        date: '2025-01-15',
        category_id: 'physical',
        symptom_id: 'headache',
        time_of_day: 'morning',
        rating: -1,
      };
      expect(() => befindenSchema.parse(invalidData)).toThrow();
    });
  });

  describe('seizureSchema', () => {
    it('validates correct seizure data', () => {
      const validData = {
        date: '2025-01-15',
        seizure_count: 1,
        emergency_med: false,
      };
      expect(() => seizureSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid date format', () => {
      const invalidData = {
        date: 'invalid-date',
        seizure_count: 1,
        emergency_med: false,
      };
      expect(() => seizureSchema.parse(invalidData)).toThrow();
    });

    it('rejects negative seizure count', () => {
      const invalidData = {
        date: '2025-01-15',
        seizure_count: -1,
        emergency_med: false,
      };
      expect(() => seizureSchema.parse(invalidData)).toThrow();
    });
  });
});

