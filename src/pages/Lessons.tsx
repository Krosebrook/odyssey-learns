import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { Search, BookOpen, Filter } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { LessonCard } from "@/components/learning/LessonCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Lessons = () => {
  const { childId, isValidating } = useValidatedChild();
  const [child, setChild] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidating && childId) {
      loadLessons();
    }
  }, [childId, isValidating]);

  useEffect(() => {
    filterLessons();
  }, [searchTerm, subjectFilter, lessons]);

  const loadLessons = async () => {
    if (!childId) return;

    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade_level', childData?.grade_level || 1)
      .eq('is_active', true)
      .order('subject', { ascending: true });

    setChild(childData);
    setLessons(lessonsData || []);
    setFilteredLessons(lessonsData || []);
    setLoading(false);
  };

  const filterLessons = () => {
    let filtered = lessons;

    if (searchTerm) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter(lesson => 
        lesson.subject.toLowerCase() === subjectFilter.toLowerCase()
      );
    }

    setFilteredLessons(filtered);
  };

  const subjects = Array.from(new Set(lessons.map(l => l.subject)));

  if (isValidating || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      <div className="space-y-6 animate-fade-in">
        <BackButton to="/dashboard" label="Back to Dashboard" />

        <div className="text-center py-6">
          <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Learning Library</h1>
          <p className="text-muted-foreground">
            Explore {lessons.length} lessons designed for Grade {child?.grade_level}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject.toLowerCase()}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLessons.length} of {lessons.length} lessons
          </p>
          {(searchTerm || subjectFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSubjectFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No lessons found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSubjectFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Lessons;
