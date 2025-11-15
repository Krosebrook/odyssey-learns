import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, MessageSquare } from 'lucide-react';

export default function SurveyAnalyticsDashboard() {
  const { data: responses } = useQuery({
    queryKey: ['survey-responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_type', 'nps')
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['survey-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_campaigns')
        .select('*')
        .eq('survey_type', 'nps')
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const calculateNPS = () => {
    if (!responses || responses.length === 0) return 0;
    
    const promoters = responses.filter(r => r.nps_score && r.nps_score >= 9).length;
    const detractors = responses.filter(r => r.nps_score && r.nps_score <= 6).length;
    const total = responses.length;
    
    return Math.round(((promoters - detractors) / total) * 100);
  };

  const npsScore = calculateNPS();
  const responseRate = campaigns?.[0]?.recipients_count 
    ? Math.round((responses?.length || 0) / campaigns[0].recipients_count * 100)
    : 0;

  const getNPSColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const detractors = responses?.filter(r => r.nps_score && r.nps_score <= 6) || [];
  const passives = responses?.filter(r => r.nps_score && r.nps_score >= 7 && r.nps_score <= 8) || [];
  const promoters = responses?.filter(r => r.nps_score && r.nps_score >= 9) || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Survey Analytics</h1>
        <p className="text-muted-foreground">
          Track NPS scores and feedback from beta testers
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NPS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${getNPSColor(npsScore)}`}>
              {npsScore > 0 ? '+' : ''}{npsScore}
            </div>
            {npsScore >= 30 ? (
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                Great score!
              </div>
            ) : (
              <div className="flex items-center text-sm text-yellow-600 mt-2">
                <TrendingDown className="w-4 h-4 mr-1" />
                Room for improvement
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{responseRate}%</div>
            <Progress value={responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Users className="w-4 h-4 inline mr-1" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{responses?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {campaigns?.[0]?.recipients_count || 0} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Feedback Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {responses?.filter(r => r.responses?.feedback).length || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Written comments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Promoters
              <Badge variant="default">{promoters.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {responses?.length ? Math.round((promoters.length / responses.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">Score 9-10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Passives
              <Badge variant="secondary">{passives.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {responses?.length ? Math.round((passives.length / responses.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">Score 7-8</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Detractors
              <Badge variant="destructive">{detractors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {responses?.length ? Math.round((detractors.length / responses.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">Score 0-6</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {responses?.filter(r => r.responses?.feedback).slice(0, 10).map((response) => (
              <div key={response.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    response.nps_score && response.nps_score >= 9 ? 'default' :
                    response.nps_score && response.nps_score >= 7 ? 'secondary' : 
                    'destructive'
                  }>
                    Score: {response.nps_score}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(response.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{response.responses?.feedback}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
