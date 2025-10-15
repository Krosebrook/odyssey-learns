import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grade_level, subject, topic } = await req.json();
    
    if (!grade_level || !subject || !topic) {
      return new Response(JSON.stringify({ error: "Missing required fields: grade_level, subject, topic" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Construct age-appropriate prompt based on grade level
    const ageGuidance = grade_level <= 2 
      ? "Use simple language, short sentences, and engaging examples. Focus on hands-on activities."
      : grade_level <= 5
      ? "Use clear explanations with moderate complexity. Include real-world connections."
      : grade_level <= 8
      ? "Use detailed explanations with academic rigor. Encourage critical thinking."
      : "Use advanced concepts with college-prep depth. Focus on analysis and application.";

    const prompt = `You are an expert K-12 curriculum designer. Create a complete lesson for:
- Grade Level: ${grade_level}
- Subject: ${subject}
- Topic: ${topic}

${ageGuidance}

Generate a JSON response with these exact fields:
{
  "title": "Engaging, age-appropriate lesson title",
  "description": "2-3 sentence summary of what students will learn",
  "content_markdown": "Full lesson content in markdown format (800-1200 words). Include:
    - For reading lessons: A passage (200-400 words) followed by comprehension questions
    - For math lessons: Examples with step-by-step solutions and practice problems
    - For science lessons: Experiment instructions with materials list and procedures
    - For EI lessons: Emotional scenarios with reflection prompts
    - For life skills: Practical instructions with real-world applications",
  "quiz_questions": [
    {
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A",
      "explanation": "Why this answer is correct"
    }
  ],
  "estimated_minutes": 15-30 (realistic completion time),
  "standards_alignment": "Common Core or relevant standards reference",
  "differentiation": {
    "support": "Scaffolding strategies for struggling learners",
    "extension": "Challenge activities for advanced learners"
  }
}

Include 5-7 quiz questions. Make content engaging, age-appropriate, and educationally sound.`;

    console.log('Calling Lovable AI for lesson generation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert K-12 curriculum designer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('AI response received');
    
    const content = aiData.choices[0].message.content;
    
    // Try to parse JSON from the response
    let lessonData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      lessonData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse lesson content from AI');
    }

    // Add metadata
    const completeLesson = {
      ...lessonData,
      grade_level,
      subject,
      points_value: calculatePoints(grade_level, subject),
      is_active: true,
      thumbnail_url: `/images/subjects/${subject.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    };

    console.log('Lesson generated successfully');
    return new Response(JSON.stringify(completeLesson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-lesson-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculatePoints(grade: number, subject: string): number {
  // Base points by grade level
  const basePoints = grade <= 2 ? 50 : grade <= 5 ? 75 : grade <= 8 ? 100 : 150;
  
  // Bonus for challenging subjects
  const subjectMultiplier = ['Math', 'Science'].includes(subject) ? 1.2 : 1.0;
  
  return Math.round(basePoints * subjectMultiplier);
}
