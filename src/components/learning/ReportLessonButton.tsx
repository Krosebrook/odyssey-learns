import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface ReportLessonButtonProps {
  lessonId: string;
}

export const ReportLessonButton = ({ lessonId }: ReportLessonButtonProps) => {
  const [reported, setReported] = useState(false);

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (reported) return;

    try {
      // Get current flagged count
      const { data: lesson, error: fetchError } = await supabase
        .from('child_generated_lessons' as any)
        .select('flagged_count')
        .eq('id', lessonId)
        .single();

      if (fetchError) throw fetchError;

      const newCount = ((lesson as any)?.flagged_count || 0) + 1;
      const updates: any = { flagged_count: newCount };

      // Auto-hide if 3 or more flags
      if (newCount >= 3) {
        updates.share_status = 'flagged';
      }

      const { error: updateError } = await supabase
        .from('child_generated_lessons' as any)
        .update(updates)
        .eq('id', lessonId);

      if (updateError) throw updateError;

      setReported(true);
      toast.success('Thank you for reporting. We\'ll review this lesson.');
    } catch (err) {
      console.error('Error reporting lesson:', err);
      toast.error('Failed to report lesson');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReport}
      disabled={reported}
      className="h-8 px-2"
    >
      <Flag className={`w-3 h-3 ${reported ? 'fill-current' : ''}`} />
      <span className="sr-only">Report lesson</span>
    </Button>
  );
};
