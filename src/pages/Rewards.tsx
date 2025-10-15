import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Award, Gift } from "lucide-react";
import { toast } from "sonner";

const Rewards = () => {
  const [child, setChild] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    const childId = localStorage.getItem('selectedChildId');
    
    if (!childId) return;

    const { data: childData } = await supabase
      .from('children')
      .select('*, profiles!children_parent_id_fkey(id)')
      .eq('id', childId)
      .single();

    if (childData) {
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('parent_id', childData.profiles.id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      setRewards(rewardsData || []);
    }

    setChild(childData);
    setLoading(false);
  };

  const requestReward = async (rewardId: string, pointsCost: number) => {
    if (!child) return;

    if (child.total_points < pointsCost) {
      toast.error("Not enough points!");
      return;
    }

    const { error } = await supabase
      .from('reward_redemptions')
      .insert({
        child_id: child.id,
        reward_id: rewardId,
        status: 'pending'
      });

    if (error) {
      toast.error("Failed to request reward");
    } else {
      toast.success("Reward requested! Ask your parent to approve it.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-8">
          <div className="inline-block w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-warning flex items-center justify-center mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Rewards Store</h1>
          <p className="text-muted-foreground">
            Spend your hard-earned points on awesome rewards!
          </p>
        </div>

        {/* Points Balance */}
        <Card className="p-6 bg-gradient-to-r from-accent/10 to-warning/10 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Points</p>
              <p className="text-3xl font-bold text-foreground">{child?.total_points || 0}</p>
            </div>
            <Award className="w-12 h-12 text-accent" />
          </div>
        </Card>

        {/* Available Rewards */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Rewards</h2>
          
          {rewards.length === 0 ? (
            <Card className="p-12 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No rewards available</h3>
              <p className="text-muted-foreground">
                Ask your parent to set up some rewards for you!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => {
                const canAfford = (child?.total_points || 0) >= reward.points_cost;
                
                return (
                  <Card
                    key={reward.id}
                    className={`p-6 elevated-card ${canAfford ? 'hover-scale' : 'opacity-60'}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-accent" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">{reward.points_cost}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reward.description}
                    </p>
                    
                    <Button
                      className="w-full hover-scale"
                      disabled={!canAfford}
                      onClick={() => requestReward(reward.id, reward.points_cost)}
                    >
                      {canAfford ? 'Request Reward' : 'Not Enough Points'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Rewards;
