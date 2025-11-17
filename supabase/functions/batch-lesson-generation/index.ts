import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PHASE 1: AI Circuit Breaker =============
class AICircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 10;
  private readonly resetTimeMs = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.failures >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.resetTimeMs) {
        throw new Error(`Circuit breaker open. Too many AI failures. Retry in ${Math.ceil((this.resetTimeMs - timeSinceLastFailure) / 1000)}s`);
      }
      // Reset after timeout
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      console.error(`AI call failed (${this.failures}/${this.failureThreshold}):`, error);
      throw error;
    }
  }

  getStatus() {
    return {
      failures: this.failures,
      isOpen: this.failures >= this.failureThreshold,
      resetIn: this.failures >= this.failureThreshold 
        ? Math.max(0, this.resetTimeMs - (Date.now() - this.lastFailureTime))
        : 0
    };
  }
}

const aiCircuitBreaker = new AICircuitBreaker();

// ============= PHASE 1: AI Call with Timeout =============
async function callAIWithTimeout(
  prompt: string,
  apiKey: string,
  timeoutMs = 30000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await aiCircuitBreaker.execute(async () => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert K-12 educator creating engaging, age-appropriate lesson content. Always return valid JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============= PHASE 1: Concurrency Control =============
async function processTaskBatch<T, R>(
  tasks: T[],
  processor: (task: T) => Promise<R>,
  concurrencyLimit = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = processor(task).then(result => {
      results.push(result);
    }).catch(error => {
      console.error('Task failed:', error);
      // Don't throw - collect partial results
    });

    executing.push(promise);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(0, executing.findIndex(p => p === promise) + 1);
    }
  }

  await Promise.all(executing);
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { gradeLevel, subjects, lessonsPerSubject = 10 } = await req.json();

    if (gradeLevel === undefined || !subjects || !Array.isArray(subjects)) {
      throw new Error('Grade level and subjects array required');
    }

    console.log(`Generating ${subjects.length * lessonsPerSubject} lessons for Grade ${gradeLevel}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // ============= PHASE 1: Build task list for batch processing =============
    type LessonTask = {
      subject: string;
      lessonNumber: number;
      gradeLevel: number;
    };

    const tasks: LessonTask[] = [];
    for (const subject of subjects) {
      for (let i = 0; i < lessonsPerSubject; i++) {
        tasks.push({
          subject,
          lessonNumber: i + 1,
          gradeLevel
        });
      }
    }

    console.log(`Processing ${tasks.length} lessons with concurrency limit of 5...`);
    console.log(`Circuit breaker status:`, aiCircuitBreaker.getStatus());

    // ============= PHASE 1: Process lessons with concurrency control =============
    const allLessons = await processTaskBatch(
      tasks,
      async (task) => {
        const { subject, lessonNumber, gradeLevel } = task;
        console.log(`[${subject} ${lessonNumber}/${lessonsPerSubject}] Starting generation...`);
        
        const startTime = Date.now();
        const prompt = buildLessonPrompt(gradeLevel, subject, lessonNumber);
        
        try {
          // Call AI with 30s timeout and circuit breaker
          const generatedContent = await callAIWithTimeout(prompt, LOVABLE_API_KEY, 30000);
          const duration = Date.now() - startTime;
          console.log(`[${subject} ${lessonNumber}/${lessonsPerSubject}] Generated in ${duration}ms`);

          // Parse AI response
          let lessonData;
          try {
            const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                             generatedContent.match(/```\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : generatedContent;
            lessonData = JSON.parse(jsonStr);
          } catch (parseError) {
            console.error(`[${subject} ${lessonNumber}] Failed to parse AI response:`, parseError);
            lessonData = {
              title: `${subject} Lesson ${lessonNumber}`,
              description: `Explore ${subject} concepts for grade ${gradeLevel}`,
              content_markdown: generatedContent.substring(0, 1000),
              quiz_questions: generateDefaultQuiz(subject, gradeLevel)
            };
          }

          // Add calculated fields
          const estimatedMinutes = calculateDuration(gradeLevel);
          const pointsValue = calculatePoints(gradeLevel, subject);

          console.log(`[${subject} ${lessonNumber}] Parsed successfully`);

          return {
            ...lessonData,
            grade_level: gradeLevel,
            subject,
            estimated_minutes: estimatedMinutes,
            points_value: pointsValue,
            is_active: true
          };
        } catch (error) {
          console.error(`[${subject} ${lessonNumber}] Generation failed:`, error);
          // Return null for failed lessons - they'll be filtered out
          return null;
        }
      },
      5 // Concurrency limit
    );

    // Filter out failed lessons (nulls)
    const successfulLessons = allLessons.filter(lesson => lesson !== null);
    
    console.log(`Generated ${successfulLessons.length}/${tasks.length} lessons successfully`);

    if (successfulLessons.length === 0) {
      throw new Error('All lesson generations failed');
    }

    // ============= PHASE 1: Insert lessons in batches =============
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < successfulLessons.length; i += batchSize) {
      const batch = successfulLessons.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('lessons')
        .insert(batch);

      if (insertError) {
        console.error(`Failed to insert batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(successfulLessons.length / batchSize)} (${insertedCount} total)`);
    }

    const finalCircuitStatus = aiCircuitBreaker.getStatus();
    console.log(`Final circuit breaker status:`, finalCircuitStatus);

    return new Response(JSON.stringify({ 
      success: true, 
      lessons_created: successfulLessons.length,
      lessons_failed: tasks.length - successfulLessons.length,
      grade_level: gradeLevel,
      subjects: subjects,
      circuit_breaker: finalCircuitStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildLessonPrompt(grade: number, subject: string, lessonNum: number): string {
  const ageRange = getAgeRange(grade);
  const gradeLabel = grade === 0 ? 'Kindergarten' : `${grade}${getGradeSuffix(grade)} grade`;
  
  return `Create a comprehensive ${subject} lesson for ${gradeLabel} (ages ${ageRange}).

Lesson Number: ${lessonNum} of 10 in the series.

Return ONLY valid JSON with this exact structure:
{
  "title": "Engaging lesson title (max 60 chars)",
  "description": "Clear 2-sentence description of what students will learn",
  "content_markdown": "Full markdown lesson content with ## headings, bullet points, and examples. Include: Learning Objectives, Main Content, Interactive Activities, and Reflection Questions. 500-800 words.",
  "quiz_questions": [
    {
      "question": "Age-appropriate question text",
      "options": ["Option A", "Option B", "Option C"],
      "correct": "Option A",
      "explanation": "Encouraging explanation with correct answer reasoning"
    }
  ]
}

Requirements:
- Create 3 quiz questions, each with 3 options (grade ${grade} appropriate difficulty)
- Use encouraging, positive language ("Great thinking!", "You've got this!", "Wonderful!")
- ${grade <= 2 ? 'Use simple vocabulary and short sentences. Include lots of examples and visuals.' : grade <= 5 ? 'Use transitioning reader level vocabulary. Explain new concepts clearly.' : grade <= 8 ? 'Use grade-appropriate complexity. Include real-world applications.' : 'Use advanced vocabulary and complex concepts. Encourage critical thinking.'}
- Include interactive elements: "Try this!", "Draw a picture of...", "Discuss with a friend..."
- Connect to real-world examples relevant to ${ageRange} year olds
- Make it fun and engaging!

Return ONLY the JSON, no additional text.`;
}

function getAgeRange(grade: number): string {
  const baseAge = grade === 0 ? 5 : grade + 5;
  return `${baseAge}-${baseAge + 1}`;
}

function getGradeSuffix(grade: number): string {
  if (grade === 0) return '';
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
}

function calculateDuration(grade: number): number {
  if (grade <= 2) return 10 + Math.floor(Math.random() * 5); // 10-15 min
  if (grade <= 5) return 15 + Math.floor(Math.random() * 10); // 15-25 min
  if (grade <= 8) return 20 + Math.floor(Math.random() * 15); // 20-35 min
  return 25 + Math.floor(Math.random() * 20); // 25-45 min
}

function calculatePoints(grade: number, subject: string): number {
  const basePoints = 50 + (grade * 5);
  const subjectMultiplier = ['math', 'science'].includes(subject.toLowerCase()) ? 1.2 : 1;
  return Math.round(basePoints * subjectMultiplier);
}

function generateDefaultQuiz(subject: string, grade: number): any[] {
  return [
    {
      question: `Sample ${subject} question for grade ${grade}`,
      options: ['Option A', 'Option B', 'Option C'],
      correct: 'Option A',
      explanation: 'This would be an age-appropriate explanation.'
    },
    {
      question: `Another ${subject} question`,
      options: ['Choice 1', 'Choice 2', 'Choice 3'],
      correct: 'Choice 1',
      explanation: 'Great job thinking about this!'
    },
    {
      question: `Final ${subject} question`,
      options: ['Answer X', 'Answer Y', 'Answer Z'],
      correct: 'Answer X',
      explanation: 'You got it right!'
    }
  ];
}
