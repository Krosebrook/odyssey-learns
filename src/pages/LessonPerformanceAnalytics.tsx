import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Clock, Award, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LessonPerformanceAnalytics() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [strugglingStudents, setStrugglingStudents] = useState<any[]>([]);

  useEffect(() => {
    if (lessonId) {
      loadAnalytics();
    }
  }, [lessonId]);

  const loadAnalytics = async () => {
    try {
      // Load lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Load performance overview
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_lesson_performance_overview', { p_lesson_id: lessonId });

      if (metricsError) throw metricsError;
      setMetrics(metricsData[0]);

      // Load daily stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: statsData, error: statsError } = await supabase
        .from('daily_lesson_stats')
        .select('*')
        .eq('lesson_id', lessonId)
        .gte('stat_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('stat_date', { ascending: true });

      if (statsError) throw statsError;
      setDailyStats(statsData || []);

      // Load struggling students
      const { data: studentsData, error: studentsError } = await supabase
        .rpc('get_struggling_students', { p_lesson_id: lessonId });

      if (studentsError) throw studentsError;
      setStrugglingStudents(studentsData || []);

    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load lesson analytics');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (rating: number) => {
    if (rating <= 1.5) return <Badge className="bg-success">Easy</Badge>;
    if (rating <= 2.5) return <Badge className="bg-primary">Medium</Badge>;
    if (rating <= 3.5) return <Badge className="bg-warning">Hard</Badge>;
    return <Badge className="bg-destructive">Very Hard</Badge>;
  };

  if (loading) {
    return (
      <ParentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </ParentLayout>
    );
  }

  if (!lesson || !metrics) {
    return (
      <ParentLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available yet</p>
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">Performance Analytics</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_attempts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.sample_size || 0} students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completion_rate || 0}%</div>
              <Progress value={metrics.completion_rate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_score || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.avg_score >= 75 ? '✓ Above target' : '⚠ Below target'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Difficulty Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getDifficultyBadge(metrics.difficulty_rating || 0)}
                <span className="text-sm text-muted-foreground">
                  {metrics.difficulty_rating?.toFixed(1) || 0}/5
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        {dailyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily completion rate and average scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="stat_date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_score" stroke="hsl(var(--primary))" name="Avg Score %" />
                  <Line type="monotone" dataKey="students_completed" stroke="hsl(var(--success))" name="Students Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Struggling Students */}
        {strugglingStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Students Who Need Support
              </CardTitle>
              <CardDescription>Students scoring below 60% or incomplete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strugglingStudents.map((student) => (
                  <div key={student.child_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{student.child_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.attempts} attempts • Avg score: {student.avg_score}%
                      </p>
                    </div>
                    <Badge variant="outline" className="text-warning">
                      Needs Help
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.completion_rate > 80 && (
              <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-success">High Completion Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.completion_rate}% of students complete this lesson - above average!
                  </p>
                </div>
              </div>
            )}

            {metrics.avg_score < 60 && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Low Average Score</p>
                  <p className="text-sm text-muted-foreground">
                    Consider reviewing quiz questions or adding more practice activities
                  </p>
                </div>
              </div>
            )}

            {metrics.difficulty_rating > 3.5 && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">High Difficulty</p>
                  <p className="text-sm text-muted-foreground">
                    This lesson may be too challenging. Consider adding support materials or scaffolding.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ParentLayout>
  );
}
