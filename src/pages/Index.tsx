import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChildSelector } from "@/components/auth/ChildSelector";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else {
        loadChildren();
      }
    }
  }, [user, authLoading, navigate]);

  const loadChildren = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id);

    if (data && data.length > 0) {
      setChildren(data);
    } else {
      navigate('/parent-setup');
    }
    
    setLoading(false);
  };

  const handleChildSelect = (childId: string) => {
    localStorage.setItem('selectedChildId', childId);
    navigate('/dashboard');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-6xl space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-4 shadow-elevated">
            <span className="text-3xl font-bold text-primary-foreground">IO</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Inner Odyssey!</h1>
          <p className="text-muted-foreground">
            Who's ready to learn today?
          </p>
        </div>

        <ChildSelector children={children} onSelect={handleChildSelect} />
      </div>
    </div>
  );
};

export default Index;
