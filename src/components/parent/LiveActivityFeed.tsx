import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { 
  BookOpen, 
  Trophy, 
  Star, 
  Activity,
  CheckCircle,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Child {
  id: string;
  name: string;
}

interface ActivityItem {
  id: string;
  childId: string;
  childName: string;
  type: 'started' | 'completed' | 'achievement';
  lessonTitle?: string;
  score?: number;
  timestamp: Date;
}

interface LiveActivityFeedProps {
  parentId: string;
  children: Child[];
}

export const LiveActivityFeed = ({ parentId, children }: LiveActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lessons, setLessons] = useState<Record<string, string>>({});
  const childIds = children.map((c) => c.id);

  // Load lesson titles for reference
  useEffect(() => {
    const loadLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id, title')
        .limit(100);

      if (data) {
        const lessonMap: Record<string, string> = {};
        data.forEach((lesson) => {
          lessonMap[lesson.id] = lesson.title;
        });
        setLessons(lessonMap);
      }
    };
    loadLessons();
  }, []);

  // Handle progress updates
  const handleProgressUpdate = (
    update: any,
    eventType: 'INSERT' | 'UPDATE'
  ) => {
    const child = children.find((c) => c.id === update.child_id);
    if (!child) return;

    const activityItem: ActivityItem = {
      id: `${update.id}-${Date.now()}`,
      childId: update.child_id,
      childName: child.name,
      type: update.status === 'completed' ? 'completed' : 'started',
      lessonTitle: lessons[update.lesson_id] || 'a lesson',
      score: update.score,
      timestamp: new Date(),
    };

    setActivities((prev) => [activityItem, ...prev.slice(0, 9)]);
  };

  const { loading } = useRealtimeProgress({
    childIds,
    onProgressUpdate: handleProgressUpdate,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'started':
        return <PlayCircle className="w-4 h-4 text-primary" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-warning" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'completed':
        return (
          <>
            completed <span className="font-semibold">{activity.lessonTitle}</span>
            {activity.score && (
              <Badge variant="secondary" className="ml-2">
                {activity.score}%
              </Badge>
            )}
          </>
        );
      case 'started':
        return (
          <>
            started <span className="font-semibold">{activity.lessonTitle}</span>
          </>
        );
      case 'achievement':
        return (
          <>
            earned a new achievement! <Star className="w-4 h-4 inline text-warning" />
          </>
        );
      default:
        return 'is learning';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && activities.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Live Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Live Activity</h3>
        <div className="ml-auto flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-xs text-muted-foreground">Real-time</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
          <p className="text-xs">Updates will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {activity.childName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium text-sm">{activity.childName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {getActivityMessage(activity)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(activity.timestamp)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};
