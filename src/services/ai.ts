import OpenAI from 'openai';

export type GeneratedFlashcard = {
  question: string;
  answer: string;
};

export type GenerationResult = {
  flashcards: GeneratedFlashcard[];
  title?: string;
};

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Note: In production, use a backend API
      });
    }
  }

  async generateFlashcardsWithTitle(
    prompt: string,
    count: number,
    generateTitle: boolean = false,
    onCard?: (card: GeneratedFlashcard, index: number) => void
  ): Promise<GenerationResult> {
    if (!this.openai) {
      throw new Error(
        'OpenAI API key not configured. Please add your API key to the .env file.'
      );
    }

    try {
      // Use delimiter-based format for true streaming
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

      // Use streaming WITHOUT json_object format for real-time updates
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create ${count} flashcards about: ${prompt}`,
          },
        ],
        temperature: 0.7,
        stream: true, // True streaming without JSON format constraint
      });

      let buffer = '';
      const flashcards: GeneratedFlashcard[] = [];
      let title: string | undefined;
      let cardIndex = 0;
      
      // Process the stream in real-time
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          buffer += content;
          
          // Extract title if present (only after we have a complete line)
          if (generateTitle && !title) {
            // Check if we have a complete title line (ending with newline or followed by CARD_START)
            const titleMatch = buffer.match(/TITLE:\s*([^\n]+)(?:\n|$)/);
            if (titleMatch && (buffer.includes('\n', buffer.indexOf('TITLE:')) || buffer.includes('CARD_START'))) {
              // Only extract if we have the complete title line
              title = titleMatch[1].trim().substring(0, 50);
            }
          }
          
          // Extract complete cards as they appear (more flexible regex)
          let cardMatch;
          const cardRegex = /CARD_START[\s\S]*?Q:\s*([^\n]+)[\s\S]*?A:\s*([^\n]+)[\s\S]*?CARD_END/;
          
          while ((cardMatch = buffer.match(cardRegex))) {
            const question = cardMatch[1].trim().substring(0, 190);
            const answer = cardMatch[2].trim().substring(0, 190);
            
            const card: GeneratedFlashcard = { question, answer };
            flashcards.push(card);
            
            // Notify immediately when a card is complete
            if (onCard) {
              console.log(`Streaming card ${cardIndex + 1}: ${question.substring(0, 50)}...`);
              onCard(card, cardIndex);
            }
            cardIndex++;
            
            // Remove the processed card from buffer
            const endIndex = buffer.indexOf('CARD_END');
            buffer = buffer.substring(endIndex + 8);
          }
        }
      }
      
      return {
        flashcards,
        title,
      };
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw error;
    }
  }

  async generateFlashcards(
    prompt: string,
    count: number,
    onCard?: (card: GeneratedFlashcard, index: number) => void,
    onProgress?: (progress: number) => void
  ): Promise<GeneratedFlashcard[]> {
    const result = await this.generateFlashcardsWithTitle(
      prompt,
      count,
      false,
      onCard
    );
    if (onProgress) {
      onProgress(1);
    }
    return result.flashcards;
  }

  async* generateFlashcardsStream(
    prompt: string,
    count: number
  ): AsyncGenerator<GeneratedFlashcard, void, unknown> {
    if (!this.openai) {
      throw new Error(
        'OpenAI API key not configured. Please add your API key to the .env file.'
      );
    }

    try {
      const flashcards = await this.generateFlashcards(prompt, count);
      
      for (const card of flashcards) {
        yield card;
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error in stream generation:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}

export const aiService = new AIService();