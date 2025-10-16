import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gift, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BonusLessonManagerProps {
  childId: string;
  childName: string;
  currentBonus: number;
  onBonusGranted?: () => void;
}

export const BonusLessonManager = ({ 
  childId, 
  childName,
  currentBonus,
  onBonusGranted
}: BonusLessonManagerProps) => {
  const [bonusToGrant, setBonusToGrant] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGrantBonus = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.from('daily_lesson_quota' as any).upsert({
        child_id: childId,
        quota_date: today,
        bonus_lessons_granted: currentBonus + bonusToGrant
      }, {
        onConflict: 'child_id,quota_date'
      });

      if (error) throw error;

      toast.success(`Granted ${bonusToGrant} bonus lessons to ${childName}!`);
      
      if (onBonusGranted) {
        onBonusGranted();
      }
    } catch (err) {
      console.error('Error granting bonus:', err);
      toast.error('Failed to grant bonus lessons');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-amber-600" />
        <h4 className="font-semibold">{childName}</h4>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Current bonus: {currentBonus} lessons today
      </p>

      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          max={20}
          value={bonusToGrant}
          onChange={(e) => setBonusToGrant(parseInt(e.target.value) || 1)}
          className="w-24"
          disabled={loading}
        />
        <Button 
          onClick={handleGrantBonus} 
          size="sm"
          disabled={loading}
          className="bg-gradient-to-r from-amber-500 to-orange-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          Grant Bonus
        </Button>
      </div>
    </Card>
  );
};
