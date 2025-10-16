import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Share2, Loader2 } from "lucide-react";

interface ShareLessonModalProps {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ShareLessonModal = ({
  lessonId,
  lessonTitle,
  open,
  onOpenChange,
  onSuccess
}: ShareLessonModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleRequestShare = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('child_generated_lessons' as any)
        .update({ share_status: 'pending_approval' })
        .eq('id', lessonId);

      if (error) throw error;

      toast.success('Share request sent to your parent for approval!');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error requesting share:', err);
      toast.error('Failed to send share request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Lesson
          </DialogTitle>
          <DialogDescription>
            You're about to request permission to share "{lessonTitle}" with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/10 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">What happens next:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Your parent will review your lesson</li>
              <li>✓ They can approve or keep it private</li>
              <li>✓ If approved, other students can use your lesson</li>
              <li>✓ You earn 10 points each time someone uses it!</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Remember:</strong> Only share lessons you're proud of! Your parent will review the content before it's published.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRequestShare} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Request Share Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
