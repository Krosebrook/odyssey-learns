import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuotaStatus {
  allowed: boolean;
  completed: number;
  baseLimit: number;
  bonusGranted: number;
  tokensAvailable: number;
  totalAvailable: number;
  remaining: number;
}

export const usePlatformLessonQuota = (childId: string | null) => {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkQuota = async () => {
    if (!childId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('check_platform_lesson_quota' as any, {
        p_child_id: childId
      });

      if (error) throw error;
      setQuota(data as any as QuotaStatus);
    } catch (err) {
      console.error('Error checking quota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkQuota();
  }, [childId]);

  const incrementCompleted = async () => {
    if (!childId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentCompleted = quota?.completed || 0;
      
      await supabase.from('daily_lesson_quota' as any).upsert({
        child_id: childId,
        quota_date: today,
        platform_lessons_completed: currentCompleted + 1
      }, {
        onConflict: 'child_id,quota_date'
      });

      await checkQuota();
    } catch (err) {
      console.error('Error incrementing quota:', err);
    }
  };

  return { quota, loading, checkQuota, incrementCompleted };
};
