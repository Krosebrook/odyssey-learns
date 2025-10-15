import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target, Heart, Brain, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AIInsightsProps {
  childId: string;
}

export const AIInsights = ({ childId }: AIInsightsProps) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    loadInsights();
  }, [childId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Load child data and progress
      const { data: child } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      // Load recent activity
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Load emotion logs
      const { data: emotions } = await supabase
        .from('emotion_logs')
        .select('*')
        .eq('child_id', childId)
        .order('logged_at', { ascending: false })
        .limit(10);

      // Generate AI insights based on data
      const generatedInsights = generateInsights(child, progress, emotions);
      setInsights(generatedInsights);

    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (child: any, progress: any[], emotions: any[]) => {
    const completedCount = progress?.filter(p => p.status === 'completed').length || 0;
    const avgScore = progress?.reduce((acc, p) => acc + (p.score || 0), 0) / (completedCount || 1);
    const recentEmotions = emotions?.slice(0, 5) || [];
    
    const emotionSummary = recentEmotions.reduce((acc: any, e) => {
      acc[e.emotion_type] = (acc[e.emotion_type] || 0) + 1;
      return acc;
    }, {});
    
    const dominantEmotion = Object.entries(emotionSummary).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

    return {
      strengths: [
        {
          icon: TrendingUp,
          title: completedCount > 10 ? "Strong Learning Momentum" : "Building Consistency",
          description: `${completedCount} lessons completed with ${Math.round(avgScore)}% average score`,
          color: "text-green-600 dark:text-green-400",
        },
        {
          icon: Heart,
          title: "Emotional Awareness",
          description: dominantEmotion 
            ? `Most frequently expressed emotion: ${dominantEmotion}`
            : "Developing emotional intelligence",
          color: "text-pink-600 dark:text-pink-400",
        },
      ],
      recommendations: [
        {
          icon: Target,
          title: avgScore < 70 ? "Focus on Fundamentals" : "Challenge Level Up",
          description: avgScore < 70 
            ? "Consider reviewing foundational concepts before advancing"
            : "Ready for more challenging content in strong subjects",
          priority: avgScore < 70 ? "high" : "medium",
        },
        {
          icon: Brain,
          title: "Learning Style Optimization",
          description: child?.learning_style === 'visual'
            ? "Leverage visual content for better retention"
            : "Mix activity types for balanced development",
          priority: "medium",
        },
      ],
      alerts: progress?.some(p => (p.score || 0) < 50) ? [
        {
          icon: AlertTriangle,
          title: "Struggling Area Detected",
          description: "Some recent lessons scored below 50% - consider extra support",
          severity: "warning",
        },
      ] : [],
      nextSteps: [
        `Continue daily learning sessions (${child?.daily_quest_id ? 'Quest active' : 'No active quest'})`,
        `Practice emotional regulation exercises`,
        avgScore > 80 ? `Explore advanced ${child?.grade_level + 1} content` : `Master grade ${child?.grade_level} fundamentals`,
      ],
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Not enough data yet. Check back after more activities!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Insights</CardTitle>
          </div>
          <CardDescription>
            Personalized recommendations based on learning patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strengths */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Strengths
            </h3>
            <div className="space-y-3">
              {insights.strengths.map((strength: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg bg-background border">
                  <strength.icon className={`h-5 w-5 ${strength.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="font-medium text-sm">{strength.title}</p>
                    <p className="text-xs text-muted-foreground">{strength.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </h3>
            <div className="space-y-3">
              {insights.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg bg-background border">
                  <rec.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {insights.alerts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Attention Needed
              </h3>
              <div className="space-y-3">
                {insights.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <alert.icon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-destructive">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div>
            <h3 className="font-semibold mb-3">Suggested Next Steps</h3>
            <ul className="space-y-2">
              {insights.nextSteps.map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button variant="outline" className="w-full" onClick={loadInsights}>
            <Sparkles className="mr-2 h-4 w-4" />
            Refresh Insights
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
