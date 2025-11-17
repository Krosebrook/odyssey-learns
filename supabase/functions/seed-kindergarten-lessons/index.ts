import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 50 kindergarten lesson outlines embedded
const KINDERGARTEN_LESSONS = [
  // Reading Foundations (10 lessons)
  {
    title: "Meet the ABCs: Letters A-E",
    subject: "Reading Foundations",
    description: "Learn to recognize and trace letters A through E with fun activities",
    duration: 12,
    objectives: ["Recognize uppercase and lowercase letters A-E", "Say letter names", "Trace letters"],
    activities: ["Animated letter parade", "Letter tracing", "Find the Letter game", "Alphabet song A-E"],
    assessment: "Match uppercase to lowercase (5 drag-and-drop questions)"
  },
  {
    title: "Meet the ABCs: Letters F-J",
    subject: "Reading Foundations",
    description: "Discover letters F through J with interactive sorting and movement",
    duration: 12,
    objectives: ["Recognize letters F-J", "Identify letters in words"],
    activities: ["Letter formation", "Letter sorting", "Letter Dance", "Story: Frog Jumps High"],
    assessment: "Letter identification (5 multiple choice)"
  },
  {
    title: "Meet the ABCs: Letters K-O",
    subject: "Reading Foundations",
    description: "Connect letters K through O to familiar objects",
    duration: 12,
    objectives: ["Recognize letters K-O", "Connect letters to objects (K for Kite)"],
    activities: ["Letter-picture matching", "Draw the Letter", "Storybook: The King's Lost Letter"],
    assessment: "Match letters to beginning sounds (5 picture-based)"
  },
  {
    title: "Meet the ABCs: Letters P-T",
    subject: "Reading Foundations",
    description: "Explore letters P through T with hopscotch and treasure hunts",
    duration: 12,
    objectives: ["Recognize letters P-T", "Hear beginning sounds"],
    activities: ["Letter hopscotch", "Pizza Party story", "Treasure hunt", "Build letters with blocks"],
    assessment: "Identify letters in sentences (5 tap questions)"
  },
  {
    title: "Meet the ABCs: Letters U-Z",
    subject: "Reading Foundations",
    description: "Complete the alphabet and celebrate knowing all 26 letters",
    duration: 12,
    objectives: ["Complete alphabet recognition U-Z", "Celebrate learning all letters"],
    activities: ["Alphabet parade A-Z", "Zebra's Adventure story", "Certificate creation"],
    assessment: "Full alphabet recognition (10 random letters)"
  },
  {
    title: "Letter Sounds: Aa, Bb, Cc",
    subject: "Reading Foundations",
    description: "Say the sounds letters make and identify beginning sounds",
    duration: 15,
    objectives: ["Say letter sounds", "Identify beginning sounds (apple, ball, cat)"],
    activities: ["Sound safari", "Phonics song", "Sound Match game", "Annie's Apple Adventure"],
    assessment: "Match picture to beginning sound (5 visual questions)"
  },
  {
    title: "Letter Sounds: Dd, Ee, Ff",
    subject: "Reading Foundations",
    description: "Produce /d/, /e/, /f/ sounds and distinguish between them",
    duration: 15,
    objectives: ["Produce /d/, /e/, /f/ sounds", "Distinguish similar sounds"],
    activities: ["Dog Days story", "Sound discrimination", "Build CVC words", "Rhyme time"],
    assessment: "Beginning sound identification (5 audio+visual)"
  },
  {
    title: "Rhyming Fun",
    subject: "Reading Foundations",
    description: "Recognize and generate simple rhyming words",
    duration: 15,
    objectives: ["Recognize rhyming words (cat/hat)", "Generate simple rhymes"],
    activities: ["Rhyme parade", "Rhyme matching", "Create your own rhymes"],
    assessment: "Identify rhyming pairs (5 questions)"
  },
  {
    title: "My First Sight Words",
    subject: "Reading Foundations",
    description: "Learn essential sight words like I, see, the, and, you",
    duration: 15,
    objectives: ["Recognize sight words", "Use in simple sentences"],
    activities: ["Sight word flashcards", "Word hunt", "Build sentences", "Memory game"],
    assessment: "Sight word recognition (5 words)"
  },
  {
    title: "Reading Simple Sentences",
    subject: "Reading Foundations",
    description: "Practice reading complete sentences with sight words",
    duration: 15,
    objectives: ["Read simple sentences", "Point to words while reading"],
    activities: ["Sentence building", "Interactive story", "Word tracking"],
    assessment: "Read 3 simple sentences aloud"
  },

  // Math Foundations (10 lessons)
  {
    title: "Counting 1-5",
    subject: "Math Foundations",
    description: "Count objects from 1 to 5 with fun visuals",
    duration: 10,
    objectives: ["Count objects 1-5", "Match number to quantity"],
    activities: ["Counting song", "Number hunt", "Dot counting"],
    assessment: "Count and match (5 questions)"
  },
  {
    title: "Counting 6-10",
    subject: "Math Foundations",
    description: "Continue counting journey from 6 to 10",
    duration: 10,
    objectives: ["Count objects 6-10", "Write numbers"],
    activities: ["Counting parade", "Number tracing", "Ten frame game"],
    assessment: "Count objects (5 questions)"
  },
  {
    title: "Number Recognition 1-10",
    subject: "Math Foundations",
    description: "Recognize and identify numbers 1 through 10",
    duration: 12,
    objectives: ["Identify numbers 1-10", "Match numerals to quantities"],
    activities: ["Number matching", "Number hopscotch", "Counting race"],
    assessment: "Number identification (5 questions)"
  },
  {
    title: "Shapes: Circle and Square",
    subject: "Math Foundations",
    description: "Explore circles and squares in everyday objects",
    duration: 12,
    objectives: ["Identify circles and squares", "Draw basic shapes"],
    activities: ["Shape hunt", "Shape art", "Shape sorting"],
    assessment: "Shape identification (5 questions)"
  },
  {
    title: "Shapes: Triangle and Rectangle",
    subject: "Math Foundations",
    description: "Discover triangles and rectangles all around us",
    duration: 12,
    objectives: ["Identify triangles and rectangles", "Count sides and corners"],
    activities: ["Shape building", "Shape patterns", "Real-world shapes"],
    assessment: "Shape matching (5 questions)"
  },
  {
    title: "More and Less",
    subject: "Math Foundations",
    description: "Compare groups of objects using more and less",
    duration: 12,
    objectives: ["Compare quantities", "Use words more/less/same"],
    activities: ["Comparison game", "Counting bears", "Visual estimation"],
    assessment: "Compare quantities (5 questions)"
  },
  {
    title: "Sorting by Color",
    subject: "Math Foundations",
    description: "Sort objects by color into groups",
    duration: 10,
    objectives: ["Sort objects by color", "Identify primary colors"],
    activities: ["Color sorting", "Rainbow organization", "Color patterns"],
    assessment: "Sort objects (3 questions)"
  },
  {
    title: "Sorting by Size",
    subject: "Math Foundations",
    description: "Compare and sort objects by size (big, medium, small)",
    duration: 10,
    objectives: ["Sort by size", "Order from biggest to smallest"],
    activities: ["Size comparison", "Ordering game", "Measurement fun"],
    assessment: "Size sorting (3 questions)"
  },
  {
    title: "Simple Patterns",
    subject: "Math Foundations",
    description: "Recognize and create AB patterns",
    duration: 12,
    objectives: ["Recognize AB patterns", "Extend patterns", "Create own patterns"],
    activities: ["Pattern blocks", "Pattern dance", "Pattern art"],
    assessment: "Complete the pattern (5 questions)"
  },
  {
    title: "Measurement Basics",
    subject: "Math Foundations",
    description: "Compare lengths using longer/shorter concepts",
    duration: 12,
    objectives: ["Compare lengths", "Use measurement words"],
    activities: ["Length comparison", "Measuring with blocks", "Estimation game"],
    assessment: "Measure and compare (3 questions)"
  },

  // Science Wonders (10 lessons)
  {
    title: "Five Senses: See, Hear, Touch",
    subject: "Science Wonders",
    description: "Explore three of our five senses through fun activities",
    duration: 15,
    objectives: ["Identify seeing, hearing, touching", "Name body parts for each sense"],
    activities: ["Sense walk", "Sound matching", "Texture exploration"],
    assessment: "Match sense to body part (5 questions)"
  },
  {
    title: "Five Senses: Taste and Smell",
    subject: "Science Wonders",
    description: "Discover taste and smell senses",
    duration: 15,
    objectives: ["Identify taste and smell senses", "Describe different tastes"],
    activities: ["Smell jars", "Taste exploration", "Sense sorting"],
    assessment: "Identify senses (5 questions)"
  },
  {
    title: "Weather Watch: Sunny Days",
    subject: "Science Wonders",
    description: "Learn about sunny weather and what to wear",
    duration: 12,
    objectives: ["Identify sunny weather", "Choose appropriate clothing"],
    activities: ["Weather observation", "Clothing match", "Sun safety"],
    assessment: "Weather and clothing (3 questions)"
  },
  {
    title: "Weather Watch: Rainy Days",
    subject: "Science Wonders",
    description: "Explore rainy weather and water activities",
    duration: 12,
    objectives: ["Identify rain", "Understand water cycle basics"],
    activities: ["Rain sounds", "Puddle jumping", "Rainy day gear"],
    assessment: "Rainy weather (3 questions)"
  },
  {
    title: "Day and Night",
    subject: "Science Wonders",
    description: "Understand the difference between day and night",
    duration: 12,
    objectives: ["Distinguish day from night", "Name activities for each time"],
    activities: ["Day/night sorting", "Sun and moon", "Daily routines"],
    assessment: "Day vs night (5 questions)"
  },
  {
    title: "Seasons: Fall",
    subject: "Science Wonders",
    description: "Explore fall season changes",
    duration: 15,
    objectives: ["Identify fall characteristics", "Observe seasonal changes"],
    activities: ["Leaf observation", "Fall colors", "Harvest activities"],
    assessment: "Fall identification (3 questions)"
  },
  {
    title: "Seasons: Winter",
    subject: "Science Wonders",
    description: "Discover winter weather and activities",
    duration: 15,
    objectives: ["Identify winter characteristics", "Winter safety"],
    activities: ["Snow exploration", "Winter clothing", "Winter animals"],
    assessment: "Winter knowledge (3 questions)"
  },
  {
    title: "Animals: Pets",
    subject: "Science Wonders",
    description: "Learn about common pets and their care",
    duration: 15,
    objectives: ["Identify common pets", "Understand pet care needs"],
    activities: ["Pet sorting", "Pet care", "Animal sounds"],
    assessment: "Pet identification (5 questions)"
  },
  {
    title: "Animals: Farm Animals",
    subject: "Science Wonders",
    description: "Explore farm animals and their homes",
    duration: 15,
    objectives: ["Identify farm animals", "Match animals to homes"],
    activities: ["Farm visit", "Animal sounds", "Farm homes"],
    assessment: "Farm animals (5 questions)"
  },
  {
    title: "Plants Need Water and Sun",
    subject: "Science Wonders",
    description: "Understand basic plant needs",
    duration: 15,
    objectives: ["Identify plant needs", "Observe plant growth"],
    activities: ["Plant observation", "Watering experiment", "Sun tracking"],
    assessment: "Plant needs (3 questions)"
  },

  // Social Studies (10 lessons)
  {
    title: "All About Me",
    subject: "Social Studies",
    description: "Learn about self-identity and personal information",
    duration: 15,
    objectives: ["State name and age", "Share favorite things"],
    activities: ["Self-portrait", "About me book", "Favorite things"],
    assessment: "Personal information (3 questions)"
  },
  {
    title: "My Family",
    subject: "Social Studies",
    description: "Explore family members and relationships",
    duration: 15,
    objectives: ["Name family members", "Describe family activities"],
    activities: ["Family tree", "Family roles", "Family traditions"],
    assessment: "Family identification (3 questions)"
  },
  {
    title: "Feelings: Happy and Sad",
    subject: "Social Studies",
    description: "Recognize and express happy and sad emotions",
    duration: 12,
    objectives: ["Identify happy/sad feelings", "Express emotions appropriately"],
    activities: ["Emotion faces", "Feeling stories", "Emotion charades"],
    assessment: "Emotion recognition (5 questions)"
  },
  {
    title: "Feelings: Mad and Scared",
    subject: "Social Studies",
    description: "Understand and cope with mad and scared feelings",
    duration: 12,
    objectives: ["Identify mad/scared feelings", "Learn coping strategies"],
    activities: ["Emotion cards", "Calming techniques", "Brave stories"],
    assessment: "Emotion identification (5 questions)"
  },
  {
    title: "School Rules",
    subject: "Social Studies",
    description: "Learn important classroom rules and safety",
    duration: 12,
    objectives: ["Follow classroom rules", "Understand rule importance"],
    activities: ["Rule sorting", "Safety practice", "Role play"],
    assessment: "Rule identification (5 questions)"
  },
  {
    title: "Community Helpers",
    subject: "Social Studies",
    description: "Meet helpers in our community",
    duration: 15,
    objectives: ["Identify community helpers", "Understand their roles"],
    activities: ["Helper matching", "Uniform sorting", "Helper stories"],
    assessment: "Helper identification (5 questions)"
  },
  {
    title: "Holidays: Celebrations",
    subject: "Social Studies",
    description: "Learn about different holidays and traditions",
    duration: 15,
    objectives: ["Identify common holidays", "Respect different celebrations"],
    activities: ["Holiday sorting", "Celebration stories", "Traditions"],
    assessment: "Holiday matching (3 questions)"
  },
  {
    title: "Being a Good Friend",
    subject: "Social Studies",
    description: "Practice friendship skills and kindness",
    duration: 12,
    objectives: ["Demonstrate friendly behaviors", "Solve friendship problems"],
    activities: ["Friendship scenarios", "Kindness activities", "Sharing practice"],
    assessment: "Friendship scenarios (3 questions)"
  },
  {
    title: "Taking Turns",
    subject: "Social Studies",
    description: "Learn patience and turn-taking in games",
    duration: 10,
    objectives: ["Practice taking turns", "Wait patiently"],
    activities: ["Turn-taking games", "Waiting practice", "Sharing activities"],
    assessment: "Turn-taking scenarios (3 questions)"
  },
  {
    title: "Our Neighborhood",
    subject: "Social Studies",
    description: "Explore neighborhood places and safety",
    duration: 15,
    objectives: ["Identify neighborhood places", "Practice safety rules"],
    activities: ["Neighborhood map", "Place matching", "Safety walk"],
    assessment: "Neighborhood identification (5 questions)"
  },

  // Life Skills & Emotional Intelligence (10 lessons)
  {
    title: "When I Feel Happy",
    subject: "Life Skills",
    description: "Recognize happiness and share joy with others",
    duration: 10,
    objectives: ["Identify happy feelings", "Share happiness"],
    activities: ["Happy moments", "Joy sharing", "Gratitude practice"],
    assessment: "Happy scenarios (3 questions)"
  },
  {
    title: "When I Feel Sad",
    subject: "Life Skills",
    description: "Cope with sadness in healthy ways",
    duration: 10,
    objectives: ["Recognize sadness", "Use coping strategies"],
    activities: ["Sad feelings", "Comfort activities", "Asking for help"],
    assessment: "Sadness coping (3 questions)"
  },
  {
    title: "When I Feel Angry",
    subject: "Life Skills",
    description: "Manage anger with calm-down techniques",
    duration: 12,
    objectives: ["Recognize anger", "Use calming strategies"],
    activities: ["Anger thermometer", "Deep breathing", "Calm-down corner"],
    assessment: "Anger management (3 questions)"
  },
  {
    title: "When I Feel Scared",
    subject: "Life Skills",
    description: "Face fears with bravery and support",
    duration: 12,
    objectives: ["Identify fear", "Seek support", "Build courage"],
    activities: ["Brave stories", "Safe person identification", "Courage practice"],
    assessment: "Fear scenarios (3 questions)"
  },
  {
    title: "Sharing is Caring",
    subject: "Life Skills",
    description: "Practice sharing toys and materials",
    duration: 10,
    objectives: ["Share willingly", "Take turns fairly"],
    activities: ["Sharing games", "Turn-taking", "Generosity practice"],
    assessment: "Sharing scenarios (3 questions)"
  },
  {
    title: "Being Kind",
    subject: "Life Skills",
    description: "Show kindness through words and actions",
    duration: 10,
    objectives: ["Demonstrate kind actions", "Use kind words"],
    activities: ["Kindness cards", "Helping activities", "Kind words practice"],
    assessment: "Kindness scenarios (3 questions)"
  },
  {
    title: "Helping at Home",
    subject: "Life Skills",
    description: "Learn age-appropriate chores and responsibilities",
    duration: 12,
    objectives: ["Complete simple chores", "Help family members"],
    activities: ["Chore matching", "Helping practice", "Responsibility chart"],
    assessment: "Helping identification (3 questions)"
  },
  {
    title: "Good Manners",
    subject: "Life Skills",
    description: "Practice please, thank you, and excuse me",
    duration: 10,
    objectives: ["Use polite words", "Show respect"],
    activities: ["Manner scenarios", "Polite practice", "Role playing"],
    assessment: "Manners usage (5 questions)"
  },
  {
    title: "Washing Hands",
    subject: "Life Skills",
    description: "Learn proper handwashing steps and when to wash",
    duration: 10,
    objectives: ["Wash hands correctly", "Know when to wash"],
    activities: ["Handwashing demo", "Germ game", "When to wash"],
    assessment: "Handwashing steps (3 questions)"
  },
  {
    title: "I Can Do It!",
    subject: "Life Skills",
    description: "Build confidence and independence",
    duration: 12,
    objectives: ["Try new tasks", "Build self-confidence"],
    activities: ["Achievement gallery", "Challenge tasks", "Confidence building"],
    assessment: "Confidence scenarios (3 questions)"
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let created = 0;
    let skipped = 0;
    const errors: any[] = [];

    // Generate lessons
    for (const outline of KINDERGARTEN_LESSONS) {
      try {
        // Check if lesson already exists
        const { data: existing } = await supabase
          .from('lessons')
          .select('id')
          .eq('title', outline.title)
          .eq('grade_level', 0)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping existing lesson: ${outline.title}`);
          skipped++;
          continue;
        }

        // Generate lesson content with AI
        const prompt = `Create a kindergarten lesson for "${outline.title}" in ${outline.subject}.

Description: ${outline.description}
Duration: ${outline.duration} minutes
Learning Objectives: ${outline.objectives.join(', ')}
Activities: ${outline.activities.join(', ')}
Assessment: ${outline.assessment}

Generate engaging, age-appropriate content in markdown format with:
1. Introduction (2-3 sentences for 5-6 year olds)
2. Main content with visual descriptions and simple instructions
3. Practice activities with step-by-step guidance
4. Review section

Keep language simple, use short sentences, and include emojis. Make it fun and interactive!`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a kindergarten education expert creating engaging lessons for 5-6 year olds.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;

        // Generate quiz questions
        const quizPrompt = `Create ${outline.assessment.includes('3 questions') ? 3 : 5} age-appropriate quiz questions for kindergarten lesson "${outline.title}".

Return ONLY a JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C"],
    "correct_answer": "Option A"
  }
]

Make questions simple with picture-based or visual options appropriate for 5-6 year olds.`;

        const quizResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a kindergarten assessment expert. Return only valid JSON.' },
              { role: 'user', content: quizPrompt }
            ],
          }),
        });

        const quizData = await quizResponse.json();
        let quizQuestions;
        try {
          const quizContent = quizData.choices[0].message.content;
          const jsonMatch = quizContent.match(/\[[\s\S]*\]/);
          quizQuestions = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
          console.error('Failed to parse quiz JSON:', e);
          quizQuestions = null;
        }

        // Fallback quiz if parsing failed
        if (!quizQuestions) {
          quizQuestions = [
            {
              question: `What did you learn in this lesson?`,
              options: ["A lot!", "Some things", "I need more practice"],
              correct_answer: "A lot!"
            },
            {
              question: "Did you enjoy this activity?",
              options: ["Yes!", "It was okay", "Not really"],
              correct_answer: "Yes!"
            },
            {
              question: "Can you try this at home?",
              options: ["Yes I can!", "Maybe", "I need help"],
              correct_answer: "Yes I can!"
            }
          ];
        }

        // Insert lesson
        const { error: insertError } = await supabase
          .from('lessons')
          .insert({
            title: outline.title,
            subject: outline.subject,
            description: outline.description,
            grade_level: 0, // Kindergarten
            estimated_minutes: outline.duration,
            points_value: 30, // Standard for K
            content_markdown: content,
            quiz_questions: quizQuestions,
            is_active: true,
            standards_alignment: outline.objectives.join('; ')
          });

        if (insertError) throw insertError;

        created++;
        console.log(`Created lesson ${created}: ${outline.title}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error generating lesson ${outline.title}:`, error);
        errors.push({ lesson: outline.title, error: (error as Error).message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created,
      skipped,
      errors,
      total: KINDERGARTEN_LESSONS.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Seed function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
