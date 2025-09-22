import { supabase } from '../lib/supabase';
import type { FlashcardSet, FlashcardSetConfig } from '../types';

export class FlashcardService {
  static async getUserSets(userId: string): Promise<{
    data: FlashcardSet[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          flashcards (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sets = data?.map(set => ({
        id: set.id,
        title: set.title,
        prompt: set.description || '',
        numberOfCards: set.flashcards?.length || 0,
        cards: set.flashcards?.map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
        })) || [],
        config: set.config as FlashcardSetConfig,
      })) || [];

      return { data: sets as FlashcardSet[], error: null };
    } catch (error) {
      console.error('Error fetching user sets:', error);
      return { data: null, error: error as Error };
    }
  }

  static async getSetById(setId: string): Promise<{
    data: FlashcardSet | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          flashcards (*)
        `)
        .eq('id', setId)
        .single();

      if (error) throw error;

      const set = {
        id: data.id,
        title: data.title,
        prompt: data.description || '',
        numberOfCards: data.flashcards?.length || 0,
        cards: data.flashcards?.map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
        })) || [],
        config: data.config as FlashcardSetConfig,
      };

      return { data: set as FlashcardSet, error: null };
    } catch (error) {
      console.error('Error fetching set:', error);
      return { data: null, error: error as Error };
    }
  }

  static async createSet(
    userId: string,
    set: Omit<FlashcardSet, 'id'>
  ): Promise<{
    data: FlashcardSet | null;
    error: Error | null;
  }> {
    try {
      const { data: setData, error: setError } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: userId,
          title: set.title,
          description: set.prompt,
          config: set.config || {},
        })
        .select()
        .single();

      if (setError) throw setError;

      if (set.cards && set.cards.length > 0) {
        const cardsToInsert = set.cards.map((card, index) => ({
          set_id: setData.id,
          question: card.question,
          answer: card.answer,
          position: index,
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      const { data: completeSet } = await FlashcardService.getSetById(setData.id);
      
      return { data: completeSet, error: null };
    } catch (error) {
      console.error('Error creating set:', error);
      return { data: null, error: error as Error };
    }
  }

  static async updateSet(
    setId: string,
    updates: Partial<FlashcardSet>
  ): Promise<{
    data: FlashcardSet | null;
    error: Error | null;
  }> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.prompt !== undefined) updateData.description = updates.prompt;
      if (updates.config !== undefined) updateData.config = updates.config;

      const { error: setError } = await supabase
        .from('flashcard_sets')
        .update(updateData)
        .eq('id', setId);

      if (setError) throw setError;

      if (updates.cards !== undefined) {
        const { error: deleteError } = await supabase
          .from('flashcards')
          .delete()
          .eq('set_id', setId);

        if (deleteError) throw deleteError;

        if (updates.cards.length > 0) {
          const cardsToInsert = updates.cards.map((card, index) => ({
            set_id: setId,
            question: card.question,
            answer: card.answer,
            position: index,
          }));

          const { error: insertError } = await supabase
            .from('flashcards')
            .insert(cardsToInsert);

          if (insertError) throw insertError;
        }
      }

      const { data: updatedSet } = await FlashcardService.getSetById(setId);
      
      return { data: updatedSet, error: null };
    } catch (error) {
      console.error('Error updating set:', error);
      return { data: null, error: error as Error };
    }
  }

  static async deleteSet(setId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting set:', error);
      return { error: error as Error };
    }
  }

  static async shareSet(
    setId: string,
    shareCode?: string
  ): Promise<{
    data: string | null;
    error: Error | null;
  }> {
    try {
      const code = shareCode || await this.generateUniqueShareCode();
      
      const { error } = await supabase
        .from('flashcard_sets')
        .update({ 
          share_code: code,
          visibility: 'unlisted'
        })
        .eq('id', setId);

      if (error) throw error;

      return { data: code, error: null };
    } catch (error) {
      console.error('Error sharing set:', error);
      return { data: null, error: error as Error };
    }
  }

  static async getSetByShareCode(shareCode: string): Promise<{
    data: FlashcardSet | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          flashcards (*)
        `)
        .eq('share_code', shareCode)
        .single();

      if (error) throw error;

      const set = {
        id: data.id,
        title: data.title,
        prompt: data.description || '',
        numberOfCards: data.flashcards?.length || 0,
        cards: data.flashcards?.map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
        })) || [],
        config: data.config as FlashcardSetConfig,
      };

      return { data: set as FlashcardSet, error: null };
    } catch (error) {
      console.error('Error fetching shared set:', error);
      return { data: null, error: error as Error };
    }
  }

  static async forkSet(
    originalSetId: string,
    userId: string
  ): Promise<{
    data: FlashcardSet | null;
    error: Error | null;
  }> {
    try {
      const { data: originalSet } = await FlashcardService.getSetById(originalSetId);
      
      if (!originalSet) {
        throw new Error('Original set not found');
      }

      const forkedSet = {
        ...originalSet,
        title: `${originalSet.title} (Fork)`,
      };

      delete (forkedSet as any).id;

      const { data: newSet } = await FlashcardService.createSet(userId, forkedSet);

      const { data: currentSet } = await supabase
        .from('flashcard_sets')
        .select('fork_count')
        .eq('id', originalSetId)
        .single();

      await supabase
        .from('flashcard_sets')
        .update({ fork_count: (currentSet?.fork_count || 0) + 1 })
        .eq('id', originalSetId);

      await supabase
        .from('flashcard_sets')
        .update({ forked_from: originalSetId })
        .eq('id', newSet?.id);

      return { data: newSet, error: null };
    } catch (error) {
      console.error('Error forking set:', error);
      return { data: null, error: error as Error };
    }
  }

  private static async generateUniqueShareCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const { data } = await supabase
      .from('flashcard_sets')
      .select('id')
      .eq('share_code', code)
      .single();

    if (data) {
      return this.generateUniqueShareCode();
    }

    return code;
  }

  static async recordStudySession(
    userId: string,
    setId: string,
    cardsStudied: number,
    correctAnswers: number,
    durationSeconds?: number
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          set_id: setId,
          cards_studied: cardsStudied,
          correct_answers: correctAnswers,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error recording study session:', error);
      return { error: error as Error };
    }
  }
}