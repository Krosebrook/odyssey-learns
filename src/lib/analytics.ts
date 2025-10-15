import { supabase } from "@/integrations/supabase/client";

// Session management
let currentSessionId: string | null = null;

/**
 * Start a new activity session for tracking
 */
export const startSession = async (childId: string): Promise<string | null> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    const { data, error } = await supabase
      // @ts-ignore
      .from('activity_sessions')
      .insert({
        child_id: childId,
        session_start: new Date().toISOString(),
        pages_visited: 0,
        lessons_completed: 0
      })
      .select('id')
      // @ts-ignore
      .single();

    if (error) throw error;
    // @ts-ignore
    currentSessionId = data?.id;
    // @ts-ignore
    return data?.id || null;
  } catch (error) {
    console.error('Failed to start session:', error);
    return null;
  }
};

/**
 * End the current activity session
 */
export const endSession = async (sessionId: string): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    const { data: session } = await supabase
      // @ts-ignore
      .from('activity_sessions')
      .select('session_start')
      .eq('id', sessionId)
      // @ts-ignore
      .single();

    if (session) {
      // @ts-ignore
      const duration = Math.floor((Date.now() - new Date(session.session_start).getTime()) / 1000);
      
      // @ts-ignore - Types will regenerate after migration
      await supabase
        // @ts-ignore
        .from('activity_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_time_seconds: duration
        })
        .eq('id', sessionId);
    }

    if (currentSessionId === sessionId) {
      currentSessionId = null;
    }
  } catch (error) {
    console.error('Failed to end session:', error);
  }
};

/**
 * Track page view event
 */
export const trackPageView = async (childId: string, pagePath: string): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'page_view',
      event_category: 'navigation',
      event_properties: { page_path: pagePath }
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

/**
 * Track lesson start event
 */
export const trackLessonStart = async (childId: string, lessonId: string): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'lesson_start',
      event_category: 'learning',
      event_properties: { lesson_id: lessonId }
    });
  } catch (error) {
    console.error('Failed to track lesson start:', error);
  }
};

/**
 * Track lesson completion event
 */
export const trackLessonComplete = async (
  childId: string, 
  lessonId: string, 
  score: number, 
  timeSpent: number
): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'lesson_complete',
      event_category: 'learning',
      event_properties: { 
        lesson_id: lessonId, 
        score, 
        time_spent_seconds: timeSpent 
      }
    });
  } catch (error) {
    console.error('Failed to track lesson complete:', error);
  }
};

/**
 * Track badge unlock event
 */
export const trackBadgeUnlock = async (childId: string, badgeId: string): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'badge_unlock',
      event_category: 'gamification',
      event_properties: { badge_id: badgeId }
    });
  } catch (error) {
    console.error('Failed to track badge unlock:', error);
  }
};

/**
 * Track quest completion event
 */
export const trackQuestComplete = async (
  childId: string, 
  questId: string, 
  pointsEarned: number
): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'quest_complete',
      event_category: 'gamification',
      event_properties: { quest_id: questId, points_earned: pointsEarned }
    });
  } catch (error) {
    console.error('Failed to track quest complete:', error);
  }
};

/**
 * Track streak milestone event
 */
export const trackStreakMilestone = async (childId: string, streakDays: number): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'streak_milestone',
      event_category: 'gamification',
      event_properties: { streak_days: streakDays }
    });
  } catch (error) {
    console.error('Failed to track streak milestone:', error);
  }
};

/**
 * Track peer connection event
 */
export const trackPeerConnection = async (
  childId: string, 
  peerId: string, 
  action: 'request_sent' | 'accepted' | 'declined'
): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'peer_connection',
      event_category: 'social',
      event_properties: { peer_id: peerId, action }
    });
  } catch (error) {
    console.error('Failed to track peer connection:', error);
  }
};

/**
 * Track collaboration start event
 */
export const trackCollaborationStart = async (
  childId: string, 
  activityId: string
): Promise<void> => {
  try {
    // @ts-ignore - Types will regenerate after migration
    await supabase.from('analytics_events').insert({
      child_id: childId,
      event_type: 'collaboration_start',
      event_category: 'social',
      event_properties: { activity_id: activityId }
    });
  } catch (error) {
    console.error('Failed to track collaboration start:', error);
  }
};