import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LessonTokenDisplayProps {
  childId: string;
}

export const LessonTokenDisplay = ({ childId }: LessonTokenDisplayProps) => {
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const { data } = await supabase
          .from('lesson_tokens' as any)
          .select('tokens_available')
          .eq('child_id', childId)
          .single();

        setTokens((data as any)?.tokens_available || 0);
      } catch (err) {
        console.error('Error loading tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, [childId]);

  if (loading) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
          <Coins className="w-6 h-6 text-yellow-900" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Lesson Tokens</p>
          <p className="text-2xl font-bold text-yellow-700">{tokens}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Earn tokens by completing achievements! Use them to unlock extra lessons.
      </p>
    </Card>
  );
};
