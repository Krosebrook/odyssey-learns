import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFileSize,
  validateFileType,
  getImageDimensions,
  validateImageDimensions,
  generateProfilePictureFilename,
} from '../profilePictureUpload';

describe('profilePictureUpload', () => {
  describe('validateFileSize', () => {
    it('should accept files under 5MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFileSize(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files over 5MB', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFileSize(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });

  describe('validateFileType', () => {
    it('should accept JPEG files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
    });

    it('should accept PNG files', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
    });

    it('should accept WebP files', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject unsupported MIME types', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject files with wrong extension', () => {
      const file = new File([''], 'test.txt', { type: 'image/jpeg' });
      const result = validateFileType(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('generateProfilePictureFilename', () => {
    it('should generate a unique filename', () => {
      const childId = 'test-child-123';
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      
      const filename = generateProfilePictureFilename(childId, file);
      
      expect(filename).toContain(childId);
      expect(filename).toContain('.jpg');
      expect(filename).toMatch(/test-child-123_\d+\.jpg/);
    });

    it('should preserve file extension', () => {
      const childId = 'test-child-123';
      const file = new File([''], 'photo.png', { type: 'image/png' });
      
      const filename = generateProfilePictureFilename(childId, file);
      
      expect(filename).toContain('.png');
    });
  });
});
