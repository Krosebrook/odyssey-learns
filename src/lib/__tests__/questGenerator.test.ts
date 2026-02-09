import { describe, it, expect } from 'vitest';
import { isQuestStale } from '../questGenerator';

describe('questGenerator', () => {
  describe('isQuestStale', () => {
    it('should return false if quest was never completed', () => {
      expect(isQuestStale(null)).toBe(false);
    });

    it('should return false if quest was completed today', () => {
      const today = new Date();
      expect(isQuestStale(today.toISOString())).toBe(false);
    });

    it('should return true if quest was completed yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isQuestStale(yesterday.toISOString())).toBe(true);
    });

    it('should return true if quest was completed last month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(isQuestStale(lastMonth.toISOString())).toBe(true);
    });

    it('should return true if quest was completed last year', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      expect(isQuestStale(lastYear.toISOString())).toBe(true);
    });

    it('should handle different times on same day', () => {
      const today = new Date();
      const morning = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        8,
        0,
        0
      );
      expect(isQuestStale(morning.toISOString())).toBe(false);
    });
  });
});
