import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { BackButton } from "@/components/ui/back-button";
import { 
  CheckCircle, XCircle, AlertTriangle, 
  ArrowLeft, Save, Send, Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SafeMarkdown } from "@/components/learning/SafeMarkdown";
import { Slider } from "@/components/ui/slider";

export default function LessonReview() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [priority, setPriority] = useState<string>('normal');
  const [startTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Review form state
  const [scores, setScores] = useState({
    age_appropriate_score: 3,
    content_accuracy_score: 3,
    clarity_score: 3,
    engagement_score: 3,
    assessment_quality_score: 3,
  });
  const [feedback, setFeedback] = useState({
    strengths: '',
    weaknesses: '',
    suggestions: '',
    reviewer_notes: '',
  });

  useEffect(() => {
    loadReviewData();
  }, [reviewId]);

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const allScoresFilled = Object.values(scores).every(s => s > 0);
        if (allScoresFilled) {
          handleSubmitReview('approved');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scores]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadReviewData = async () => {
    if (!reviewId) return;

    setLoading(true);
    try {
      // Load review data
      const { data: reviewData, error: reviewError } = await supabase
        .from('lesson_reviews')
        .select('*, lessons(*)')
        .eq('id', reviewId)
        .single();

      if (reviewError) throw reviewError;

      setReview(reviewData);
      setLesson(reviewData.lessons);
      setPriority(reviewData.priority || 'normal');

      // Populate existing scores if available
      if (reviewData.age_appropriate_score) {
        setScores({
          age_appropriate_score: reviewData.age_appropriate_score,
          content_accuracy_score: reviewData.content_accuracy_score,
          clarity_score: reviewData.clarity_score,
          engagement_score: reviewData.engagement_score,
          assessment_quality_score: reviewData.assessment_quality_score,
        });
      }

      // Populate existing feedback
      if (reviewData.strengths) {
        setFeedback({
          strengths: reviewData.strengths || '',
          weaknesses: reviewData.weaknesses || '',
          suggestions: reviewData.suggestions || '',
          reviewer_notes: reviewData.reviewer_notes || '',
        });
      }

    } catch (error) {
      console.error('Failed to load review data:', error);
      toast.error('Failed to load review');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (key: string, value: number[]) => {
    setScores(prev => ({ ...prev, [key]: value[0] }));
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const { error } = await supabase
        .from('lesson_reviews')
        .update({ priority: newPriority })
        .eq('id', reviewId);
      
      if (error) throw error;
      setPriority(newPriority);
      toast.success('Priority updated');
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_reviews')
        .update({
          ...scores,
          ...feedback,
          priority,
          status: 'in_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Draft saved successfully');
      loadReviewData();

    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (status: 'approved' | 'rejected' | 'needs_revision') => {
    // Validate all scores are filled
    const allScoresFilled = Object.values(scores).every(score => score > 0);
    if (!allScoresFilled) {
      toast.error('Please rate all criteria before submitting');
      return;
    }

    // Validate feedback for rejected/needs revision
    if ((status === 'rejected' || status === 'needs_revision') && !feedback.weaknesses) {
      toast.error('Please provide weaknesses/issues before rejecting or requesting revision');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_reviews')
        .update({
          ...scores,
          ...feedback,
          status,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success(`Review ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'marked for revision'}!`);
      navigate('/admin');

    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ParentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </ParentLayout>
    );
  }

  if (!lesson || !review) {
    return (
      <ParentLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Review not found</p>
        </div>
      </ParentLayout>
    );
  }

  const averageScore = (
    Object.values(scores).reduce((sum, score) => sum + score, 0) / 5
  ).toFixed(1);

  return (
    <ParentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Lesson Review</h1>
              <p className="text-muted-foreground">
                Quality assurance for AI-generated content
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Score: {averageScore}/5.0
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lesson Content Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                    <div className="flex items-center gap-2 pt-2">
                      <SubjectBadge 
                        subject={lesson.subject.toLowerCase().replace(' ', '') as any} 
                      />
                      <Badge variant="secondary">
                        Grade {lesson.grade_level === 0 ? 'K' : lesson.grade_level}
                      </Badge>
                      <Badge variant="outline">
                        {lesson.estimated_minutes} min
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SafeMarkdown 
                  content={lesson.content_markdown} 
                  className="prose prose-sm max-w-none dark:prose-invert" 
                />

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-4">Assessment Questions</h3>
                  <div className="space-y-4">
                    {lesson.quiz_questions?.map((q: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                          <div className="space-y-1 ml-4">
                            {q.options?.map((opt: string, optIdx: number) => (
                              <div 
                                key={optIdx}
                                className={`text-sm ${optIdx === q.correct_answer ? 'text-success font-medium' : 'text-muted-foreground'}`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt}
                                {optIdx === q.correct_answer && ' ✓'}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Criteria</CardTitle>
                <CardDescription>
                  Rate each aspect from 1 (poor) to 5 (excellent)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Appropriate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Age Appropriate</Label>
                    <span className="text-sm font-medium">{scores.age_appropriate_score}/5</span>
                  </div>
                  <Slider
                    value={[scores.age_appropriate_score]}
                    onValueChange={(v) => handleScoreChange('age_appropriate_score', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                {/* Content Accuracy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Content Accuracy</Label>
                    <span className="text-sm font-medium">{scores.content_accuracy_score}/5</span>
                  </div>
                  <Slider
                    value={[scores.content_accuracy_score]}
                    onValueChange={(v) => handleScoreChange('content_accuracy_score', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                {/* Clarity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Clarity & Organization</Label>
                    <span className="text-sm font-medium">{scores.clarity_score}/5</span>
                  </div>
                  <Slider
                    value={[scores.clarity_score]}
                    onValueChange={(v) => handleScoreChange('clarity_score', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                {/* Engagement */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Engagement Level</Label>
                    <span className="text-sm font-medium">{scores.engagement_score}/5</span>
                  </div>
                  <Slider
                    value={[scores.engagement_score]}
                    onValueChange={(v) => handleScoreChange('engagement_score', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                {/* Assessment Quality */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Assessment Quality</Label>
                    <span className="text-sm font-medium">{scores.assessment_quality_score}/5</span>
                  </div>
                  <Slider
                    value={[scores.assessment_quality_score]}
                    onValueChange={(v) => handleScoreChange('assessment_quality_score', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Strengths</Label>
                  <Textarea
                    placeholder="What works well in this lesson?"
                    value={feedback.strengths}
                    onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weaknesses/Issues</Label>
                  <Textarea
                    placeholder="What needs improvement?"
                    value={feedback.weaknesses}
                    onChange={(e) => setFeedback(prev => ({ ...prev, weaknesses: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Suggestions</Label>
                  <Textarea
                    placeholder="How can this be improved?"
                    value={feedback.suggestions}
                    onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    placeholder="Private notes for reviewers only"
                    value={feedback.reviewer_notes}
                    onChange={(e) => setFeedback(prev => ({ ...prev, reviewer_notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>

                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => handleSubmitReview('approved')}
                  disabled={submitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Lesson
                </Button>

                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => handleSubmitReview('needs_revision')}
                  disabled={submitting}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Needs Revision
                </Button>

                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => handleSubmitReview('rejected')}
                  disabled={submitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Lesson
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ParentLayout>
  );
}
