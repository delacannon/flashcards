import { supabase } from '@/lib/supabase';

export type GeneratedFlashcard = {
  question: string;
  answer: string;
};

export type GenerationResult = {
  flashcards: GeneratedFlashcard[];
  title?: string;
};

interface AuthUser {
  id: string;
  email: string | null;
}

class AIEdgeService {
  private currentUser: AuthUser | null = null;
  private edgeFunctionUrl: string;

  constructor() {
    // Get the Supabase URL and construct the Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      // Edge Functions are served from the same domain under /functions/v1/
      this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-flashcards`;
    } else {
      this.edgeFunctionUrl = '';
      console.error('Supabase URL not configured');
    }
  }

  setUser(user: AuthUser | null) {
    this.currentUser = user;
  }

  isAvailable(): boolean {
    return this.currentUser !== null && this.edgeFunctionUrl !== '';
  }

  isConfigured(): boolean {
    // Edge functions are always configured if Supabase is set up
    return this.edgeFunctionUrl !== '';
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getUnavailableReason(): 'not-configured' | 'not-authenticated' | null {
    if (!this.isConfigured()) return 'not-configured';
    if (!this.isAuthenticated()) return 'not-authenticated';
    return null;
  }

  async generateFlashcardsWithTitle(
    prompt: string,
    count: number,
    generateTitle: boolean = false,
    onCard?: (card: GeneratedFlashcard, index: number) => void
  ): Promise<GenerationResult> {
    if (!this.isAuthenticated()) {
      throw new Error(
        'AUTHENTICATION_REQUIRED: Please sign in to use AI features'
      );
    }

    if (!this.edgeFunctionUrl) {
      throw new Error('Edge function URL not configured');
    }

    // Validate prompt length
    if (prompt.length > 250) {
      throw new Error('Prompt must not exceed 250 characters');
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Check if we should use streaming (when onCard callback is provided)
      const useStreaming = !!onCard;

      if (useStreaming) {
        // Use Server-Sent Events for streaming
        const response = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            prompt,
            count,
            generateTitle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate flashcards');
        }

        // Process the event stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        let title: string | undefined;
        const flashcards: GeneratedFlashcard[] = [];
        let buffer = '';

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.substring(7);
              
              // Get the data line (next line after event)
              const nextLineIndex = lines.indexOf(line) + 1;
              if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
                const data = lines[nextLineIndex].substring(6);
                
                try {
                  const parsedData = JSON.parse(data);
                  
                  if (eventType === 'title') {
                    title = parsedData.title;
                  } else if (eventType === 'card') {
                    const card: GeneratedFlashcard = {
                      question: parsedData.question,
                      answer: parsedData.answer,
                    };
                    flashcards.push(card);
                    
                    // Call the callback immediately
                    if (onCard) {
                      onCard(card, parsedData.index);
                    }
                  } else if (eventType === 'error') {
                    throw new Error(parsedData.error);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
        }

        return {
          flashcards,
          title,
        };
      } else {
        // Use regular JSON response
        const response = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            count,
            generateTitle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate flashcards');
        }

        const result = await response.json();
        return {
          flashcards: result.flashcards,
          title: result.title,
        };
      }
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
    if (!this.isAuthenticated()) {
      throw new Error(
        'AUTHENTICATION_REQUIRED: Please sign in to use AI features'
      );
    }

    // Validate prompt length
    if (prompt.length > 250) {
      throw new Error('Prompt must not exceed 250 characters');
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
}

// Export the new edge-based service
export const aiServiceEdge = new AIEdgeService();

// For backward compatibility, also export with the old name
export const aiServiceAuth = aiServiceEdge;
export const aiService = aiServiceEdge;