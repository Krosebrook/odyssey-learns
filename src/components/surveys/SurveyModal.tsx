import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NPSSurvey } from './NPSSurvey';
import { supabase } from '@/integrations/supabase/client';

export const SurveyModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    checkSurveyEligibility();
  }, []);

  const checkSurveyEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has already responded to active campaign
      const { data: activeCampaign } = await supabase
        .from('survey_campaigns')
        .select('id')
        .eq('status', 'active')
        .eq('survey_type', 'nps')
        .single();

      if (!activeCampaign) return;

      const { data: existingResponse } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .eq('survey_type', 'nps')
        .gte('completed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existingResponse) {
        setCampaignId(activeCampaign.id);
        // Show after 3 seconds delay
        setTimeout(() => setIsOpen(true), 3000);
      }
    } catch (error) {
      console.error('Survey eligibility check error:', error);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Help Us Improve Inner Odyssey</DialogTitle>
        </DialogHeader>
        <NPSSurvey onComplete={handleComplete} campaignId={campaignId || undefined} />
      </DialogContent>
    </Dialog>
  );
};
