import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BadgeShowcase } from "@/components/badges/BadgeShowcase";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Badges = () => {
  const navigate = useNavigate();
  const { childId, isValidating } = useValidatedChild();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isValidating && childId) {
      loadChild();
    }
  }, [childId, isValidating]);

  const loadChild = async () => {
    if (!childId) return;

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    setChild(data);
    setLoading(false);
  };

  if (isValidating || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!childId) {
    navigate('/');
    return null;
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      <div className="max-w-6xl mx-auto py-8 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 Your Achievements</h1>
          <p className="text-muted-foreground">
            Collect badges by completing lessons, checking in with your emotions, and more!
          </p>
        </div>

        <BadgeShowcase childId={childId} />
      </div>
    </AppLayout>
  );
};

export default Badges;
