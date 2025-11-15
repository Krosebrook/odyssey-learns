// TODO: Remove when Supabase types regenerate
export interface LearningAnalytics {
  id: string;
  child_id: string;
  subject: string;
  skill_name: string;
  mastery_level: number;
  practice_count: number;
  success_rate: number;
  avg_time_seconds: number;
  last_practiced_at: string;
  difficulty_preference: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  hint_usage: number;
  retry_count: number;
  frustration_signals: string[];
  engagement_score: number;
  difficulty_perceived: number;
}

export interface LessonRecommendation {
  lessonId: string;
  title: string;
  subject: string;
  difficulty: string;
  reason: string;
  matchScore: number;
}
