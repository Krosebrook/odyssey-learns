import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { usePlatformLessonQuota } from "@/hooks/usePlatformLessonQuota";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Clock, Star, BookOpen, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { SafeMarkdown } from "@/components/learning/SafeMarkdown";
import { DigitalNotebook } from "@/components/learning/DigitalNotebook";
import { CollaborativeActivity } from "@/components/learning/CollaborativeActivity";
import { CelebrationModal } from "@/components/celebration/CelebrationModal";
import { checkAndAwardBadges } from "@/lib/badgeChecker";
import * as analytics from "@/lib/analytics";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceQuickView } from "@/components/analytics/PerformanceQuickView";

interface Lesson {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  estimated_minutes: number;
  points_value: number;
  content_markdown: string;
  quiz_questions: any;
  standards_alignment: string;
}

interface Child {
  id: string;
  name: string;
  total_points: number;
  grade_level: number;
}

interface UserProgress {
  status: string;
  score: number;
  completed_at: string;
}

const LessonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { childId, isValidating } = useValidatedChild();
  const { quota, loading: quotaLoading, incrementCompleted } = usePlatformLessonQuota(childId);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [celebration, setCelebration] = useState<any>(null);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);

  useEffect(() => {
    if (!isValidating && childId && id) {
      loadLessonData();
    }
  }, [childId, id, isValidating]);

  const loadLessonData = async () => {
    if (!childId || !id) return;

    try {
      // Load lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Load child
      const { data: childData } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();

      setChild(childData);

      // Load progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("child_id", childId)
        .eq("lesson_id", id)
        .maybeSingle();

      setProgress(progressData);
    } catch (error) {
      console.error("Error loading lesson:", error);
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = async () => {
    if (!childId || !id) return;

    // Check quota before starting (only for platform lessons, not custom)
    if (!quotaLoading && quota && !quota.allowed) {
      setShowQuotaDialog(true);
      return;
    }

    try {
      // Track lesson start in analytics
      analytics.trackLessonStart(childId, id);

      // Update or create progress
      const { error } = await supabase
        .from("user_progress")
        .upsert({
          child_id: childId,
          lesson_id: id,
          status: "in_progress",
          time_spent_seconds: 0,
        });

      if (error) throw error;

      setProgress({ status: "in_progress", score: 0, completed_at: "" });
      toast({
        title: "Lesson started!",
        description: "Good luck learning!",
      });
    } catch (error) {
      console.error("Error starting lesson:", error);
      toast({
        title: "Error",
        description: "Failed to start lesson",
        variant: "destructive",
      });
    }
  };

  const handleCompleteLesson = async () => {
    if (!childId || !id || !lesson) return;
    setCompleting(true);

    try {
      // Calculate quiz score if quiz exists
      let score = 100;
      if (lesson.quiz_questions && showQuiz) {
        const totalQuestions = lesson.quiz_questions.length;
        let correctAnswers = 0;
        
        lesson.quiz_questions.forEach((q: any, index: number) => {
          if (quizAnswers[index] === q.correct) {
            correctAnswers++;
          }
        });
        
        score = Math.round((correctAnswers / totalQuestions) * 100);
      }

      // Update progress
      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert({
          child_id: childId,
          lesson_id: id,
          status: "completed",
          score,
          completed_at: new Date().toISOString(),
        });

      if (progressError) throw progressError;

      // Check if this was the daily quest
      let totalPoints = lesson.points_value;
      let isQuestComplete = false;
      
      const { data: childData } = await supabase
        .from("children")
        .select("daily_quest_id, quest_bonus_points")
        .eq("id", childId)
        .single();

      if (childData?.daily_quest_id === id) {
        totalPoints += childData.quest_bonus_points || 0;
        isQuestComplete = true;
        
        // Mark quest as completed
        await supabase
          .from("children")
          .update({ quest_completed_at: new Date().toISOString() })
          .eq("id", childId);
      }

      // Award points
      const { error: pointsError } = await supabase
        .from("children")
        .update({
          total_points: (child?.total_points || 0) + totalPoints,
        })
        .eq("id", childId);

      if (pointsError) throw pointsError;

      // Increment platform lesson quota (only for non-custom lessons)
      await incrementCompleted();

      // Show celebration
      setCelebration({
        type: isQuestComplete ? 'quest' : 'lesson',
        title: isQuestComplete ? '🎯 Quest Complete!' : '🎉 Lesson Complete!',
        message: isQuestComplete 
          ? `Amazing work! You completed today's quest and earned bonus points!`
          : `Great job! You're on your way to mastering ${lesson.subject}!`,
        points: totalPoints,
      });

      // Track lesson completion in analytics
      const timeSpent = Math.floor((Date.now() - new Date().getTime()) / 1000); // Rough estimate
      analytics.trackLessonComplete(childId, id, score, timeSpent);

      // Check for newly earned badges
      const newBadges = await checkAndAwardBadges(childId);
      if (newBadges.length > 0) {
        // Show badge celebration after lesson celebration
        setTimeout(() => {
          setCelebration({
            type: 'badge',
            title: '🏆 New Badge Earned!',
            message: `You've unlocked ${newBadges.length} new achievement badge${newBadges.length > 1 ? 's' : ''}!`,
            points: 0,
          });
        }, 3000);
      }

      toast({
        title: isQuestComplete ? "🎯 Quest Complete!" : "🎉 Lesson Complete!",
        description: `You earned ${totalPoints} points! Score: ${score}%`,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, newBadges.length > 0 ? 5000 : 2000);
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast({
        title: "Error",
        description: "Failed to complete lesson",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  if (isValidating || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lesson || !child) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Lesson not found</CardTitle>
            <CardDescription>This lesson doesn't exist or you don't have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <BackButton to="/lessons" label="Back to Lessons" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = progress?.status === "completed";
  const isInProgress = progress?.status === "in_progress";

  return (
    <AppLayout childName={child.name} points={child.total_points}>
      {celebration && (
        <CelebrationModal
          open={true}
          onClose={() => setCelebration(null)}
          type={celebration.type}
          title={celebration.title}
          message={celebration.message}
          points={celebration.points}
          gradeLevel={child.grade_level}
        />
      )}
      
      <AlertDialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Daily Lesson Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You've completed your {quota?.baseLimit || 10} daily lessons!</p>
              <p className="font-medium">Ways to unlock more lessons:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ask a parent for bonus lessons</li>
                <li>Earn Lesson Tokens through achievements</li>
                <li>Create your own custom lessons (3 per day)</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton to="/lessons" label="Back to Lessons" />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Badge variant="outline">{lesson.subject}</Badge>
                <CardTitle className="text-3xl">{lesson.title}</CardTitle>
                <CardDescription>{lesson.description}</CardDescription>
              </div>
              {isCompleted && (
                <Badge variant="default" className="bg-success">
                  ✓ Completed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.estimated_minutes} min
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {lesson.points_value} points
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Grade {lesson.grade_level}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isInProgress && !isCompleted && (
              <Button onClick={handleStartLesson} size="lg" className="w-full">
                Start Lesson
              </Button>
            )}

            {(isInProgress || isCompleted) && (
              <>
                <SafeMarkdown 
                  content={lesson.content_markdown}
                  className="prose prose-sm max-w-none dark:prose-invert"
                />

                {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz</CardTitle>
                      <CardDescription>Test your understanding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {lesson.quiz_questions.map((q: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <p className="font-medium">{index + 1}. {q.question}</p>
                          <div className="space-y-2 ml-4">
                            {q.options.map((option: string, optIndex: number) => (
                              <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option}
                                  checked={quizAnswers[index] === option}
                                  onChange={() => {
                                    setQuizAnswers({ ...quizAnswers, [index]: option });
                                    setShowQuiz(true);
                                  }}
                                  disabled={isCompleted}
                                  className="cursor-pointer"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {isInProgress && (
                  <Button 
                    onClick={handleCompleteLesson} 
                    size="lg" 
                    className="w-full"
                    disabled={completing}
                  >
                    {completing ? "Completing..." : "Complete Lesson"}
                  </Button>
                )}

                {isCompleted && progress?.score !== undefined && (
                  <Card className="bg-success/10 border-success">
                    <CardContent className="pt-6">
                      <p className="text-center text-lg font-semibold">
                        Your Score: {progress.score}%
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            </CardContent>
          </TabsContent>

          <TabsContent value="performance">
            <CardContent className="space-y-6">
              <PerformanceQuickView lessonId={id!} />
              
              <div className="text-center pt-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/lesson-performance/${id}`)}
                >
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {(isInProgress || isCompleted) && (
        <>
          <DigitalNotebook 
            childId={childId!} 
            lessonId={id!} 
            lessonTitle={lesson.title} 
          />
          
          <CollaborativeActivity 
            childId={childId!} 
            lessonId={id!} 
          />
        </>
      )}
      </div>
    </AppLayout>
  );
};

export default LessonDetail;
