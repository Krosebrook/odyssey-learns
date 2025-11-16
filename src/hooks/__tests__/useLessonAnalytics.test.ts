import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackLessonView, trackLessonSave, trackLessonShare } from '../useLessonAnalytics';
import { mockSupabaseClient } from '@/test/mocks/supabase';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useLessonAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackLessonView', () => {
    it('should invoke edge function with view event', async () => {
      const lessonId = 'lesson-123';
      const childId = 'child-123';

      mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

      await trackLessonView(lessonId, childId);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('track-lesson-analytics', {
        body: {
          lessonId,
          childId,
          eventType: 'view',
        },
      });
    });

    it('should handle errors silently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Network error'));

      await trackLessonView('lesson-123', 'child-123');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackLessonSave', () => {
    it('should show success toast on successful save', async () => {
      const { toast } = await import('sonner');

      mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

      await trackLessonSave('lesson-123', 'child-123');

      expect(toast.success).toHaveBeenCalledWith('Lesson saved!');
    });

    it('should show error toast on failure', async () => {
      const { toast } = await import('sonner');

      mockSupabaseClient.functions.invoke.mockResolvedValue({ 
        data: null, 
        error: { message: 'Save failed' } 
      });

      await trackLessonSave('lesson-123', 'child-123');

      expect(toast.error).toHaveBeenCalledWith('Failed to save lesson');
    });
  });

  describe('trackLessonShare', () => {
    it('should show success toast on successful share', async () => {
      const { toast } = await import('sonner');

      mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

      await trackLessonShare('lesson-123', 'child-123');

      expect(toast.success).toHaveBeenCalledWith('Lesson shared!');
    });

    it('should invoke edge function with share event', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({ data: null, error: null });

      await trackLessonShare('lesson-123', 'child-123');

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('track-lesson-analytics', {
        body: {
          lessonId: 'lesson-123',
          childId: 'child-123',
          eventType: 'share',
        },
      });
    });
  });
});
