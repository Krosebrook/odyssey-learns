import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  verifyParentAge,
  extractBirthYear,
  validateDateOfBirth,
} from '../ageVerification';

describe('ageVerification', () => {
  describe('calculateAge', () => {
    it('should calculate correct age for birth date', () => {
      const today = new Date();
      // Create a birth date that has already occurred this year
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() - 1, 15);
      expect(calculateAge(birthDate)).toBe(25);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth() + 1,
        1
      );
      expect(calculateAge(birthDate)).toBe(24);
    });

    it('should handle birthday on same day', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 30,
        today.getMonth(),
        today.getDate()
      );
      expect(calculateAge(birthDate)).toBe(30);
    });
  });

  describe('verifyParentAge', () => {
    it('should accept age 18 exactly', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const result = verifyParentAge(birthDate);
      expect(result.isValid).toBe(true);
      expect(result.age).toBe(18);
    });

    it('should accept age over 18', () => {
      const today = new Date();
      // Create a birth date that has already occurred this year
      const birthDate = new Date(today.getFullYear() - 35, today.getMonth() - 1, 15);
      const result = verifyParentAge(birthDate);
      expect(result.isValid).toBe(true);
      expect(result.age).toBe(35);
    });

    it('should reject age under 18', () => {
      const today = new Date();
      // Create a birth date that has already occurred this year
      const birthDate = new Date(today.getFullYear() - 17, today.getMonth() - 1, 15);
      const result = verifyParentAge(birthDate);
      expect(result.isValid).toBe(false);
      expect(result.age).toBe(17);
      expect(result.error).toContain('18 years old');
    });

    it('should reject unrealistic age over 120', () => {
      const birthDate = new Date(1850, 0, 1);
      const result = verifyParentAge(birthDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid date of birth');
    });
  });

  describe('extractBirthYear', () => {
    it('should extract birth year correctly', () => {
      const birthDate = new Date(1990, 5, 15);
      expect(extractBirthYear(birthDate)).toBe(1990);
    });

    it('should handle current year', () => {
      const birthDate = new Date(2024, 0, 1);
      expect(extractBirthYear(birthDate)).toBe(2024);
    });
  });

  describe('validateDateOfBirth', () => {
    it('should validate correct date format', () => {
      const result = validateDateOfBirth('1990-06-15');
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = validateDateOfBirth(futureDate.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('future');
    });

    it('should reject dates over 120 years ago', () => {
      const result = validateDateOfBirth('1850-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid date of birth');
    });

    it('should reject invalid date format', () => {
      const result = validateDateOfBirth('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    it('should accept valid recent date', () => {
      const result = validateDateOfBirth('2000-01-15');
      expect(result.isValid).toBe(true);
      expect(result.date?.getFullYear()).toBe(2000);
    });
  });
});
