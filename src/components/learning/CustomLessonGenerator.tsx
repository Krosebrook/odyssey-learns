import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomLessonGeneratorProps {
  childId: string;
  gradeLevel: number;
  onLessonCreated?: (lesson: any) => void;
}

export const CustomLessonGenerator = ({ 
  childId, 
  gradeLevel,
  onLessonCreated 
}: CustomLessonGeneratorProps) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() || !subject) {
      toast.error('Please enter a topic and select a subject');
      return;
    }

    if (loading) {
      toast.info('Generation already in progress...');
      return; // Prevent duplicate requests
    }

    setLoading(true);
    
    // Generate idempotency key for request deduplication
    const idempotencyKey = `lesson-${childId}-${Date.now()}-${Math.random()}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-lesson', {
        body: {
          childId,
          topic: topic.trim(),
          subject,
          gradeLevel,
          idempotencyKey, // Add deduplication support
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('limit reached')) {
          toast.error('Daily limit reached! You can create 3 more lessons tomorrow.');
        } else if (data.error.includes('already generating')) {
          toast.info('A lesson is already being generated. Please wait...');
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success(`Your lesson "${data.lesson.title}" is ready!`);
      setQuotaRemaining(data.quota_remaining);
      setTopic('');
      
      if (onLessonCreated) {
        onLessonCreated(data.lesson);
      }
    } catch (err) {
      console.error('Error generating custom lesson:', err);
      toast.error('Failed to generate lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold">Create Your Own Lesson!</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        What do you want to learn about today?
        {quotaRemaining !== null && (
          <span className="ml-2 font-medium text-purple-600">
            {quotaRemaining} lessons remaining today
          </span>
        )}
      </p>

      <div className="space-y-4">
        <Input
          placeholder="Enter a topic (e.g., 'Dinosaurs', 'Space', 'Kindness')"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          maxLength={100}
        />

        <Select value={subject} onValueChange={setSubject} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Reading">📚 Reading</SelectItem>
            <SelectItem value="Math">🔢 Math</SelectItem>
            <SelectItem value="Science">🔬 Science</SelectItem>
            <SelectItem value="Social Studies">🌍 Social Studies</SelectItem>
            <SelectItem value="Emotional Intelligence">💙 Emotional Intelligence</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleGenerate}
          disabled={loading || !topic.trim() || !subject}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Your Lesson...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Lesson
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
