import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNavigate } from "react-router-dom";
import { Search, Users, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ReportLessonButton } from "@/components/learning/ReportLessonButton";

interface CommunityLesson {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  times_used: number;
  creator_name: string;
  created_at: string;
}

const SUBJECTS = ["Reading", "Math", "Science", "Social Studies", "Art", "Life Skills"];

export default function CommunityLessons() {
  const { childId, isValidating } = useValidatedChild();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<CommunityLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<CommunityLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  useEffect(() => {
    loadCommunityLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [searchQuery, subjectFilter, gradeFilter, lessons]);

  const loadCommunityLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('child_generated_lessons' as any)
        .select(`
          id,
          title,
          description,
          subject,
          grade_level,
          times_used,
          created_at,
          creator_child_id
        `)
        .eq('share_status', 'public')
        .eq('is_active', true)
        .order('times_used', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch creator names
      const lessonsWithCreators = await Promise.all(
        (data || []).map(async (lesson: any) => {
          const { data: childData } = await supabase
            .from('children')
            .select('name')
            .eq('id', lesson.creator_child_id)
            .single();

          return {
            ...lesson,
            creator_name: childData?.name?.split(' ')[0] || 'Anonymous'
          };
        })
      );

      setLessons(lessonsWithCreators);
    } catch (err) {
      console.error('Error loading community lessons:', err);
      toast.error('Failed to load community lessons');
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = [...lessons];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             l.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(l => l.subject === subjectFilter);
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(l => l.grade_level === parseInt(gradeFilter));
    }

    setFilteredLessons(filtered);
  };

  const handleUseLesson = async (lessonId: string) => {
    if (!childId) {
      toast.error('Please select a child first');
      return;
    }

    try {
      // Increment usage count
      const { error } = await supabase.rpc('increment_lesson_usage' as any, {
        p_lesson_id: lessonId,
        p_child_id: childId
      });

      if (error) {
        if (error.message?.includes('already used')) {
          toast.info('You already used this lesson today!');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Lesson started! Creator earned 10 points 🎉');
      navigate(`/lessons/${lessonId}`);
    } catch (err) {
      console.error('Error using lesson:', err);
      toast.error('Failed to start lesson');
    }
  };

  if (isValidating || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Community Lessons</h1>
          </div>
          <p className="text-muted-foreground">
            Learn from lessons created by students like you! Use a lesson to award the creator 10 points.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                <SelectItem key={grade} value={grade.toString()}>
                  {grade === 0 ? 'Kindergarten' : `Grade ${grade}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredLessons.length} of {lessons.length} lessons
        </p>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No lessons found matching your filters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => (
              <Card 
                key={lesson.id} 
                className="hover:shadow-lg smooth-transition cursor-pointer group"
                onClick={() => handleUseLesson(lesson.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary">{lesson.subject}</Badge>
                    <ReportLessonButton lessonId={lesson.id} />
                  </div>
                  <CardTitle className="group-hover:text-primary smooth-transition line-clamp-2">
                    {lesson.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {lesson.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        By {lesson.creator_name}
                      </span>
                      <Badge variant="outline">
                        Grade {lesson.grade_level === 0 ? 'K' : lesson.grade_level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {lesson.times_used} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
