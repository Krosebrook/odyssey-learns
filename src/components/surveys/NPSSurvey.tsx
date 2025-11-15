import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NPSSurveyProps {
  onComplete?: () => void;
  campaignId?: string;
}

export const NPSSurvey = ({ onComplete, campaignId }: NPSSurveyProps) => {
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (npsScore === null) {
      toast.error('Please select a score');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('survey_responses').insert({
        user_id: user.id,
        survey_type: 'nps',
        nps_score: npsScore,
        responses: {
          feedback,
          category: npsScore <= 6 ? 'detractor' : npsScore <= 8 ? 'passive' : 'promoter'
        },
        survey_version: '1.0'
      });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      onComplete?.();
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error('Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFollowUpQuestion = () => {
    if (npsScore === null) return null;
    if (npsScore <= 6) return "What's the #1 thing preventing you from recommending us?";
    if (npsScore <= 8) return "What would make Inner Odyssey a 10 for you?";
    return "What do you love most about Inner Odyssey?";
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">How likely are you to recommend Inner Odyssey?</h3>
        <p className="text-sm text-muted-foreground">
          Select a score from 0 (Not likely) to 10 (Very likely)
        </p>
      </div>

      <div className="grid grid-cols-11 gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <Button
            key={i}
            variant={npsScore === i ? 'default' : 'outline'}
            className="h-12 text-lg font-semibold"
            onClick={() => setNpsScore(i)}
          >
            {i}
          </Button>
        ))}
      </div>

      {npsScore !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{getFollowUpQuestion()}</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback helps us improve..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      )}
    </Card>
  );
};
