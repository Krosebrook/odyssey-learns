import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../auth';

describe('auth schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidInput)).toThrow();
    });

    it('should reject short password', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '12345',
      };
      expect(() => loginSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty email', () => {
      const invalidInput = {
        email: '',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidInput)).toThrow();
    });

    it('should trim email whitespace', () => {
      const input = {
        email: '  test@example.com  ',
        password: 'password123',
      };
      const result = loginSchema.parse(input);
      expect(result.email).toBe('test@example.com');
    });

    it('should reject email over 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const invalidInput = {
        email: longEmail,
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidInput)).toThrow();
    });

    it('should reject password over 128 characters', () => {
      const longPassword = 'a'.repeat(130);
      const invalidInput = {
        email: 'test@example.com',
        password: longPassword,
      };
      expect(() => loginSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('signupSchema', () => {
    it('should accept valid signup credentials', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };
      expect(() => signupSchema.parse(validInput)).not.toThrow();
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'pass123',
        fullName: 'John Doe',
      };
      expect(() => signupSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty full name', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
      };
      expect(() => signupSchema.parse(invalidInput)).toThrow();
    });

    it('should trim full name whitespace', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '  John Doe  ',
      };
      const result = signupSchema.parse(input);
      expect(result.fullName).toBe('John Doe');
    });

    it('should reject full name over 100 characters', () => {
      const longName = 'a'.repeat(101);
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: longName,
      };
      expect(() => signupSchema.parse(invalidInput)).toThrow();
    });

    it('should accept valid long password', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'ThisIsAVeryLongButValidPassword123!',
        fullName: 'John Doe',
      };
      expect(() => signupSchema.parse(validInput)).not.toThrow();
    });

    it('should accept name with special characters', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: "John O'Brien-Smith",
      };
      expect(() => signupSchema.parse(validInput)).not.toThrow();
    });
  });
});
