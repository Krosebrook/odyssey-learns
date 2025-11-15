import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PerformanceQuickViewProps {
  lessonId: string;
}

export function PerformanceQuickView({ lessonId }: PerformanceQuickViewProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadMetrics();
  }, [lessonId]);
  
  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_lesson_performance_overview', {
        p_lesson_id: lessonId
      });
      
      if (error) throw error;
      setMetrics(data?.[0] || null);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyBadge = (rating: number) => {
    if (!rating) return <Badge>No Data</Badge>;
    if (rating <= 1.5) return <Badge className="bg-success">Easy</Badge>;
    if (rating <= 2.5) return <Badge className="bg-primary">Medium</Badge>;
    if (rating <= 3.5) return <Badge className="bg-warning">Hard</Badge>;
    return <Badge className="bg-destructive">Very Hard</Badge>;
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No performance data yet</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completion_rate || 0}%</div>
          <Progress value={metrics.completion_rate || 0} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Avg Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avg_score || 0}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.sample_size || 0} students
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_attempts || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg {Math.round((metrics.avg_time_minutes || 0))} min
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Difficulty</CardTitle>
        </CardHeader>
        <CardContent>
          {getDifficultyBadge(metrics.difficulty_rating)}
          <p className="text-xs text-muted-foreground mt-2">
            Based on performance data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
