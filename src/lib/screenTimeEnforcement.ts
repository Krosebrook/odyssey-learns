import { supabase } from "@/integrations/supabase/client";

export const checkScreenTimeLimit = async (childId: string): Promise<{
  allowed: boolean;
  minutesUsed: number;
  minutesLimit: number;
  minutesRemaining: number;
}> => {
  try {
    // Get child's screen time settings
    const { data: child } = await supabase
      .from('children')
      .select('daily_screen_time_limit_minutes, screen_time_enabled')
      .eq('id', childId)
      .single();

    if (!child || !child.screen_time_enabled) {
      return { allowed: true, minutesUsed: 0, minutesLimit: 0, minutesRemaining: 0 };
    }

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessions } = await supabase
      .from('screen_time_sessions')
      .select('minutes_used')
      .eq('child_id', childId)
      .gte('session_start', today.toISOString());

    const minutesUsed = sessions?.reduce((sum, s) => sum + (s.minutes_used || 0), 0) || 0;
    const minutesLimit = child.daily_screen_time_limit_minutes;
    const minutesRemaining = Math.max(0, minutesLimit - minutesUsed);

    return {
      allowed: minutesUsed < minutesLimit,
      minutesUsed,
      minutesLimit,
      minutesRemaining,
    };
  } catch (error) {
    console.error('Error checking screen time limit:', error);
    return { allowed: true, minutesUsed: 0, minutesLimit: 0, minutesRemaining: 0 };
  }
};

export const startScreenTimeSession = async (
  childId: string,
  activityType: string = 'general',
  lessonId?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('screen_time_sessions')
      .insert({
        child_id: childId,
        activity_type: activityType,
        lesson_id: lessonId,
        session_start: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error starting screen time session:', error);
    return null;
  }
};

export const endScreenTimeSession = async (sessionId: string): Promise<void> => {
  try {
    const { data: session } = await supabase
      .from('screen_time_sessions')
      .select('session_start')
      .eq('id', sessionId)
      .single();

    if (session) {
      const start = new Date(session.session_start);
      const end = new Date();
      const minutesUsed = Math.floor((end.getTime() - start.getTime()) / 60000);

      await supabase
        .from('screen_time_sessions')
        .update({
          session_end: end.toISOString(),
          minutes_used: minutesUsed,
        })
        .eq('id', sessionId);
    }
  } catch (error) {
    console.error('Error ending screen time session:', error);
  }
};
