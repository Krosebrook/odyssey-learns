import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { rateLimitMiddleware } from "../_shared/rateLimitMiddleware.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 5 share requests per day per user
    const rateLimitResult = await rateLimitMiddleware(req, {
      endpoint: 'request-lesson-share',
      maxRequests: 5,
      windowMinutes: 1440 // 24 hours
    });

    if (rateLimitResult) return rateLimitResult;

    const { lessonId } = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'Missing lessonId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify lesson ownership
    const { data: lesson, error: fetchError } = await supabase
      .from('child_generated_lessons')
      .select('*, creator_child_id, children!child_generated_lessons_creator_child_id_fkey(parent_id)')
      .eq('id', lessonId)
      .single();

    if (fetchError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns the lesson's creator child
    if (lesson.children.parent_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not own this lesson' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update share status to pending
    const { error: updateError } = await supabase
      .from('child_generated_lessons')
      .update({ share_status: 'pending_approval' })
      .eq('id', lessonId);

    if (updateError) {
      console.error('Error requesting share:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to request share approval' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification for parent
    await supabase.from('parent_notifications').insert({
      parent_id: user.id,
      notification_type: 'lesson_share_request',
      title: 'Lesson Share Request',
      message: `Your child has requested to share a lesson publicly`,
      action_url: `/parent-dashboard`,
      metadata: { lesson_id: lessonId }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Share request submitted for approval' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in request-lesson-share:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});