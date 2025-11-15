import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function KindergartenLessonSeedTrigger() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async () => {
    const confirmed = confirm(
      "Generate all 50 Kindergarten lessons? This will take 5-10 minutes and use AI credits."
    );
    
    if (!confirmed) return;

    setLoading(true);
    setProgress(0);
    setResults(null);
    setStatus("Starting Kindergarten lesson generation...");

    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 1;
        });
      }, 2000);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('seed-kindergarten-lessons', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(100);
      setStatus("Kindergarten lessons generated successfully!");
      setResults(data);
      
      toast.success(`Successfully generated ${data.created} Kindergarten lessons!`);

    } catch (error: any) {
      console.error('Generation error:', error);
      setStatus(`Error: ${error.message}`);
      toast.error(error.message || 'Failed to generate lessons');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Kindergarten Lesson Generator
        </CardTitle>
        <CardDescription>
          Generate all 50 AI-powered Kindergarten (Grade 0) lessons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold">This will generate:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>10 Reading Foundations lessons (ABCs, sounds, sight words)</li>
            <li>10 Math Foundations lessons (counting, shapes, patterns)</li>
            <li>10 Science Wonders lessons (senses, weather, animals)</li>
            <li>10 Social Studies lessons (self, family, community)</li>
            <li>10 Life Skills lessons (emotions, kindness, hygiene)</li>
          </ul>
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">{status}</p>
          </div>
        )}

        {results && (
          <Alert className="bg-success/10 border-success/20">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Generation complete!</p>
              <div className="text-sm space-y-1">
                <p>✅ Created: {results.created} lessons</p>
                <p>⏭️ Skipped: {results.skipped} (already exist)</p>
                {results.errors?.length > 0 && (
                  <p className="text-destructive">❌ Errors: {results.errors.length}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating {progress}%...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate 50 Kindergarten Lessons
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Estimated time: 5-10 minutes • Existing lessons will not be duplicated
        </p>
      </CardContent>
    </Card>
  );
}
