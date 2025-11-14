import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';
import { encryptEmotionData } from '@/lib/emotionEncryption';

interface EmotionCheckInProps {
  childId: string;
  gradeLevel: number;
  onComplete?: () => void;
}

const emotions = [
  { type: 'happy', label: 'Happy', emoji: '😊', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
  { type: 'excited', label: 'Excited', emoji: '🤩', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
  { type: 'proud', label: 'Proud', emoji: '😎', color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
  { type: 'calm', label: 'Calm', emoji: '😌', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
  { type: 'worried', label: 'Worried', emoji: '😟', color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300' },
  { type: 'sad', label: 'Sad', emoji: '😢', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300' },
  { type: 'angry', label: 'Angry', emoji: '😠', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
  { type: 'frustrated', label: 'Frustrated', emoji: '😤', color: 'bg-pink-100 hover:bg-pink-200 border-pink-300' },
  { type: 'tired', label: 'Tired', emoji: '😴', color: 'bg-slate-100 hover:bg-slate-200 border-slate-300' },
  { type: 'confused', label: 'Confused', emoji: '🤔', color: 'bg-teal-100 hover:bg-teal-200 border-teal-300' },
];

export const EmotionCheckIn = ({ childId, gradeLevel, onComplete }: EmotionCheckInProps) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isYoung = gradeLevel <= 2;

  const handleSave = async () => {
    if (!selectedEmotion) {
      toast({
        title: "Select an emotion",
        description: "Please choose how you're feeling",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Encrypt sensitive fields before storing
      const encryptedData = await encryptEmotionData(
        trigger || null,
        null, // coping_strategy (not collected in this component)
        reflection || null
      );

      const { error } = await supabase.from('emotion_logs').insert({
        child_id: childId,
        emotion_type: selectedEmotion,
        intensity,
        // Store encrypted versions of sensitive data
        ...encryptedData,
        // Keep plaintext for backward compatibility (will be removed later)
        trigger: trigger || null,
        reflection_notes: reflection || null,
      });

      if (error) throw error;

      toast({
        title: "Emotion logged! 💭",
        description: "Thanks for sharing how you feel!",
      });

      // Reset form
      setSelectedEmotion(null);
      setIntensity(3);
      setTrigger('');
      setReflection('');

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error logging emotion:', error);
      toast({
        title: "Error",
        description: "Failed to save emotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <h3 className={`font-bold ${isYoung ? 'text-xl' : 'text-lg'}`}>
            How are you feeling?
          </h3>
          <p className="text-sm text-muted-foreground">
            Check in with your emotions
          </p>
        </div>
      </div>

      {/* Emotion Selection */}
      <div className="space-y-4">
        <div className={`grid ${isYoung ? 'grid-cols-3 gap-3' : 'grid-cols-5 gap-2'}`}>
          {emotions.map((emotion) => (
            <button
              key={emotion.type}
              onClick={() => setSelectedEmotion(emotion.type)}
              className={`
                ${emotion.color}
                ${selectedEmotion === emotion.type ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${isYoung ? 'p-4' : 'p-3'}
                rounded-lg border-2 transition-all flex flex-col items-center gap-1
              `}
            >
              <span className={isYoung ? 'text-4xl' : 'text-3xl'}>{emotion.emoji}</span>
              <span className={`font-medium ${isYoung ? 'text-sm' : 'text-xs'}`}>
                {emotion.label}
              </span>
            </button>
          ))}
        </div>

        {/* Intensity Slider */}
        {selectedEmotion && (
          <div className="animate-fade-in space-y-2">
            <label className="text-sm font-medium">How strong is this feeling?</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Low</span>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-xs text-muted-foreground">High</span>
              <span className="font-bold text-primary w-8 text-center">{intensity}</span>
            </div>
          </div>
        )}

        {/* Optional: What happened? (age-adaptive) */}
        {selectedEmotion && !isYoung && (
          <div className="animate-fade-in space-y-2">
            <label className="text-sm font-medium">What made you feel this way? (optional)</label>
            <Textarea
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="I felt this way because..."
              className="resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Optional: Reflection (older kids only) */}
        {selectedEmotion && gradeLevel > 5 && (
          <div className="animate-fade-in space-y-2">
            <label className="text-sm font-medium">Any thoughts to share? (optional)</label>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="I'm thinking about..."
              className="resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Save Button */}
        {selectedEmotion && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size={isYoung ? 'lg' : 'default'}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Check-In</>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
