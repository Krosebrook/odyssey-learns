import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBJECTS = ["Reading", "Math", "Science", "Social Studies", "Art", "Life Skills"];
const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting automated lesson generation for all grades...');
    
    let totalLessons = 0;
    const results: any[] = [];

    // Generate lessons for each grade
    for (const grade of GRADES) {
      console.log(`\n=== Generating lessons for Grade ${grade === 0 ? 'K' : grade} ===`);
      
      for (const subject of SUBJECTS) {
        try {
          // Generate 1 lesson per subject per grade (total: 6 subjects × 13 grades = 78 lessons)
          // If you want 50 per grade, change this loop
          const lessonCount = 1; // Change to 8-9 to get ~50 lessons per grade
          
          for (let i = 0; i < lessonCount; i++) {
            const lessonNum = i + 1;
            const prompt = buildLessonPrompt(grade, subject, lessonNum);

            const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
            if (!lovableApiKey) {
              throw new Error('LOVABLE_API_KEY not configured');
            }

            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert educational content creator. Generate well-structured, age-appropriate lesson content in valid JSON format.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
              }),
            });

            if (!aiResponse.ok) {
              const errorText = await aiResponse.text();
              console.error(`AI API error for ${subject} Grade ${grade}:`, aiResponse.status, errorText);
              
              if (aiResponse.status === 429) {
                console.log('Rate limit hit, waiting 20 seconds...');
                await new Promise(resolve => setTimeout(resolve, 20000));
                continue;
              }
              throw new Error(`AI API error: ${aiResponse.status}`);
            }

            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;

            if (!content) {
              console.error('No content in AI response');
              continue;
            }

            // Parse JSON from AI response
            let lessonData;
            try {
              const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
              const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
              lessonData = JSON.parse(jsonStr);
            } catch (parseError) {
              console.error('Failed to parse AI response as JSON:', parseError);
              lessonData = {
                title: `${subject} Lesson ${lessonNum}`,
                description: content.substring(0, 200),
                content_markdown: content,
                quiz_questions: generateDefaultQuiz(subject, grade),
              };
            }

            // Insert lesson into database
            const { error: insertError } = await supabase.from('lessons').insert({
              title: lessonData.title || `${subject} - Grade ${grade === 0 ? 'K' : grade} Lesson ${lessonNum}`,
              description: lessonData.description || `Learn about ${subject.toLowerCase()} concepts`,
              subject: subject,
              grade_level: grade,
              content_markdown: lessonData.content_markdown || lessonData.content || content,
              quiz_questions: lessonData.quiz_questions || generateDefaultQuiz(subject, grade),
              estimated_minutes: calculateDuration(grade),
              points_value: calculatePoints(grade, subject),
              standards_alignment: lessonData.standards_alignment || '',
              differentiation: lessonData.differentiation || { support: '', extension: '' },
              is_active: true,
            });

            if (insertError) {
              console.error(`Failed to insert lesson:`, insertError);
            } else {
              totalLessons++;
              console.log(`✓ Created: ${subject} Grade ${grade} Lesson ${lessonNum}`);
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error generating ${subject} for grade ${grade}:`, error);
          results.push({
            grade,
            subject,
            error: errorMessage,
          });
        }
      }

      // Delay between grades to avoid rate limits
      if (grade < GRADES[GRADES.length - 1]) {
        console.log('Waiting 10 seconds before next grade...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalLessons,
        message: `Successfully generated ${totalLessons} lessons across all grades!`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in seed-lessons:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildLessonPrompt(grade: number, subject: string, lessonNum: number): string {
  const ageRange = getAgeRange(grade);
  const gradeSuffix = getGradeSuffix(grade);
  
  return `Create an engaging educational lesson for ${grade === 0 ? 'Kindergarten' : grade + gradeSuffix + ' grade'} students (ages ${ageRange}) about ${subject}.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "title": "Engaging lesson title (max 80 characters)",
  "description": "Brief description for students (max 160 characters)",
  "content_markdown": "# Lesson Title\\n\\nFull markdown lesson content with sections, examples, and activities",
  "standards_alignment": "Relevant educational standards",
  "differentiation": {
    "support": "Scaffolding strategies for struggling learners",
    "extension": "Challenge activities for advanced learners"
  },
  "quiz_questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this is correct"
    }
  ]
}

Requirements:
- Age-appropriate vocabulary and concepts for ${ageRange} year olds
- Include 3-5 quiz questions
- Markdown content should be 300-800 words
- Make it engaging and interactive
- Include real-world examples
- Use emoji sparingly for younger grades
- Must be valid, parseable JSON`;
}

function getAgeRange(grade: number): string {
  const baseAge = 5;
  return `${baseAge + grade}-${baseAge + grade + 1}`;
}

function getGradeSuffix(grade: number): string {
  if (grade === 0) return '';
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
}

function calculateDuration(grade: number): number {
  if (grade <= 2) return 15;
  if (grade <= 5) return 20;
  if (grade <= 8) return 25;
  return 30;
}

function calculatePoints(grade: number, subject: string): number {
  const basePoints = 50 + (grade * 5);
  return subject === 'Math' || subject === 'Science' ? basePoints * 1.2 : basePoints;
}

function generateDefaultQuiz(subject: string, grade: number): any[] {
  return [
    {
      question: `What did you learn about ${subject.toLowerCase()} in this lesson?`,
      options: [
        "New concepts",
        "Problem-solving skills",
        "Creative thinking",
        "All of the above"
      ],
      correct_answer: 3,
      explanation: "Great lessons teach us multiple skills!"
    }
  ];
}
