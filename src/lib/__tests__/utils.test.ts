import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className merge utility)', () => {
    it('should merge single class name', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should merge multiple class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should filter out false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
      expect(result).not.toContain('active-class');
    });

    it('should merge Tailwind conflicting classes correctly', () => {
      // Should keep the last conflicting class
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('should handle array of classes', () => {
      const classes = ['class1', 'class2', 'class3'];
      const result = cn(classes);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toContain('base');
      expect(cn('base', undefined, null, 'end')).toContain('end');
    });

    it('should handle object syntax', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'error': true,
      });
      expect(result).toContain('active');
      expect(result).toContain('error');
      expect(result).not.toContain('disabled');
    });
  });
});
