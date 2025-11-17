import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting: 10 custom lessons per day per user
    const rateLimitResult = await rateLimitMiddleware({
      supabase,
      userId: user.id,
      endpoint: 'generate-custom-lesson',
      maxRequests: 10,
      windowMinutes: 1440, // 24 hours
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'You can generate up to 10 custom lessons per day',
          retryAfter: rateLimitResult.retryAfter
        }), 
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600'
          }
        }
      );
    }

    const { childId, topic, subject, gradeLevel } = await req.json();

    if (!childId || !topic || !subject || gradeLevel === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify child ownership
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (!child) {
      return new Response(JSON.stringify({ error: 'Child not found or unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check daily quota (3 custom lessons/day per child)
    const today = new Date().toISOString().split('T')[0];
    const { data: quota } = await supabase
      .from('daily_lesson_quota')
      .select('custom_lessons_generated, custom_generation_limit')
      .eq('child_id', childId)
      .eq('quota_date', today)
      .single();

    const generated = quota?.custom_lessons_generated || 0;
    const limit = quota?.custom_generation_limit || 3;

    if (generated >= limit) {
      return new Response(JSON.stringify({ 
        error: 'Daily custom lesson limit reached',
        limit,
        generated,
        retry_after: 'tomorrow'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Content moderation check
    const moderationPrompt = `Analyze this lesson request for appropriateness for children:
Topic: "${topic}"
Subject: ${subject}
Grade: ${gradeLevel}

Check for: personal information requests, inappropriate content, unsafe activities, external links.
Return JSON: { "appropriate": true/false, "reason": "explanation if flagged" }`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const modCheck = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a content safety moderator for children. Return only valid JSON.' },
          { role: 'user', content: moderationPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!modCheck.ok) {
      console.error('Moderation check failed:', modCheck.statusText);
    } else {
      const modData = await modCheck.json();
      const modContent = modData.choices[0].message.content;
      try {
        const jsonMatch = modContent.match(/\{[\s\S]*\}/);
        const modResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { appropriate: true };
        
        if (!modResult.appropriate) {
          return new Response(JSON.stringify({ 
            error: 'Content flagged by safety filter',
            reason: modResult.reason || 'Content may not be appropriate for children'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.error('Moderation parsing error:', e);
      }
    }

    // Generate lesson with AI
    const gradeLabel = gradeLevel === 0 ? 'Kindergarten' : `${gradeLevel}${getGradeSuffix(gradeLevel)} grade`;
    const prompt = `Create an engaging educational lesson about "${topic}" for ${gradeLabel} in the subject ${subject}.

Make it fun, interactive, and age-appropriate!

Return ONLY valid JSON with this structure:
{
  "title": "Exciting lesson title (max 60 chars)",
  "description": "Clear 2-sentence description",
  "content_markdown": "Full markdown lesson with ## headings, bullet points, examples. Include: Learning Objectives, Fun Activities, and Reflection Questions. 400-600 words.",
  "quiz_questions": [
    {
      "question": "Age-appropriate question",
      "options": ["Option A", "Option B", "Option C"],
      "correct": "Option A",
      "explanation": "Encouraging explanation"
    }
  ]
}

Requirements:
- 3 fun quiz questions with 3 options each
- Use encouraging language: "Great thinking!", "You've got this!", "Amazing!"
- Include interactive elements: "Try this!", "Draw a picture of...", "Share with a friend..."
- Connect to real-world examples for ${gradeLevel === 0 ? '5-6' : gradeLevel + 5}-year-olds

Return ONLY the JSON, no extra text.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative educator helping children learn about topics they\'re curious about. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', aiResponse.status, errorText);
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    let lessonData;
    try {
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedContent.match(/```\s*([\s\S]*?)\s*```/) ||
                       generatedContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedContent;
      lessonData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      lessonData = {
        title: `${topic} - A Learning Adventure`,
        description: `Learn about ${topic} in this exciting ${subject} lesson!`,
        content_markdown: generatedContent.substring(0, 1000),
        quiz_questions: generateDefaultQuiz(topic, gradeLevel)
      };
    }

    // Insert into child_generated_lessons
    const { data: newLesson, error: insertError } = await supabase
      .from('child_generated_lessons')
      .insert({
        creator_child_id: childId,
        title: lessonData.title,
        subject,
        grade_level: gradeLevel,
        description: lessonData.description,
        content_markdown: lessonData.content_markdown,
        quiz_questions: lessonData.quiz_questions || [],
        estimated_minutes: 15,
        points_value: 50,
        share_status: 'private',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Update quota
    await supabase
      .from('daily_lesson_quota')
      .upsert({
        child_id: childId,
        quota_date: today,
        custom_lessons_generated: generated + 1
      }, {
        onConflict: 'child_id,quota_date'
      });

    console.log(`Custom lesson created: ${newLesson.title} by child ${childId}`);

    return new Response(JSON.stringify({ 
      success: true,
      lesson: newLesson,
      quota_remaining: limit - generated - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Custom lesson generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getGradeSuffix(grade: number): string {
  if (grade === 0) return '';
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
}

function generateDefaultQuiz(topic: string, grade: number): any[] {
  return [
    {
      question: `What did you learn about ${topic}?`,
      options: ['Something interesting', 'Something fun', 'Something new'],
      correct: 'Something new',
      explanation: 'Great job learning something new!'
    },
    {
      question: `How can you use what you learned about ${topic}?`,
      options: ['In everyday life', 'To help others', 'To learn more'],
      correct: 'In everyday life',
      explanation: 'Wonderful thinking about real-world applications!'
    },
    {
      question: `What would you like to learn next about ${topic}?`,
      options: ['More details', 'Related topics', 'How to teach others'],
      correct: 'Related topics',
      explanation: 'Excellent curiosity!'
    }
  ];
}
