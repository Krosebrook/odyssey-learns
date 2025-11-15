import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Grade2LessonSeedTrigger } from "./Grade2LessonSeedTrigger";
import { KindergartenLessonSeedTrigger } from "./KindergartenLessonSeedTrigger";

export const LessonSeedTrigger = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startSeeding = async () => {
    setIsSeeding(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      toast.info("Starting lesson generation... This will take several minutes.");
      
      // Call the seed-lessons edge function
      const { data, error: invokeError } = await supabase.functions.invoke('seed-lessons', {
        body: { force: false }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setProgress(100);
      toast.success(`Successfully generated ${data.created} lessons!`);
    } catch (err: any) {
      console.error("Seeding error:", err);
      setError(err.message || "Failed to seed lessons");
      toast.error("Failed to generate lessons: " + (err.message || "Unknown error"));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <KindergartenLessonSeedTrigger />
      <Grade2LessonSeedTrigger />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Lesson Seeding (All Grades)
          </CardTitle>
          <CardDescription>
            Generate all 624 lessons across grades K-12 (50 lessons per grade covering Reading, Math, Science, Social Studies, and Life Skills)
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={startSeeding}
            disabled={isSeeding}
            size="lg"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Lessons...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Lesson Generation
              </>
            )}
          </Button>
        </div>

        {isSeeding && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Generating lessons... This may take 10-15 minutes. Please keep this tab open.
            </p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Seeding Complete!
                </h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p>✓ Lessons created: {result.created}</p>
                  <p>✓ Lessons skipped (already exist): {result.skipped}</p>
                  <p>✓ Total lessons in database: {result.total}</p>
                  {result.errors && result.errors.length > 0 && (
                    <p className="text-amber-600">⚠ Errors encountered: {result.errors.length}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  Seeding Failed
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• The function will check for existing lessons and skip them</p>
          <p>• Progress is saved per grade, so you can restart if interrupted</p>
          <p>• Each lesson is generated with AI-powered content, quizzes, and age-appropriate material</p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};
