import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Clock, Award } from "lucide-react";

const Lessons = () => {
  const [child, setChild] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const childId = localStorage.getItem('selectedChildId');
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
    setLoading(false);
  };

  const filteredLessons = filter === 'all' 
    ? lessons 
    : lessons.filter(l => l.subject === filter);

  const subjects = [
    { value: 'all', label: 'All Lessons' },
    { value: 'reading', label: 'Reading' },
    { value: 'math', label: 'Math' },
    { value: 'science', label: 'Science' },
    { value: 'social', label: 'Social Studies' },
    { value: 'lifeskills', label: 'Life Skills' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      <div className="space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Grade 1 Learning Adventures</h1>
          <p className="text-muted-foreground">Choose a lesson to start learning!</p>
        </div>

        {/* Subject Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {subjects.map(subject => (
            <button
              key={subject.value}
              onClick={() => setFilter(subject.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === subject.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {subject.label}
            </button>
          ))}
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="p-6 elevated-card hover-scale cursor-pointer"
              onClick={() => navigate(`/lesson/${lesson.id}`)}
            >
              <SubjectBadge subject={lesson.subject} className="mb-4" />
              
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {lesson.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {lesson.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.estimated_minutes} min</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-accent">
                  <Award className="w-4 h-4" />
                  <span>+{lesson.points_value}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Lessons;
