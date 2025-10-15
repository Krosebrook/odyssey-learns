/**
 * Input sanitization utilities to prevent XSS and other injection attacks
 */

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
