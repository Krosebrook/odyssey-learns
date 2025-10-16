import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SeedLessons() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleSeedLessons = async () => {
    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      toast.info('Starting automated lesson generation... This will take 10-15 minutes.');
      
      setProgress(20);
      
      const { data, error } = await supabase.functions.invoke('seed-lessons', {
        body: {}
      });

      if (error) {
        console.error('Seeding error:', error);
        throw error;
      }

      setProgress(100);
      setResult(data);
      
      toast.success(`Successfully generated ${data.totalLessons} lessons! 🎉`);
    } catch (err) {
      console.error('Error seeding lessons:', err);
      toast.error('Failed to seed lessons. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-start lesson generation on page load
  useEffect(() => {
    handleSeedLessons();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Automated Lesson Generator
            </CardTitle>
            <CardDescription className="text-sm">
              Generate all 650 starter lessons automatically (K-12 across all subjects)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {!loading && !result && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">What will happen:</h4>
                  <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                    <li>✓ Generates ~78 lessons (6 subjects × 13 grades)</li>
                    <li>✓ Uses Lovable AI (Gemini Flash model)</li>
                    <li>✓ Takes approximately 10-15 minutes</li>
                    <li>✓ Includes built-in rate limit handling</li>
                    <li>✓ Lessons saved directly to database</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200 text-sm sm:text-base">
                    ⚠️ Important Notes:
                  </h4>
                  <ul className="text-xs sm:text-sm space-y-1 text-yellow-800 dark:text-yellow-200">
                    <li>• Currently generates 1 lesson per subject/grade (78 total)</li>
                    <li>• To generate 50 per grade, edit the edge function</li>
                    <li>• Keep this tab open during generation</li>
                    <li>• Uses your Lovable AI credits</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleSeedLessons}
                  size="lg"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Start Generating Lessons
                </Button>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Generating Lessons...</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    This will take 10-15 minutes. Please keep this tab open.
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground">
                  Progress: {progress}%
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    Success! 🎉
                  </h3>
                  <p className="text-base sm:text-lg mt-2">
                    Generated {result.totalLessons} lessons
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Next Steps:</h4>
                  <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                    <li>✓ Lessons are now available in the Lessons page</li>
                    <li>✓ Students can start learning immediately</li>
                    <li>✓ Generate more lessons anytime from Admin Dashboard</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/lessons'}
                    className="flex-1"
                  >
                    View Lessons
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Generate More
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground px-4">
          <p>
            Note: To generate more lessons per grade, edit the{" "}
            <code className="bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">lessonCount</code> variable in{" "}
            <code className="bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs break-all">
              supabase/functions/seed-lessons/index.ts
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
