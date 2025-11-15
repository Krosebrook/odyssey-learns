/**
 * Input sanitization utilities to prevent XSS and other injection attacks
 */

import DOMPurify from 'dompurify';

/**
 * Content length limits for security
 */
export const VALIDATION_LIMITS = {
  CHILD_NAME: 50,
  LESSON_TITLE: 100,
  LESSON_DESCRIPTION: 500,
  MESSAGE_TEXT: 1000,
  CUSTOM_REWARD: 200,
  FEEDBACK_TITLE: 150,
  FEEDBACK_DESCRIPTION: 2000,
  EMOTION_NOTES: 500,
  EMAIL: 255,
  URL: 2048
} as const;

/**
 * Sanitizes HTML content by escaping special characters
 */
export const sanitizeHTML = (input: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  const reg = /[&<>"'/]/gi;
  return input.replace(reg, (match) => map[match]);
};

/**
 * Sanitizes text input by removing dangerous characters
 */
export const sanitizeText = (input: string, maxLength: number = 1000): string => {
  // Remove null bytes, control characters except newlines/tabs
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitizes markdown by allowing safe markdown syntax only
 */
export const sanitizeMarkdown = (input: string): string => {
  // First sanitize HTML
  let sanitized = sanitizeText(input, 5000);
  
  // Remove potential script injection in markdown links
  sanitized = sanitized.replace(/\[([^\]]*)\]\(javascript:[^\)]*\)/gi, '[$1](#)');
  
  // Remove data URIs that could contain scripts
  sanitized = sanitized.replace(/\[([^\]]*)\]\(data:[^\)]*\)/gi, '[$1](#)');
  
  return sanitized;
};

/**
 * Validates and sanitizes email addresses
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
};

/**
 * Sanitizes URL to prevent javascript: and data: schemes
 */
export const sanitizeURL = (url: string): string => {
  const trimmed = url.trim();
  
  // Block dangerous protocols
  if (trimmed.match(/^(javascript|data|vbscript):/i)) {
    return '#';
  }
  
  // Only allow http, https, and relative URLs
  if (!trimmed.match(/^(https?:\/\/|\/)/i)) {
    return '#';
  }
  
  return trimmed;
};

/**
 * Sanitizes numeric input
 */
export const sanitizeNumber = (input: string | number, min?: number, max?: number): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    throw new Error('Invalid number');
  }
  
  if (min !== undefined && num < min) {
    return min;
  }
  
  if (max !== undefined && num > max) {
    return max;
  }
  
  return num;
};

/**
 * Sanitizes rich text content with DOMPurify
 */
export const sanitizeRichText = (html: string, maxLength?: number): string => {
  if (!html) return '';
  
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i
  });
  
  if (maxLength && cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength);
  }
  
  return cleaned;
};

/**
 * Validates and sanitizes UUID
 */
export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Validates grade level (K-12)
 */
export const validateGradeLevel = (grade: number): boolean => {
  return Number.isInteger(grade) && grade >= 0 && grade <= 12;
};

/**
 * Validates content length against defined limits
 */
export const validateLength = (
  input: string,
  limitKey: keyof typeof VALIDATION_LIMITS
): boolean => {
  return input.length <= VALIDATION_LIMITS[limitKey];
};

/**
 * Comprehensive input sanitization for user-generated content
 */
export const sanitizeUserInput = (
  input: string,
  limitKey: keyof typeof VALIDATION_LIMITS,
  allowHTML: boolean = false
): string => {
  if (!input) return '';
  
  // First, enforce length limit
  const maxLength = VALIDATION_LIMITS[limitKey];
  let sanitized = input.substring(0, maxLength);
  
  // Then sanitize based on content type
  if (allowHTML) {
    sanitized = sanitizeRichText(sanitized);
  } else {
    sanitized = sanitizeText(sanitized, maxLength);
  }
  
  return sanitized;
};
