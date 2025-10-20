import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useValidatedChild } from '@/hooks/useValidatedChild';
import { usePlatformLessonQuota } from '@/hooks/usePlatformLessonQuota';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText } from '@/lib/inputSanitization';
import { SafeMarkdown } from '@/components/learning/SafeMarkdown';
import { ArrowLeft, BookOpen, Clock, Star, CheckCircle2, XCircle } from 'lucide-react';
import { SubjectBadge } from '@/components/ui/subject-badge';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  content_markdown: string;
  quiz_questions: any;
  points_value: number;
  estimated_minutes: number;
  description?: string;
}

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface UserProgress {
  id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  time_spent_seconds: number;
}

const LessonPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { childId } = useValidatedChild();
  const { quota, incrementCompleted } = usePlatformLessonQuota(childId);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress>({
    status: 'not_started',
    time_spent_seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [startTime] = useState(Date.now());
  const [childData, setChildData] = useState<any>(null);

  useEffect(() => {
    if (childId) {
      loadLesson();
      loadProgress();
      loadChild();
      const interval = setInterval(autoSave, 30000); // Auto-save every 30s
      return () => clearInterval(interval);
    }
  }, [id, childId]);

  const loadChild = async () => {
    if (!childId) return;
    const { data } = await supabase
      .from('children')
      .select('name, total_points')
      .eq('id', childId)
      .single();
    if (data) setChildData(data);
  };

  const loadLesson = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast({
        title: 'Lesson not found',
        description: 'This lesson may have been removed.',
        variant: 'destructive',
      });
      navigate('/lessons');
      return;
    }

    // Parse quiz_questions if it exists
    const parsedLesson = {
      ...data,
      quiz_questions: data.quiz_questions ? (typeof data.quiz_questions === 'string' ? JSON.parse(data.quiz_questions) : data.quiz_questions) : []
    };
    setLesson(parsedLesson);
    setLoading(false);
  };

  const loadProgress = async () => {
    if (!childId || !id) return;

    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('lesson_id', id)
      .maybeSingle();

    if (data) {
      setProgress({
        id: data.id,
        status: data.status as any,
        score: data.score || undefined,
        time_spent_seconds: data.time_spent_seconds || 0,
      });
    } else {
      // Create new progress record
      const { data: newProgress } = await supabase
        .from('user_progress')
        .insert({
          child_id: childId,
          lesson_id: id,
          status: 'in_progress',
          time_spent_seconds: 0,
        })
        .select()
        .single();

      if (newProgress) {
        setProgress({
          id: newProgress.id,
          status: 'in_progress',
          time_spent_seconds: 0,
        });
      }
    }
  };

  const autoSave = async () => {
    if (!childId || !id || !progress.id) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    await supabase
      .from('user_progress')
      .update({
        time_spent_seconds: timeSpent,
        status: showResults ? 'completed' : 'in_progress',
      })
      .eq('id', progress.id);
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: sanitizeText(answer),
    }));
  };

  const submitQuiz = async () => {
    if (!lesson?.quiz_questions) return;

    let correct = 0;
    lesson.quiz_questions.forEach((q, idx) => {
      if (userAnswers[idx]?.toLowerCase() === q.correct_answer.toLowerCase()) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / lesson.quiz_questions.length) * 100);
    setQuizScore(scorePercent);
    setShowResults(true);

    // Award points
    const pointsEarned = scorePercent >= 80 
      ? lesson.points_value + Math.floor(lesson.points_value * 0.2) 
      : lesson.points_value;

    if (childId && progress.id) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await supabase.from('user_progress').update({
        status: 'completed',
        score: scorePercent,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString(),
      }).eq('id', progress.id);

      await supabase.from('children').update({
        total_points: (childData?.total_points || 0) + pointsEarned,
      }).eq('id', childId);

      await incrementCompleted();

      toast({
        title: '🎉 Lesson Complete!',
        description: `You earned ${pointsEarned} points! (Score: ${scorePercent}%)`,
      });
    }
  };

  if (loading || !lesson) {
    return (
      <AppLayout childName={childData?.name} points={childData?.total_points}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = lesson.quiz_questions?.[currentQuestionIndex];
  const progressPercent = lesson.quiz_questions
    ? ((currentQuestionIndex + 1) / lesson.quiz_questions.length) * 100
    : 0;

  return (
    <AppLayout childName={childData?.name} points={childData?.total_points}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/lessons')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{sanitizeText(lesson.title)}</h1>
                {lesson.description && (
                  <p className="text-muted-foreground">{sanitizeText(lesson.description)}</p>
                )}
              </div>
              <SubjectBadge subject={lesson.subject as any} />
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.estimated_minutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{lesson.points_value} points</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>Grade {lesson.grade_level}</span>
              </div>
            </div>
          </div>
        </Card>

        {!showResults && (
          <Card className="p-6">
              <SafeMarkdown 
                content={lesson.content_markdown} 
                className="prose prose-sm max-w-none dark:prose-invert"
              />
          </Card>
        )}

        {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {showResults ? 'Quiz Results' : 'Knowledge Check'}
            </h2>

            {!showResults && (
              <>
                <Progress value={progressPercent} className="mb-4" />
                <p className="text-sm text-muted-foreground mb-6">
                  Question {currentQuestionIndex + 1} of {lesson.quiz_questions.length}
                </p>

                {currentQuestion && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {sanitizeText(currentQuestion.question)}
                    </h3>

                    {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, idx) => (
                          <Button
                            key={idx}
                            variant={
                              userAnswers[currentQuestionIndex] === option
                                ? 'default'
                                : 'outline'
                            }
                            className="w-full justify-start"
                            onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                          >
                            {sanitizeText(option)}
                          </Button>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'true_false' && (
                      <div className="flex gap-4">
                        <Button
                          variant={
                            userAnswers[currentQuestionIndex] === 'true'
                              ? 'default'
                              : 'outline'
                          }
                          className="flex-1"
                          onClick={() => handleAnswerSelect(currentQuestionIndex, 'true')}
                        >
                          True
                        </Button>
                        <Button
                          variant={
                            userAnswers[currentQuestionIndex] === 'false'
                              ? 'default'
                              : 'outline'
                          }
                          className="flex-1"
                          onClick={() => handleAnswerSelect(currentQuestionIndex, 'false')}
                        >
                          False
                        </Button>
                      </div>
                    )}

                    {currentQuestion.type === 'short_answer' && (
                      <Textarea
                        value={userAnswers[currentQuestionIndex] || ''}
                        onChange={(e) =>
                          handleAnswerSelect(currentQuestionIndex, e.target.value)
                        }
                        placeholder="Type your answer here..."
                        className="min-h-[100px]"
                      />
                    )}

                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      >
                        Previous
                      </Button>

                      {currentQuestionIndex < lesson.quiz_questions.length - 1 ? (
                        <Button
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                          disabled={!userAnswers[currentQuestionIndex]}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          onClick={submitQuiz}
                          disabled={
                            Object.keys(userAnswers).length < lesson.quiz_questions.length
                          }
                        >
                          Submit Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {showResults && (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <h3 className="text-3xl font-bold mb-2">
                    {quizScore}%
                  </h3>
                  <p className="text-muted-foreground">
                    You got {lesson.quiz_questions.filter((q, i) => 
                      userAnswers[i]?.toLowerCase() === q.correct_answer.toLowerCase()
                    ).length} out of {lesson.quiz_questions.length} correct!
                  </p>
                </div>

                {lesson.quiz_questions.map((q, idx) => {
                  const isCorrect = userAnswers[idx]?.toLowerCase() === q.correct_answer.toLowerCase();
                  return (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{sanitizeText(q.question)}</p>
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Your answer: </span>
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {sanitizeText(userAnswers[idx] || 'Not answered')}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">Correct answer: </span>
                              <span className="text-green-600">
                                {sanitizeText(q.correct_answer)}
                              </span>
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {sanitizeText(q.explanation)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button onClick={() => navigate('/lessons')} className="w-full">
                  Back to Lessons
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default LessonPlayer;