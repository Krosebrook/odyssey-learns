import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Bug, Lightbulb, AlertTriangle, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Feedback {
  id: string;
  title: string;
  description: string;
  feedback_type: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  user_id: string;
  page_url: string | null;
  screenshot_url: string | null;
}

export default function BetaFeedbackAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        if (error) throw error;
        setIsAdmin(data as boolean);
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/');
    } else if (isAdmin === true) {
      loadFeedback();
    }
  }, [isAdmin, navigate]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feedback submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('beta_feedback')
        .update(updates)
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Feedback marked as ${newStatus}`,
      });

      loadFeedback();
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feedback status',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature_request': return <Lightbulb className="w-4 h-4" />;
      case 'content_issue': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (isAdmin === null || loading) {
    return (
      <ParentLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </ParentLayout>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Beta Feedback</h1>
            <p className="text-muted-foreground">Review and manage beta tester submissions</p>
          </div>
          <Select value={filter} onValueChange={(value) => { setFilter(value); loadFeedback(); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="wont_fix">Won't Fix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {feedback.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No feedback submissions yet</p>
            </Card>
          ) : (
            feedback.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.feedback_type)}
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.feedback_type.replace('_', ' ')}</Badge>
                        {item.category && <Badge variant="outline">{item.category}</Badge>}
                        <Badge variant={getSeverityColor(item.severity)}>{item.severity}</Badge>
                        <Badge>{item.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Submitted {new Date(item.created_at).toLocaleString()}
                        {item.page_url && ` • Page: ${item.page_url}`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="wont_fix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>

                      {item.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.screenshot_url!, '_blank')}
                        >
                          View Screenshot
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
