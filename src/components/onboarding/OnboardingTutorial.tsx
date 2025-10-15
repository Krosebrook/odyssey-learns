import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, MessageSquare, TrendingUp, Gift, Heart, Rocket } from 'lucide-react';

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

const steps = [
  {
    title: "Welcome to Inner Odyssey Beta! 🎉",
    description: "You're a Founding Family member! This quick tour will help you get started. As a beta tester, your feedback shapes the future of learning.",
    icon: Sparkles,
  },
  {
    title: "Track Your Child's Progress",
    description: "Monitor lessons completed, points earned, and emotional check-ins from your parent dashboard.",
    icon: TrendingUp,
  },
  {
    title: "Manage Rewards & Screen Time",
    description: "Set custom rewards and healthy screen time limits. Your child earns points to redeem rewards!",
    icon: Gift,
  },
  {
    title: "Stay Connected",
    description: "Send encouraging messages and celebrate your child's achievements together.",
    icon: Heart,
  },
  {
    title: "Beta Feedback Widget 💬",
    description: "See that feedback button in the bottom-right? Use it anytime to report bugs, suggest features, or share your experience. Your input is invaluable!",
    icon: MessageSquare,
  },
  {
    title: "You're All Set! 👑",
    description: "As a thank you, you've earned the exclusive Founding Family badge! Start by adding your first child.",
    icon: Rocket,
  },
];

export const OnboardingTutorial = ({ open, onComplete, onSkip }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark onboarding as complete and set beta_tester flag
      await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true, 
          onboarding_step: steps.length,
        })
        .eq('id', user.id);

      // Award Founding Family badge
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', user.id);

      if (children && children.length > 0) {
        const badgePromises = children.map(child =>
          supabase.from('user_badges').insert({
            child_id: child.id,
            badge_id: 'founding_family',
            progress: 100
          })
        );
        await Promise.all(badgePromises);
      }

      toast({
        title: "Welcome, Founding Family Member! 👑",
        description: "You've earned the exclusive Founding Family badge!",
      });

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async () => {
    if (dontShowAgain) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error skipping tutorial:', error);
      }
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CurrentIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="dontShowAgain" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this again
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tutorial
            </Button>
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Back
            </Button>
          </div>
          <Button onClick={handleNext} className="flex-1">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
