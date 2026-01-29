import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeString,
  stripHtmlTags,
  sanitizeUrl,
  sanitizeForAttribute,
  normalizeWhitespace,
  sanitizeForDisplay,
  sanitizeEmail,
} from './sanitize';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string, options?: any) => {
      if (options?.USE_PROFILES?.html === false) {
        // Strip all HTML tags
        return input.replace(/<[^>]*>/g, '');
      }
      // Basic sanitization (remove script tags)
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },
  },
}));

describe('Sanitization Functions', () => {
  describe('sanitizeString', () => {
    it('removes HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
    });

    it('handles null input', () => {
      expect(sanitizeString(null)).toBe('');
    });

    it('handles undefined input', () => {
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('stripHtmlTags', () => {
    it('removes all HTML tags', () => {
      const input = '<p>Hello <b>World</b></p>';
      const result = stripHtmlTags(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('handles null input', () => {
      expect(stripHtmlTags(null)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('removes invalid characters from URL', () => {
      const input = 'test url with spaces';
      const result = sanitizeUrl(input);
      // sanitizeUrl removes spaces and other invalid characters
      expect(result).toBe('testurlwithspaces');
      expect(result).not.toContain(' ');
    });

    it('handles null input', () => {
      expect(sanitizeUrl(null)).toBe('');
    });
  });

  describe('sanitizeForAttribute', () => {
    it('escapes HTML entities', () => {
      const input = 'Test "quote" & <tag>';
      const result = sanitizeForAttribute(input);
      expect(result).toContain('&quot;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
    });

    it('handles null input', () => {
      expect(sanitizeForAttribute(null)).toBe('');
    });
  });

  describe('normalizeWhitespace', () => {
    it('normalizes multiple spaces', () => {
      const input = 'Hello    World';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Hello World');
    });

    it('trims whitespace', () => {
      const input = '  Hello World  ';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Hello World');
    });

    it('handles null input', () => {
      expect(normalizeWhitespace(null)).toBe('');
    });
  });

  describe('sanitizeForDisplay', () => {
    it('sanitizes input for display', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain('<script>');
    });

    it('handles null input', () => {
      expect(sanitizeForDisplay(null)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('validates and sanitizes email', () => {
      const input = 'test@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('returns empty string for invalid email', () => {
      const input = 'test<script>@example.com';
      const result = sanitizeEmail(input);
      // sanitizeEmail validates email format and returns empty string if invalid
      expect(result).toBe('');
    });

    it('converts to lowercase', () => {
      const input = 'TEST@EXAMPLE.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('handles null input', () => {
      expect(sanitizeEmail(null)).toBe('');
    });
  });
});

