import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BatchLessonGenerator } from "@/components/admin/BatchLessonGenerator";
import { ContentReviewDashboard } from "@/components/admin/ContentReviewDashboard";
import { LessonSeedTrigger } from "@/components/admin/LessonSeedTrigger";
import { 
  Users, BookOpen, MessageSquare, AlertCircle, 
  TrendingUp, Award, Settings, Database, ClipboardCheck,
  Activity, Shield
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    totalLessons: 0,
    activeBetaTesters: 0,
    totalFeedback: 0,
    criticalIssues: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) {
          console.error('Admin check failed:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data as boolean);
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (isAdmin === false) {
      toast.error("You don't have admin access");
      navigate('/');
    } else if (isAdmin === true) {
      loadDashboardData();
    }
  }, [isAdmin, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const [
        usersResult,
        childrenResult,
        lessonsResult,
        feedbackResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('children').select('id', { count: 'exact' }),
        supabase.from('lessons').select('id', { count: 'exact' }),
        supabase.from('beta_feedback').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
      ]);

      // Count critical issues
      const criticalCount = feedbackResult.data?.filter(f => f.severity === 'critical' || f.severity === 'high').length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalChildren: childrenResult.count || 0,
        totalLessons: lessonsResult.count || 0,
        activeBetaTesters: usersResult.count || 0, // All users are beta testers
        totalFeedback: feedbackResult.count || 0,
        criticalIssues: criticalCount,
      });

      setRecentFeedback(feedbackResult.data || []);

      // Load recent users
      const { data: recentUserData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUsers(recentUserData || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  if (isAdmin === null || loading) {
    return (
      <ParentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </ParentLayout>
    );
  }

  if (isAdmin === false) {
    return null; // Redirecting
  }

  return (
    <ParentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage Inner Odyssey platform</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/system-health')} variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              System Health
            </Button>
            <Button onClick={() => navigate('/security-monitoring')} variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button onClick={() => navigate('/beta-analytics')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active parent accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChildren}</div>
              <p className="text-xs text-muted-foreground">Registered learners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLessons}</div>
              <p className="text-xs text-muted-foreground">Available content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Beta Testers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBetaTesters}</div>
              <p className="text-xs text-muted-foreground">Participating families</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">Beta submissions</p>
            </CardContent>
          </Card>

          <Card className={stats.criticalIssues > 0 ? 'border-destructive' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.criticalIssues}</div>
              <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Sections */}
        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList>
            <TabsTrigger value="seed">Seed Lessons</TabsTrigger>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
            <TabsTrigger value="review">Content Review</TabsTrigger>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
            <TabsTrigger value="lessons">Lesson Generator</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="seed" className="space-y-4">
            <LessonSeedTrigger />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Beta Feedback</CardTitle>
                <CardDescription>Latest submissions from beta testers</CardDescription>
              </CardHeader>
              <CardContent>
                {recentFeedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No feedback yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div key={feedback.id} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(feedback.severity)}>
                              {feedback.severity || 'medium'}
                            </Badge>
                            <Badge variant="outline">{feedback.feedback_type}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{feedback.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <ContentReviewDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Joined Users</CardTitle>
                <CardDescription>New parent accounts in the beta program</CardDescription>
              </CardHeader>
              <CardContent>
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">Beta Tester</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <BatchLessonGenerator />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Beta Program Status</p>
                    <p className="text-sm text-muted-foreground">Currently accepting new testers</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Platform Version</p>
                    <p className="text-sm text-muted-foreground">Beta 1.0</p>
                  </div>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => toast.info('Feature coming soon')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Auth Settings
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => toast.info('Feature coming soon')}>
                    <Database className="mr-2 h-4 w-4" />
                    Database Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ParentLayout>
  );
}
