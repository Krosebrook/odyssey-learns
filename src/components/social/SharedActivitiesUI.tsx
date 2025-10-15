import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Clock, Play } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Activity {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  max_participants: number;
  status: string;
  created_at: string;
  children: {
    name: string;
  };
  activity_participants: Array<{
    id: string;
    child_id: string;
  }>;
}

export const SharedActivitiesUI = ({ childId }: { childId: string }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    activity_type: 'study_group',
    max_participants: 4,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadActivities();
  }, [childId]);

  const loadActivities = async () => {
    try {
      const { data } = await supabase
        .from('shared_activities')
        .select(`
          *,
          children!shared_activities_created_by_fkey(name),
          activity_participants(id, child_id)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setActivities(data as any || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async () => {
    if (!newActivity.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_activities')
        .insert({
          ...newActivity,
          created_by: childId,
        });

      if (error) throw error;

      toast({
        title: "Activity created! 🎉",
        description: "Your activity is now open for others to join",
      });

      setDialogOpen(false);
      setNewActivity({
        title: '',
        description: '',
        activity_type: 'study_group',
        max_participants: 4,
      });
      loadActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity",
        variant: "destructive",
      });
    }
  };

  const joinActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: activityId,
          child_id: childId,
        });

      if (error) throw error;

      toast({
        title: "Joined activity! 🎉",
        description: "You're now part of this activity",
      });

      loadActivities();
    } catch (error) {
      console.error('Error joining activity:', error);
      toast({
        title: "Error",
        description: "Failed to join activity",
        variant: "destructive",
      });
    }
  };

  const getActivityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      study_group: 'bg-blue-500/10 text-blue-700',
      project: 'bg-purple-500/10 text-purple-700',
      challenge: 'bg-orange-500/10 text-orange-700',
      reading_club: 'bg-green-500/10 text-green-700',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-700';
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shared Activities</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="Math Study Session"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="Let's work on multiplication together!"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select
                  value={newActivity.activity_type}
                  onValueChange={(value) => setNewActivity({ ...newActivity, activity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study_group">Study Group</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                    <SelectItem value="reading_club">Reading Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Participants</label>
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={newActivity.max_participants}
                  onChange={(e) => setNewActivity({ ...newActivity, max_participants: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={createActivity} className="w-full">Create Activity</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activities.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No activities yet. Create the first one!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => {
            const isCreator = activity.children;
            const isFull = activity.activity_participants.length >= activity.max_participants;
            const hasJoined = activity.activity_participants.some(p => p.child_id === childId);

            return (
              <Card key={activity.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge className={getActivityTypeColor(activity.activity_type)}>
                      {activity.activity_type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {activity.activity_participants.length}/{activity.max_participants}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {activity.children.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      Created by {activity.children.name}
                    </span>
                  </div>

                  {!hasJoined && !isFull && (
                    <Button onClick={() => joinActivity(activity.id)} className="w-full gap-2">
                      <Play className="w-4 h-4" />
                      Join Activity
                    </Button>
                  )}
                  {hasJoined && (
                    <Button variant="secondary" className="w-full" disabled>
                      Already Joined ✓
                    </Button>
                  )}
                  {!hasJoined && isFull && (
                    <Button variant="outline" className="w-full" disabled>
                      Activity Full
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
