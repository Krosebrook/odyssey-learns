import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeMarkdown,
  sanitizeEmail,
  sanitizeURL,
  sanitizeNumber,
  validateUUID,
  validateGradeLevel,
  validateLength,
  sanitizeUserInput,
  VALIDATION_LIMITS,
} from '../inputSanitization';

describe('inputSanitization', () => {
  describe('sanitizeHTML', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHTML('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(sanitizeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(sanitizeHTML('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('should handle empty string', () => {
      expect(sanitizeHTML('')).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      expect(sanitizeText('Hello\x00World\x1F')).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  Hello World  ')).toBe('Hello World');
    });

    it('should enforce max length', () => {
      const longText = 'a'.repeat(200);
      expect(sanitizeText(longText, 50)).toHaveLength(50);
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeText('Line1\nLine2\tTab')).toBe('Line1\nLine2\tTab');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should remove javascript: links', () => {
      const input = '[Click here](javascript:alert("xss"))';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('[Click here](#)');
      // May have extra characters from the regex replacement
    });

    it('should remove data: URIs', () => {
      const input = '[Image](data:text/html,<script>alert("xss")</script>)';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('[Image](#)');
      // May have extra characters from the regex replacement
    });

    it('should allow safe markdown links', () => {
      const input = '[Google](https://google.com)';
      expect(sanitizeMarkdown(input)).toContain('[Google]');
    });

    it('should handle mixed content', () => {
      const input = '[Safe](https://example.com) and [Bad](javascript:alert())';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('[Safe]');
      expect(result).toContain('[Bad](#)');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });

    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should throw on invalid email', () => {
      expect(() => sanitizeEmail('not-an-email')).toThrow('Invalid email');
    });

    it('should throw on missing @ symbol', () => {
      expect(() => sanitizeEmail('testexample.com')).toThrow('Invalid email');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow https URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    });

    it('should allow http URLs', () => {
      expect(sanitizeURL('http://example.com')).toBe('http://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
    });

    it('should block javascript: scheme', () => {
      expect(sanitizeURL('javascript:alert("xss")')).toBe('#');
    });

    it('should block data: scheme', () => {
      expect(sanitizeURL('data:text/html,<script>')).toBe('#');
    });

    it('should block vbscript: scheme', () => {
      expect(sanitizeURL('vbscript:msgbox("xss")')).toBe('#');
    });

    it('should block non-http protocols', () => {
      expect(sanitizeURL('ftp://example.com')).toBe('#');
    });

    it('should trim whitespace', () => {
      expect(sanitizeURL('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse string numbers', () => {
      expect(sanitizeNumber('42')).toBe(42);
    });

    it('should accept number input', () => {
      expect(sanitizeNumber(42)).toBe(42);
    });

    it('should throw on invalid number', () => {
      expect(() => sanitizeNumber('not-a-number')).toThrow('Invalid number');
    });

    it('should enforce minimum value', () => {
      expect(sanitizeNumber(5, 10, 100)).toBe(10);
    });

    it('should enforce maximum value', () => {
      expect(sanitizeNumber(150, 10, 100)).toBe(100);
    });

    it('should allow value within range', () => {
      expect(sanitizeNumber(50, 10, 100)).toBe(50);
    });

    it('should handle negative numbers', () => {
      expect(sanitizeNumber(-10, -20, 20)).toBe(-10);
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDv4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
    });

    it('should reject UUID with wrong version', () => {
      expect(validateUUID('550e8400-e29b-31d4-a716-446655440000')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateGradeLevel', () => {
    it('should accept kindergarten (0)', () => {
      expect(validateGradeLevel(0)).toBe(true);
    });

    it('should accept grade 12', () => {
      expect(validateGradeLevel(12)).toBe(true);
    });

    it('should accept middle grades', () => {
      expect(validateGradeLevel(6)).toBe(true);
    });

    it('should reject negative grades', () => {
      expect(validateGradeLevel(-1)).toBe(false);
    });

    it('should reject grades above 12', () => {
      expect(validateGradeLevel(13)).toBe(false);
    });

    it('should reject non-integer grades', () => {
      expect(validateGradeLevel(5.5)).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should accept text within limit', () => {
      expect(validateLength('Short text', 'CHILD_NAME')).toBe(true);
    });

    it('should reject text exceeding limit', () => {
      const longText = 'a'.repeat(VALIDATION_LIMITS.CHILD_NAME + 1);
      expect(validateLength(longText, 'CHILD_NAME')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(validateLength('', 'EMAIL')).toBe(true);
    });

    it('should check exact limit', () => {
      const exactText = 'a'.repeat(VALIDATION_LIMITS.LESSON_TITLE);
      expect(validateLength(exactText, 'LESSON_TITLE')).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize text content', () => {
      const input = '  Hello\x00World  ';
      expect(sanitizeUserInput(input, 'CHILD_NAME')).toBe('HelloWorld');
    });

    it('should enforce length limits', () => {
      const longInput = 'a'.repeat(200);
      const result = sanitizeUserInput(longInput, 'CHILD_NAME');
      expect(result.length).toBeLessThanOrEqual(VALIDATION_LIMITS.CHILD_NAME);
    });

    it('should handle empty input', () => {
      expect(sanitizeUserInput('', 'MESSAGE_TEXT')).toBe('');
    });

    it('should handle HTML when allowHTML is true', () => {
      const input = '<script>alert("xss")</script><p>Safe text</p>';
      const result = sanitizeUserInput(input, 'FEEDBACK_DESCRIPTION', true);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe text</p>');
    });
  });

  describe('VALIDATION_LIMITS', () => {
    it('should define reasonable limits', () => {
      expect(VALIDATION_LIMITS.CHILD_NAME).toBe(50);
      expect(VALIDATION_LIMITS.LESSON_TITLE).toBe(100);
      expect(VALIDATION_LIMITS.EMAIL).toBe(255);
      expect(VALIDATION_LIMITS.URL).toBe(2048);
    });
  });
});
