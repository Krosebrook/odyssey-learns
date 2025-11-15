import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, AlertCircle, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";

export default function StudentPerformanceReport() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<any[]>([]);
  const [strengths, setStrengths] = useState<any[]>([]);
  const [struggles, setStruggles] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);

  useEffect(() => {
    if (childId) {
      loadPerformanceData();
    }
  }, [childId]);

  const loadPerformanceData = async () => {
    if (!childId) return;

    try {
      // Load child info
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (childError) throw childError;
      setChild(childData);

      // Load overall stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*, lessons(subject)')
        .eq('child_id', childId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (progressError) throw progressError;

      // Calculate overall stats
      const completed = progressData?.filter(p => p.status === 'completed') || [];
      const avgScore = completed.length > 0 
        ? completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length 
        : 0;

      setOverallStats({
        totalCompleted: completed.length,
        avgScore: Math.round(avgScore),
        totalPoints: childData.total_points || 0,
        streak: await calculateStreak(childId)
      });

      // Subject breakdown
      const subjectMap: any = {};
      completed.forEach(p => {
        const subject = p.lessons?.subject || 'other';
        if (!subjectMap[subject]) {
          subjectMap[subject] = { subject, totalScore: 0, count: 0 };
        }
        subjectMap[subject].totalScore += p.score || 0;
        subjectMap[subject].count += 1;
      });

      const breakdown = Object.values(subjectMap).map((s: any) => ({
        subject: s.subject,
        avgScore: Math.round(s.totalScore / s.count)
      }));
      setSubjectBreakdown(breakdown);

      // Identify strengths (>85% avg)
      const strongSubjects = breakdown.filter(s => s.avgScore > 85);
      setStrengths(strongSubjects);

      // Identify struggles (<60% avg)
      const weakSubjects = breakdown.filter(s => s.avgScore < 60);
      setStruggles(weakSubjects);

      // Load recommendations
      await loadRecommendations(childData, weakSubjects);

      // Progress over time (group by day)
      const dailyProgress = groupByDay(completed);
      setProgressData(dailyProgress);

    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast.error('Failed to load performance report');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (childId: string) => {
    const { data, error } = await supabase.rpc('calculate_streak', {
      p_child_id: childId
    });
    return data || 0;
  };

  const loadRecommendations = async (child: any, weakSubjects: any[]) => {
    const recs = [];
    
    // Find lessons in struggle subjects
    if (weakSubjects.length > 0) {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('grade_level', child.grade_level)
        .in('subject', weakSubjects.map(s => s.subject))
        .eq('is_active', true)
        .limit(3);
      
      if (data) recs.push(...data);
    }

    // Find popular lessons at same grade
    const { data: popularLessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade_level', child.grade_level)
      .eq('is_active', true)
      .order('points_value', { ascending: false })
      .limit(2);

    if (popularLessons) recs.push(...popularLessons);
    
    setRecommendations(recs.slice(0, 5));
  };

  const groupByDay = (progress: any[]) => {
    const dayMap: any = {};
    progress.forEach(p => {
      const day = new Date(p.created_at).toLocaleDateString();
      if (!dayMap[day]) {
        dayMap[day] = { day, totalScore: 0, count: 0 };
      }
      dayMap[day].totalScore += p.score || 0;
      dayMap[day].count += 1;
    });

    return Object.values(dayMap).map((d: any) => ({
      day: d.day,
      avgScore: Math.round(d.totalScore / d.count)
    }));
  };

  if (loading) {
    return (
      <ParentLayout>
        <LoadingSpinner />
      </ParentLayout>
    );
  }

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-3xl font-bold mt-2">
              {child?.name}'s Performance Report
            </h1>
            <p className="text-muted-foreground">Last 30 days</p>
          </div>
        </div>

        {/* Overall Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalCompleted || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.avgScore || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.streak || 0} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalPoints || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
            <CardDescription>Average scores across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strengths & Struggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-success" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.map(s => (
                    <li key={s.subject} className="flex items-center justify-between">
                      <span className="capitalize">{s.subject}</span>
                      <Badge className="bg-success">{s.avgScore}%</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Keep practicing to identify strengths!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {struggles.length > 0 ? (
                <ul className="space-y-2">
                  {struggles.map(s => (
                    <li key={s.subject} className="flex items-center justify-between">
                      <span className="capitalize">{s.subject}</span>
                      <Badge variant="outline">{s.avgScore}%</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Great job! No major struggles identified.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>Daily average scores (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommended Next Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Lessons</CardTitle>
            <CardDescription>Based on performance and grade level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map(lesson => (
                <Card key={lesson.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/lessons/${lesson.id}`)}>
                  <CardHeader>
                    <CardTitle className="text-sm">{lesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="capitalize">{lesson.subject}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Grade {lesson.grade_level} • {lesson.estimated_minutes} min
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ParentLayout>
  );
}
