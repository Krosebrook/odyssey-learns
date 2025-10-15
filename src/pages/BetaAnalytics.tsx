import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Target, Clock } from "lucide-react";

export default function BetaAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        
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
      navigate('/');
    } else if (isAdmin === true) {
      loadAnalytics();
    }
  }, [isAdmin, navigate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch basic metrics (example queries - adjust based on actual data)
      const [childrenResult, feedbackResult] = await Promise.all([
        supabase.from('children').select('id', { count: 'exact' }),
        supabase.from('beta_feedback').select('feedback_type', { count: 'exact' })
      ]);

      setMetrics({
        totalChildren: childrenResult.count || 0,
        totalFeedback: feedbackResult.count || 0
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null || loading) {
    return (
      <ParentLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
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
        <div>
          <h1 className="text-3xl font-bold">Beta Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor beta testing metrics and feedback</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalChildren}</div>
              <p className="text-xs text-muted-foreground">Beta testers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Lessons completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Data will populate as beta testing progresses</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback Categories</CardTitle>
              <CardDescription>Distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Data will populate as feedback is submitted</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ParentLayout>
  );
}