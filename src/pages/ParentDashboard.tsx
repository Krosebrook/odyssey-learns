import { useEffect, useState } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, Award, BookOpen, Plus, FileText, CheckCircle, Gift, Clock, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WeeklyReportCard } from "@/components/parent/WeeklyReportCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { RewardManagement } from "@/components/parent/RewardManagement";
import { RewardRedemptions } from "@/components/parent/RewardRedemptions";
import { ScreenTimeTracker } from "@/components/parent/ScreenTimeTracker";
import { ParentChildMessaging } from "@/components/parent/ParentChildMessaging";
import { AIInsights } from "@/components/parent/AIInsights";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BonusLessonManager } from "@/components/parent/BonusLessonManager";
import { PendingShareApprovals } from "@/components/parent/PendingShareApprovals";
import { logEmotionLogView } from "@/lib/auditLogger";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [dailyQuotas, setDailyQuotas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    // Check onboarding status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profileData && !profileData.onboarding_completed) {
      setShowOnboarding(true);
    }

    // Load children
    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });

    setChildren(childrenData || []);

    // Load weekly reports
    const { data: reportsData } = await supabase
      .from('parent_weekly_reports')
      .select('*, children(name)')
      .eq('parent_id', user.id)
      .order('week_start_date', { ascending: false })
      .limit(5);

    setWeeklyReports(reportsData || []);

    // Load pending collaboration requests
    if (childrenData && childrenData.length > 0) {
      const childIds = childrenData.map(c => c.id);
      const { data: requestsData } = await supabase
        .from('collaboration_requests')
        .select('*, requester:children!collaboration_requests_requester_child_id_fkey(name), recipient:children!collaboration_requests_recipient_child_id_fkey(name)')
        .in('recipient_child_id', childIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setCollaborationRequests(requestsData || []);

      // Load daily quotas for all children
      const today = new Date().toISOString().split('T')[0];
      const { data: quotaData } = await supabase
        .from('daily_lesson_quota' as any)
        .select('*')
        .in('child_id', childIds)
        .eq('quota_date', today);

      const quotaMap: Record<string, any> = {};
      quotaData?.forEach((quota: any) => {
        quotaMap[quota.child_id] = quota;
      });
      setDailyQuotas(quotaMap);
    }

    setLoading(false);
  };

  const approveCollaboration = async (requestId: string, approved: boolean) => {
    const { error } = await supabase
      .from('collaboration_requests')
      .update({ 
        status: approved ? 'approved' : 'rejected',
        parent_approved: approved,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (!error) {
      loadDashboardData();
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
    <ParentLayout>
      <OnboardingTutorial 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Parent Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your children's learning journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell parentId={user.id} />
            <Button onClick={() => navigate('/parent-setup')} className="gap-2 hover-scale">
              <Plus className="w-4 h-4" />
              Add Child
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 elevated-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Children</p>
                <p className="text-2xl font-bold">{children.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 elevated-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons This Week</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 elevated-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="children">Children</TabsTrigger>
            <TabsTrigger value="reports">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </div>
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Rewards
              </div>
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approvals
                {collaborationRequests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                    {collaborationRequests.length}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="screentime">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Screen Time
              </div>
            </TabsTrigger>
            <TabsTrigger value="messages">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Messages
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Your Children</h2>
          
          {children.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No children added yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a profile for your child to get started
              </p>
              <Button onClick={() => navigate('/parent-setup')} className="hover-scale">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Child
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <Card
                    key={child.id}
                    className="p-6 elevated-card hover-scale cursor-pointer"
                    onClick={() => {
                      localStorage.setItem('selectedChildId', child.id);
                      navigate('/dashboard');
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {child.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Grade {child.grade_level}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Points:</span>
                        <span className="font-semibold">{child.total_points || 0}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* AI Insights for First Child (expandable to all children later) */}
              {children.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">AI-Powered Insights</h2>
                  <AIInsights childId={children[0].id} />
                </div>
              )}

              {/* Bonus Lesson Management */}
              {children.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">Daily Lesson Bonuses</h2>
                  <p className="text-muted-foreground mb-4">
                    Grant bonus lessons beyond the daily 10-lesson limit or use as rewards for good behavior
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                      <BonusLessonManager
                        key={child.id}
                        childId={child.id}
                        childName={child.name}
                        currentBonus={dailyQuotas[child.id]?.bonus_lessons_granted || 0}
                        onBonusGranted={loadDashboardData}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          </TabsContent>

          {/* Weekly Reports Tab */}
          <TabsContent value="reports">
            <h2 className="text-2xl font-bold mb-6">Weekly Learning Reports</h2>
            {weeklyReports.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground">
                  Weekly reports will appear here as your children complete lessons
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weeklyReports.map((report) => (
                  <WeeklyReportCard 
                    key={report.id}
                    report={report}
                    childName={report.children?.name || "Your child"}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Collaboration Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Pending Approvals</h2>
            
            {/* Share Approvals */}
            <PendingShareApprovals />

            {/* Collaboration Requests */}
            <div>
              <h3 className="text-xl font-bold mb-4">Collaboration Requests</h3>
            {collaborationRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">
                  Collaboration requests from your children will appear here for approval
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {collaborationRequests.map((request) => (
                  <Card key={request.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {request.requester?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.requester?.name} wants to collaborate with {request.recipient?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => approveCollaboration(request.id, false)}
                        >
                          Deny
                        </Button>
                        <Button
                          onClick={() => approveCollaboration(request.id, true)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-8">
            <RewardManagement parentId={user?.id || ''} />
            <RewardRedemptions parentId={user?.id || ''} />
          </TabsContent>

          {/* Screen Time Tab */}
          <TabsContent value="screentime">
            <ScreenTimeTracker parentId={user?.id || ''} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <ParentChildMessaging parentId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </ParentLayout>
  );
};

export default ParentDashboard;
