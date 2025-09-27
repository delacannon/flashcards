import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import OpenAI from 'https://esm.sh/openai@4.67.3';
import { UsageTracker } from './usage.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  count: number;
  generateTitle?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a Supabase client with the auth header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { prompt, count, generateTitle = false }: RequestBody = await req.json();

    if (!prompt || !count) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and count' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate prompt length
    if (prompt.length > 250) {
      return new Response(
        JSON.stringify({ error: 'Prompt must not exceed 250 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize usage tracker
    const usageTracker = new UsageTracker(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Validate card count
    const cardValidation = usageTracker.validateCardCount(count);
    if (!cardValidation.valid) {
      return new Response(
        JSON.stringify({ error: cardValidation.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limit
    const rateLimit = await usageTracker.checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // Initialize OpenAI client with server-side API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Check if streaming is requested
    const acceptHeader = req.headers.get('Accept');
    const isStreaming = acceptHeader?.includes('text/event-stream');

    if (isStreaming) {
      // Handle streaming response with Server-Sent Events
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const systemPrompt = `You are a flashcard generator. Create exactly ${count} flashcards about the given topic.
            ${
              generateTitle
                ? `First, generate a descriptive title for this flashcard set.
            
            TITLE REQUIREMENTS:
            - Use 3-6 words that capture both topic and scope/level
            - Maximum 50 characters total
            - Be specific and descriptive, not generic
            - Include context like level (Beginner/Advanced) or type (Essential/Key/Basic)
            - Good examples: "Spanish Verbs for Beginners", "World War II Key Events", "Essential Chemistry Elements"
            - Bad examples: "Spanish", "History", "Chemistry"`
                : ''
            }
            
            OUTPUT FORMAT:
            ${generateTitle ? 'TITLE: [Your descriptive title here - 3-6 words]\n' : ''}
            Then output each flashcard in this exact format:
            
            CARD_START
            Q: [Question here - max 190 chars]
            A: [Answer here - max 190 chars]
            CARD_END
            
            RULES:
            - Use markdown emphasis: important words in **bold** or _italic_ (only proper nouns or dates)
            - Questions must be clear, specific, and test key knowledge
            - Answers must be concise, direct, and fact-based
            - If timeline-related, include the DATE in the answer
            - No filler or extra commentary
            - Focus on definitions, key facts, formulas, or core concepts
            
            Start generating now:`;

            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: `Create ${count} flashcards about: ${prompt}`,
                },
              ],
              temperature: 0.7,
              stream: true,
            });

            let buffer = '';
            let title = undefined;
            let cardIndex = 0;

            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                buffer += content;

                // Extract title if present
                if (generateTitle && !title) {
                  const titleMatch = buffer.match(/TITLE:\s*([^\n]+)(?:\n|$)/);
                  if (titleMatch && (buffer.includes('\n', buffer.indexOf('TITLE:')) || buffer.includes('CARD_START'))) {
                    title = titleMatch[1].trim().substring(0, 50);
                    // Send title event
                    const titleEvent = `event: title\ndata: ${JSON.stringify({ title })}\n\n`;
                    controller.enqueue(encoder.encode(titleEvent));
                  }
                }

                // Extract complete cards
                let cardMatch;
                const cardRegex = /CARD_START[\s\S]*?Q:\s*([^\n]+)[\s\S]*?A:\s*([^\n]+)[\s\S]*?CARD_END/;

                while ((cardMatch = buffer.match(cardRegex))) {
                  const question = cardMatch[1].trim().substring(0, 190);
                  const answer = cardMatch[2].trim().substring(0, 190);

                  // Send card event
                  const cardEvent = `event: card\ndata: ${JSON.stringify({
                    question,
                    answer,
                    index: cardIndex,
                  })}\n\n`;
                  controller.enqueue(encoder.encode(cardEvent));

                  cardIndex++;

                  // Remove processed card from buffer
                  const endIndex = buffer.indexOf('CARD_END');
                  buffer = buffer.substring(endIndex + 8);
                }
              }
            }

            // Track usage
            await usageTracker.trackUsage(user.id, cardIndex, {
              prompt: prompt.substring(0, 100),
              generateTitle,
              streaming: true,
            });

            // Send completion event
            const doneEvent = `event: done\ndata: ${JSON.stringify({ totalCards: cardIndex })}\n\n`;
            controller.enqueue(encoder.encode(doneEvent));
            controller.close();
          } catch (error) {
            const errorEvent = `event: error\ndata: ${JSON.stringify({
              error: error.message || 'Failed to generate flashcards',
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle non-streaming response
      const systemPrompt = `You are a flashcard generator. Create exactly ${count} flashcards about the given topic.
      ${
        generateTitle
          ? `First, generate a descriptive title for this flashcard set.
      
      TITLE REQUIREMENTS:
      - Use 3-6 words that capture both topic and scope/level
      - Maximum 50 characters total
      - Be specific and descriptive, not generic
      - Include context like level (Beginner/Advanced) or type (Essential/Key/Basic)
      - Good examples: "Spanish Verbs for Beginners", "World War II Key Events", "Essential Chemistry Elements"
      - Bad examples: "Spanish", "History", "Chemistry"`
          : ''
      }
      
      OUTPUT FORMAT:
      ${generateTitle ? 'TITLE: [Your descriptive title here - 3-6 words]\n' : ''}
      Then output each flashcard in this exact format:
      
      CARD_START
      Q: [Question here - max 190 chars]
      A: [Answer here - max 190 chars]
      CARD_END
      
      RULES:
      - Use markdown emphasis: important words in **bold** or _italic_ (only proper nouns or dates)
      - Questions must be clear, specific, and test key knowledge
      - Answers must be concise, direct, and fact-based
      - If timeline-related, include the DATE in the answer
      - No filler or extra commentary
      - Focus on definitions, key facts, formulas, or core concepts
      
      Start generating now:`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create ${count} flashcards about: ${prompt}`,
          },
        ],
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      let title = undefined;
      const flashcards = [];

      // Extract title if present
      if (generateTitle) {
        const titleMatch = responseContent.match(/TITLE:\s*([^\n]+)/);
        if (titleMatch) {
          title = titleMatch[1].trim().substring(0, 50);
        }
      }

      // Extract all flashcards
      const cardRegex = /CARD_START[\s\S]*?Q:\s*([^\n]+)[\s\S]*?A:\s*([^\n]+)[\s\S]*?CARD_END/g;
      let cardMatch;
      while ((cardMatch = cardRegex.exec(responseContent))) {
        const question = cardMatch[1].trim().substring(0, 190);
        const answer = cardMatch[2].trim().substring(0, 190);
        flashcards.push({ question, answer });
      }

      // Track usage
      await usageTracker.trackUsage(user.id, flashcards.length, {
        prompt: prompt.substring(0, 100),
        generateTitle,
        streaming: false,
      });

      return new Response(
        JSON.stringify({
          flashcards,
          title,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});