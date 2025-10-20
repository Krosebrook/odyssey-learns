import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GradeStatus {
  grade: number;
  current: number;
  needed: number;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export default function Phase1LessonGeneration() {
  const [grades, setGrades] = useState<GradeStatus[]>([
    { grade: 2, current: 0, needed: 50, status: 'pending' },
    { grade: 0, current: 0, needed: 50, status: 'pending' },
    { grade: 1, current: 49, needed: 1, status: 'pending' },
    { grade: 4, current: 13, needed: 37, status: 'pending' },
    { grade: 5, current: 11, needed: 39, status: 'pending' },
    { grade: 6, current: 0, needed: 50, status: 'pending' },
    { grade: 7, current: 0, needed: 50, status: 'pending' },
    { grade: 8, current: 0, needed: 50, status: 'pending' },
    { grade: 9, current: 0, needed: 50, status: 'pending' },
    { grade: 10, current: 0, needed: 50, status: 'pending' },
    { grade: 11, current: 0, needed: 50, status: 'pending' },
    { grade: 12, current: 0, needed: 50, status: 'pending' },
  ]);
  
  const [currentGrade, setCurrentGrade] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(0);

  const generateForGrade = async (gradeIndex: number) => {
    const grade = grades[gradeIndex];
    setCurrentGrade(grade.grade);
    
    const updatedGrades = [...grades];
    updatedGrades[gradeIndex].status = 'generating';
    setGrades(updatedGrades);

    try {
      toast.info(`Generating ${grade.needed} lessons for Grade ${grade.grade === 0 ? 'K' : grade.grade}...`);
      
      const subjects = ['Reading', 'Math', 'Science', 'Social Studies', 'Life Skills'];
      const lessonsPerSubject = Math.ceil(grade.needed / 5);
      
      const { data, error } = await supabase.functions.invoke('batch-lesson-generation', {
        body: {
          gradeLevel: grade.grade,
          subjects: subjects,
          lessonsPerSubject: lessonsPerSubject
        }
      });

      if (error) throw error;

      updatedGrades[gradeIndex].status = 'complete';
      updatedGrades[gradeIndex].current = 50;
      updatedGrades[gradeIndex].needed = 0;
      setGrades(updatedGrades);
      setTotalGenerated(prev => prev + (data.totalLessons || grade.needed));
      
      toast.success(`✓ Grade ${grade.grade === 0 ? 'K' : grade.grade} complete! Generated ${data.totalLessons} lessons.`);
      
      return true;
    } catch (err) {
      console.error(`Error generating lessons for grade ${grade.grade}:`, err);
      updatedGrades[gradeIndex].status = 'error';
      setGrades(updatedGrades);
      toast.error(`Failed to generate lessons for Grade ${grade.grade === 0 ? 'K' : grade.grade}`);
      return false;
    }
  };

  const generateAll = async () => {
    setProgress(0);
    setTotalGenerated(0);
    
    const totalNeeded = grades.reduce((sum, g) => sum + g.needed, 0);
    let completed = 0;
    
    for (let i = 0; i < grades.length; i++) {
      if (grades[i].needed === 0) {
        completed += 50;
        setProgress((completed / totalNeeded) * 100);
        continue;
      }
      
      const success = await generateForGrade(i);
      if (success) {
        completed += grades[i].needed;
        setProgress((completed / totalNeeded) * 100);
      }
      
      // Brief delay between grades to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setCurrentGrade(null);
    toast.success(`🎉 Phase 1 Complete! Generated ${totalGenerated} lessons across all grades!`);
  };

  const generateSingle = async (gradeIndex: number) => {
    setProgress(0);
    await generateForGrade(gradeIndex);
    setCurrentGrade(null);
    setProgress(100);
  };

  const getGradeLabel = (grade: number) => grade === 0 ? 'K' : grade.toString();
  
  const totalNeeded = grades.reduce((sum, g) => sum + g.needed, 0);
  const isGenerating = currentGrade !== null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-7 h-7 text-primary" />
              Phase 1: Lesson Content Generation
            </CardTitle>
            <CardDescription>
              Generate lessons to bring each grade to 50 total lessons. Total needed: {totalNeeded} lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📚 Generation Plan:</h4>
              <p className="text-sm text-muted-foreground">
                Starting with Grade 2 as requested, then filling gaps for all grades K-12. 
                Each grade will have 50 lessons (10 per subject × 5 subjects).
              </p>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium">
                    Generating Grade {getGradeLabel(currentGrade)} lessons...
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(progress)}% complete • {totalGenerated} lessons generated so far
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grades.map((grade, index) => (
                <Card key={grade.grade} className={`
                  ${grade.status === 'complete' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${grade.status === 'generating' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${grade.status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                `}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">Grade {getGradeLabel(grade.grade)}</h4>
                      {grade.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {grade.status === 'generating' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                      {grade.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Current:</span> {grade.current} lessons</p>
                      <p><span className="font-medium">Needed:</span> {grade.needed} lessons</p>
                      <p><span className="font-medium">Target:</span> 50 lessons</p>
                    </div>

                    {grade.needed > 0 && grade.status !== 'generating' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => generateSingle(index)}
                        disabled={isGenerating}
                      >
                        Generate {grade.needed}
                      </Button>
                    )}
                    
                    {grade.status === 'complete' && (
                      <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium text-center">
                        ✓ Complete
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={generateAll}
                disabled={isGenerating || totalNeeded === 0}
              >
                <Zap className="w-5 h-5 mr-2" />
                Generate All ({totalNeeded} lessons)
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = '/lessons'}
              >
                View Lessons
              </Button>
            </div>

            {totalGenerated > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="font-semibold text-green-700 dark:text-green-300">
                  🎉 Generated {totalGenerated} lessons so far!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
