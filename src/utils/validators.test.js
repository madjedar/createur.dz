import { describe, it, expect } from 'vitest';
import {
  validatePasswordStrength,
  validateAlgerianPhone,
  validateAlgerianRIP,
  validateAmount,
  validateImageFile,
  safeHref,
  isValidUUID,
  escapeRegExp,
  sanitizeForPayload,
  sanitizeText,
  validateReviewForm
} from './validators';

describe('Security & Input Validators', () => {
  describe('validatePasswordStrength', () => {
    it('rejects short passwords (< 8 chars)', () => {
      const res = validatePasswordStrength('Ab1!');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('8 أحرف');
    });

    it('rejects passwords without uppercase letters', () => {
      const res = validatePasswordStrength('password123!');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('حرف كبير');
    });

    it('rejects passwords without lowercase letters', () => {
      const res = validatePasswordStrength('PASSWORD123!');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('حرف صغير');
    });

    it('rejects passwords without numbers', () => {
      const res = validatePasswordStrength('Password!@#');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('رقم');
    });

    it('rejects passwords without special characters', () => {
      const res = validatePasswordStrength('Password123');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('رمز خاص');
    });

    it('accepts strong passwords meeting all requirements', () => {
      const res = validatePasswordStrength('SecureP@ssw0rd!');
      expect(res.isValid).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('validateAlgerianPhone', () => {
    it('accepts standard 10-digit mobile numbers (05, 06, 07)', () => {
      expect(validateAlgerianPhone('0555123456').isValid).toBe(true);
      expect(validateAlgerianPhone('0661123456').isValid).toBe(true);
      expect(validateAlgerianPhone('0770123456').isValid).toBe(true);
    });

    it('normalizes international formats (+213, 00213) to national format', () => {
      const res = validateAlgerianPhone('+213555123456');
      expect(res.isValid).toBe(true);
      expect(res.formatted).toBe('0555123456');
    });

    it('rejects invalid phone numbers', () => {
      expect(validateAlgerianPhone('12345').isValid).toBe(false);
      expect(validateAlgerianPhone('0999999999').isValid).toBe(false);
    });
  });

  describe('validateAlgerianRIP', () => {
    it('accepts exactly 20-digit RIP numbers and formats them', () => {
      const res = validateAlgerianRIP('00799999001234567890');
      expect(res.isValid).toBe(true);
      expect(res.formatted).toBe('00799999001234567890');
      expect(res.displayFormatted).toBe('00799999 0012345678 90');
    });

    it('rejects RIPs with incorrect length', () => {
      expect(validateAlgerianRIP('00799999').isValid).toBe(false);
      expect(validateAlgerianRIP('00799999001234567890123').isValid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('validates numbers within acceptable boundaries', () => {
      const res = validateAmount(5000, { min: 100, max: 100000 });
      expect(res.isValid).toBe(true);
      expect(res.value).toBe(5000);
    });

    it('rejects amounts below minimum', () => {
      const res = validateAmount(50, { min: 100, max: 100000 });
      expect(res.isValid).toBe(false);
    });

    it('rejects amounts above maximum', () => {
      const res = validateAmount(200000, { min: 100, max: 100000 });
      expect(res.isValid).toBe(false);
    });

    it('rejects non-numeric inputs', () => {
      expect(validateAmount('abc').isValid).toBe(false);
      expect(validateAmount(NaN).isValid).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('accepts valid images under 5MB', () => {
      const validFile = { size: 2 * 1024 * 1024, type: 'image/jpeg', name: 'avatar.jpg' };
      expect(validateImageFile(validFile).isValid).toBe(true);
    });

    it('rejects files larger than 5MB', () => {
      const largeFile = { size: 6 * 1024 * 1024, type: 'image/png', name: 'big.png' };
      const res = validateImageFile(largeFile);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('5 ميغابايت');
    });

    it('rejects dangerous and non-image files', () => {
      const exeFile = { size: 1024, type: 'application/x-msdownload', name: 'malware.exe' };
      expect(validateImageFile(exeFile).isValid).toBe(false);

      const scriptFile = { size: 1024, type: 'text/javascript', name: 'hack.js' };
      expect(validateImageFile(scriptFile).isValid).toBe(false);
    });
  });

  describe('safeHref (DOM XSS & Dangerous Protocol Protection)', () => {
    it('blocks javascript: URI injection', () => {
      expect(safeHref('javascript:alert(1)')).toBe('#');
      expect(safeHref('JAVASCRIPT:alert(document.cookie)')).toBe('#');
    });

    it('blocks data: and vbscript: URIs', () => {
      expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(safeHref('vbscript:msgbox(1)')).toBe('#');
    });

    it('allows valid http/https URLs', () => {
      expect(safeHref('https://instagram.com/user')).toBe('https://instagram.com/user');
      expect(safeHref('http://example.com')).toBe('http://example.com/');
    });

    it('auto-prepends https:// for valid domain names', () => {
      expect(safeHref('instagram.com/creator')).toBe('https://instagram.com/creator');
    });
  });

  describe('isValidUUID (PostgREST Filter Injection Protection)', () => {
    it('accepts valid RFC-4122 UUIDs', () => {
      expect(isValidUUID('c8bbdb24-5eaf-4243-a0e4-0c9ae36ebd04')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(false);
      expect(isValidUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    });

    it('rejects injection strings and malformed UUIDs', () => {
      expect(isValidUUID('12345')).toBe(false);
      expect(isValidUUID('c8bbdb24-5eaf-4243-a0e4-0c9ae36ebd04,and(1.eq.1)')).toBe(false);
      expect(isValidUUID('; DROP TABLE users;--')).toBe(false);
    });
  });

  describe('escapeRegExp & sanitizeForPayload', () => {
    it('escapes regex special characters', () => {
      expect(escapeRegExp('hello.*+?^${}()|[]\\world')).toBe('hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world');
    });

    it('sanitizes strings by stripping newlines and control characters', () => {
      expect(sanitizeForPayload('Campaign Title\r\nInjected Header: Value\x00')).toBe('Campaign Title Injected Header: Value');
    });
  });

  describe('sanitizeText (XSS & Injection Protection)', () => {
    it('strips script, iframe, object, and embed tags', () => {
      const malicious = '<script>alert(1)</script><iframe src="evil.com"></iframe><object data="bad.swf"></object><embed src="bad.swf">Hello Clean Text';
      expect(sanitizeText(malicious)).toBe('Hello Clean Text');
    });

    it('strips inline event handlers and javascript: pseudo-protocol', () => {
      const xss = '<img src="x" onerror="alert(1)">Click javascript:alert(2)';
      expect(sanitizeText(xss)).toBe('<img src="x" "alert(1)">Click alert(2)');
    });

    it('strips unprintable ASCII control characters', () => {
      const withControls = 'Safe\x00Message\x07Text\x1F';
      expect(sanitizeText(withControls)).toBe('SafeMessageText');
    });

    it('respects maximum length', () => {
      expect(sanitizeText('A'.repeat(300), 50).length).toBe(50);
    });
  });

  describe('validateReviewForm', () => {
    it('accepts valid rating and review text', () => {
      const res = validateReviewForm(5, 'ممتاز جداً ومحترف!');
      expect(res.isValid).toBe(true);
      expect(res.rating).toBe(5);
      expect(res.reviewText).toBe('ممتاز جداً ومحترف!');
    });

    it('rejects invalid rating values', () => {
      expect(validateReviewForm(0, 'جيد').isValid).toBe(false);
      expect(validateReviewForm(6, 'جيد').isValid).toBe(false);
      expect(validateReviewForm('invalid', 'جيد').isValid).toBe(false);
    });
  });
});
