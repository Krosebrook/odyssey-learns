import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../auth';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'not-an-email',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject password too short', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '12345',
      };
      
      const result = loginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 6 characters');
      }
    });

    it('should reject password too long', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'a'.repeat(129),
      };
      
      const result = loginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long');
      }
    });

    it('should trim whitespace from email', () => {
      const input = {
        email: '  test@example.com  ',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };
      
      const result = signupSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject password less than 8 characters', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'pass123',
        fullName: 'John Doe',
      };
      
      const result = signupSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject empty full name', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
      };
      
      const result = signupSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject full name too long', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'a'.repeat(101),
      };
      
      const result = signupSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long');
      }
    });

    it('should trim whitespace from all fields', () => {
      const input = {
        email: '  test@example.com  ',
        password: 'password123',
        fullName: '  John Doe  ',
      };
      
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.fullName).toBe('John Doe');
      }
    });
  });
});
