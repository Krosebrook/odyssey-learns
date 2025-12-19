import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdate {
  id: string;
  child_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  time_spent_seconds: number;
  completed_at: string | null;
  created_at: string;
}

interface UseRealtimeProgressProps {
  childIds: string[];
  onProgressUpdate?: (update: ProgressUpdate, eventType: 'INSERT' | 'UPDATE') => void;
}

export const useRealtimeProgress = ({ childIds, onProgressUpdate }: UseRealtimeProgressProps) => {
  const [recentProgress, setRecentProgress] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent progress for all children
  const loadRecentProgress = useCallback(async () => {
    if (childIds.length === 0) {
      setRecentProgress([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .in('child_id', childIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentProgress((data || []) as ProgressUpdate[]);
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  }, [childIds]);

  // Subscribe to realtime progress updates
  useEffect(() => {
    if (childIds.length === 0) return;

    loadRecentProgress();

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to each child's progress
    childIds.forEach((childId) => {
      const channel = supabase
        .channel(`progress:${childId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_progress',
            filter: `child_id=eq.${childId}`,
          },
          (payload) => {
            console.log('[Realtime] New progress:', payload);
            const newProgress = payload.new as ProgressUpdate;
            setRecentProgress((prev) => [newProgress, ...prev.slice(0, 19)]);
            onProgressUpdate?.(newProgress, 'INSERT');
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_progress',
            filter: `child_id=eq.${childId}`,
          },
          (payload) => {
            console.log('[Realtime] Progress updated:', payload);
            const updatedProgress = payload.new as ProgressUpdate;
            setRecentProgress((prev) =>
              prev.map((p) =>
                p.id === updatedProgress.id ? updatedProgress : p
              )
            );
            onProgressUpdate?.(updatedProgress, 'UPDATE');
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] Progress subscription for ${childId}:`, status);
        });

      channels.push(channel);
    });

    return () => {
      console.log('[Realtime] Cleaning up progress subscriptions');
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [childIds, loadRecentProgress, onProgressUpdate]);

  return {
    recentProgress,
    loading,
    refetch: loadRecentProgress,
  };
};
