import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { subject, gradeLevel, count = 5 } = await req.json();

    if (!subject || !gradeLevel) {
      throw new Error('Subject and grade level are required');
    }

    console.log(`Generating ${count} lessons for ${subject}, Grade ${gradeLevel}`);

    const lessons = [];
    const lessonTypes = [
      'Introduction', 'Practice', 'Advanced', 'Review', 'Challenge'
    ];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const lessonType = lessonTypes[i % lessonTypes.length];
      
      const lesson = {
        title: `${subject} ${lessonType} ${i + 1}`,
        subject,
        grade_level: gradeLevel,
        description: `${lessonType} lesson for ${subject} at grade ${gradeLevel}`,
        content_markdown: `# ${subject} ${lessonType}\n\n## Learning Objectives\n- Understand key concepts\n- Apply knowledge\n- Practice skills\n\n## Content\nThis is a placeholder lesson. In production, this would be AI-generated content.\n\n## Activities\n1. Read the material\n2. Answer questions\n3. Complete practice problems`,
        estimated_minutes: 15 + (i * 5),
        points_value: 50 + (i * 10),
        quiz_questions: [
          {
            question: `Sample question for ${subject} lesson ${i + 1}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: 0,
            explanation: 'This is a sample explanation'
          }
        ],
        standards_alignment: `Grade ${gradeLevel} ${subject} standards`,
        is_active: true,
      };

      lessons.push(lesson);
    }

    // Batch insert all lessons
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessons)
      .select();

    if (error) {
      console.error('Batch insert error:', error);
      throw error;
    }

    console.log(`Successfully created ${data.length} lessons`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.length,
        lessons: data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Batch generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
