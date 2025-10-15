import { AppLayout } from "@/components/layout/AppLayout";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeerConnectionsUI } from "@/components/social/PeerConnectionsUI";
import { SharedActivitiesUI } from "@/components/social/SharedActivitiesUI";
import { Users, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Social = () => {
  const { childId, isValidating } = useValidatedChild();
  const [child, setChild] = useState<any>(null);

  useEffect(() => {
    if (childId) {
      loadChild();
    }
  }, [childId]);

  const loadChild = async () => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .single();
    setChild(data);
  };

  if (isValidating || !child) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout childName={child.name} points={child.total_points || 0}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Learning</h1>
          <p className="text-muted-foreground">
            Connect with friends and learn together
          </p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Sparkles className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            <PeerConnectionsUI childId={childId!} />
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <SharedActivitiesUI childId={childId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Social;