import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";

interface PendingLesson {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  creator_name: string;
  created_at: string;
}

export const PendingShareApprovals = () => {
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all children for this parent
      const { data: children } = await supabase
        .from('children')
        .select('id, name')
        .eq('parent_id', user.id);

      if (!children || children.length === 0) {
        setLoading(false);
        return;
      }

      const childIds = children.map(c => c.id);

      // Get pending lessons
      const { data: lessons, error } = await supabase
        .from('child_generated_lessons' as any)
        .select('*')
        .in('creator_child_id', childIds)
        .eq('share_status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add creator names
      const lessonsWithNames = (lessons || []).map((lesson: any) => {
        const creator = children.find(c => c.id === lesson.creator_child_id);
        return {
          ...lesson,
          creator_name: creator?.name || 'Unknown'
        };
      });

      setPendingLessons(lessonsWithNames);
    } catch (err) {
      console.error('Error loading pending approvals:', err);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lessonId: string) => {
    setActioningId(lessonId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('child_generated_lessons' as any)
        .update({
          share_status: 'public',
          parent_approved_at: new Date().toISOString(),
          parent_approved_by: user?.id
        })
        .eq('id', lessonId);

      if (error) throw error;

      toast.success('Lesson approved and published to community! 🎉');
      await loadPendingApprovals();
    } catch (err) {
      console.error('Error approving lesson:', err);
      toast.error('Failed to approve lesson');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (lessonId: string) => {
    setActioningId(lessonId);
    try {
      const { error } = await supabase
        .from('child_generated_lessons' as any)
        .update({ share_status: 'private' })
        .eq('id', lessonId);

      if (error) throw error;

      toast.success('Lesson kept private');
      await loadPendingApprovals();
    } catch (err) {
      console.error('Error rejecting lesson:', err);
      toast.error('Failed to update lesson');
    } finally {
      setActioningId(null);
    }
  };

  const handlePreview = (lessonId: string) => {
    window.open(`/lessons/${lessonId}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Share Approvals</CardTitle>
          <CardDescription>Review lesson sharing requests from your children</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingLessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Share Approvals</CardTitle>
          <CardDescription>Review lesson sharing requests from your children</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending share requests at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Share Approvals</span>
          <Badge variant="secondary">{pendingLessons.length}</Badge>
        </CardTitle>
        <CardDescription>Review lesson sharing requests from your children</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingLessons.map(lesson => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary">{lesson.subject}</Badge>
                    <Badge variant="outline">
                      Grade {lesson.grade_level === 0 ? 'K' : lesson.grade_level}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created by: <strong>{lesson.creator_name}</strong></p>
                    <p>Requested: {new Date(lesson.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(lesson.id)}
                      disabled={!!actioningId}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(lesson.id)}
                      disabled={!!actioningId}
                    >
                      {actioningId === lesson.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      Keep Private
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(lesson.id)}
                      disabled={!!actioningId}
                    >
                      {actioningId === lesson.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
