import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { checkServerRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: "bug" as "bug" | "feature_request" | "usability" | "content_issue" | "general",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    title: "",
    description: "",
    screenshot_url: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check rate limit before submitting feedback
      const rateLimit = await checkServerRateLimit(
        RATE_LIMITS.BETA_FEEDBACK.endpoint,
        RATE_LIMITS.BETA_FEEDBACK.maxRequests,
        RATE_LIMITS.BETA_FEEDBACK.windowMinutes
      );

      if (!rateLimit.allowed) {
        toast({
          title: "Too Many Submissions",
          description: `You can submit ${RATE_LIMITS.BETA_FEEDBACK.maxRequests} feedback items per day. Try again tomorrow.`,
          variant: "destructive",
          duration: 8000
        });
        setIsSubmitting(false);
        return;
      }

      // Capture device info
      const deviceInfo = {
        browser: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform
      };

      // @ts-ignore - Types will regenerate after migration
      const { error } = await (supabase as any).from('beta_feedback').insert({
        user_id: user.id,
        feedback_type: formData.type,
        severity: formData.type === 'bug' ? formData.severity : null,
        title: formData.title,
        description: formData.description,
        screenshot_url: formData.screenshot_url || null,
        device_info: deviceInfo,
        page_url: window.location.pathname
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted! 🎉",
        description: "Thanks for helping us improve Inner Odyssey. We'll review your feedback soon."
      });

      // Reset form
      setFormData({
        type: "bug",
        severity: "medium",
        title: "",
        description: "",
        screenshot_url: ""
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => {
          setIsMinimized(false);
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform"
        aria-label="Open feedback widget"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Feedback
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Beta Feedback</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(true);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Feedback Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: typeof formData.type) => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug Report</SelectItem>
                  <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                  <SelectItem value="usability">🎨 Usability Issue</SelectItem>
                  <SelectItem value="content_issue">📚 Content Issue</SelectItem>
                  <SelectItem value="general">💬 General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'bug' && (
              <div className="space-y-2">
                <Label>Severity *</Label>
                <RadioGroup
                  value={formData.severity}
                  onValueChange={(value: typeof formData.severity) =>
                    setFormData({ ...formData, severity: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="cursor-pointer">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="cursor-pointer">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="critical" id="critical" />
                    <Label htmlFor="critical" className="cursor-pointer">Critical</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of your feedback"
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={
                  formData.type === 'bug' 
                    ? "What happened? What did you expect? Steps to reproduce?"
                    : "Tell us more about your suggestion or feedback..."
                }
                maxLength={1000}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot URL (Optional)</Label>
              <Input
                id="screenshot"
                type="url"
                value={formData.screenshot_url}
                onChange={(e) => setFormData({ ...formData, screenshot_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Upload to Imgur, Dropbox, or similar and paste the link here
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};