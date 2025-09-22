import { supabase } from '../lib/supabase';
import type { FlashcardSet, Flashcard } from '../types';

// Unified storage service that handles both Supabase and localStorage
export class UnifiedStorageService {
  private static STORAGE_KEY = 'flashcardSets';
  private static loadingPromise: Promise<FlashcardSet[]> | null = null;
  private static lastLoadTime = 0;
  private static CACHE_DURATION = 1000; // 1 second cache to prevent rapid re-fetches
  private static cachedSets: FlashcardSet[] | null = null;

  // Check if user is authenticated
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Get stats counts (total sets and total cards)
  static async getStatsCounts(): Promise<{ totalSets: number; totalCards: number }> {
    const user = await this.getCurrentUser();

    if (user) {
      try {
        // Get total sets count
        const { count: setsCount, error: setsError } = await supabase
          .from('flashcard_sets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (setsError) {
          console.error('Error fetching sets count:', setsError);
          throw setsError;
        }

        // Get total cards count
        // First get all set IDs for this user
        const { data: userSets, error: userSetsError } = await supabase
          .from('flashcard_sets')
          .select('id')
          .eq('user_id', user.id);

        if (userSetsError) {
          console.error('Error fetching user sets:', userSetsError);
          throw userSetsError;
        }

        let cardsCount = 0;
        if (userSets && userSets.length > 0) {
          const setIds = userSets.map(s => s.id);
          const { count, error: cardsError } = await supabase
            .from('flashcards')
            .select('*', { count: 'exact', head: true })
            .in('set_id', setIds);

          if (cardsError) {
            console.error('Error fetching cards count:', cardsError);
            throw cardsError;
          }
          cardsCount = count || 0;
        }

        return {
          totalSets: setsCount || 0,
          totalCards: cardsCount || 0,
        };
      } catch (error) {
        console.error('Error fetching stats counts:', error);
        // Fallback to counting loaded data
        const sets = await this.loadSets();
        return {
          totalSets: sets.length,
          totalCards: sets.reduce((sum, set) => sum + set.flashcards.length, 0),
        };
      }
    } else {
      // For localStorage, count the stored data
      const sets = this.loadFromLocalStorage();
      return {
        totalSets: sets.length,
        totalCards: sets.reduce((sum, set) => sum + set.flashcards.length, 0),
      };
    }
  }

  // Load flashcard sets (from Supabase if logged in, localStorage if not)
  static async loadSets(): Promise<FlashcardSet[]> {
    // If we're already loading, return the existing promise to prevent duplicate requests
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check cache
    const now = Date.now();
    if (this.cachedSets && (now - this.lastLoadTime) < this.CACHE_DURATION) {
      return this.cachedSets;
    }

    // Create new loading promise
    this.loadingPromise = this.loadSetsInternal();
    
    try {
      const result = await this.loadingPromise;
      this.cachedSets = result;
      this.lastLoadTime = now;
      return result;
    } finally {
      this.loadingPromise = null;
    }
  }

  private static async loadSetsInternal(): Promise<FlashcardSet[]> {
    const user = await this.getCurrentUser();

    if (user) {
      return this.loadFromSupabase(user.id);
    } else {
      return this.loadFromLocalStorage();
    }
  }

  // Save flashcard sets
  static async saveSets(sets: FlashcardSet[]): Promise<void> {
    const user = await this.getCurrentUser();

    if (user) {
      // Save to Supabase
      await this.saveToSupabase(sets, user.id);
    } else {
      // Save to localStorage
      this.saveToLocalStorage(sets);
    }
  }

  // Create a new flashcard set
  static async createSet(set: FlashcardSet): Promise<FlashcardSet> {
    // Clear cache when creating
    this.cachedSets = null;
    
    const user = await this.getCurrentUser();

    if (user) {
      return this.createInSupabase(set, user.id);
    } else {
      // For localStorage, just return the set as-is
      const sets = this.loadFromLocalStorage();
      sets.push(set);
      this.saveToLocalStorage(sets);
      return set;
    }
  }

  // Update an existing flashcard set
  static async updateSet(set: FlashcardSet): Promise<FlashcardSet> {
    // Clear cache when updating
    this.cachedSets = null;
    
    const user = await this.getCurrentUser();

    if (user) {
      return this.updateInSupabase(set, user.id);
    } else {
      const sets = this.loadFromLocalStorage();
      const index = sets.findIndex(s => s.id === set.id);
      if (index !== -1) {
        sets[index] = set;
        this.saveToLocalStorage(sets);
      }
      return set;
    }
  }

  // Delete a flashcard set
  static async deleteSet(setId: string): Promise<void> {
    // Clear cache when deleting
    this.cachedSets = null;
    
    const user = await this.getCurrentUser();

    if (user) {
      await this.deleteFromSupabase(setId);
    } else {
      const sets = this.loadFromLocalStorage();
      const filtered = sets.filter(s => s.id !== setId);
      this.saveToLocalStorage(filtered);
    }
  }

  // === Supabase Methods ===
  private static async loadFromSupabase(userId: string): Promise<FlashcardSet[]> {
    try {
      // First, try to get just the sets without the join
      const { data: setsData, error: setsError } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (setsError) {
        console.error('Error loading sets:', setsError);
        throw setsError;
      }

      if (!setsData || setsData.length === 0) {
        return [];
      }

      // Then, get flashcards for each set separately to avoid RLS recursion
      const setsWithCards = await Promise.all(
        setsData.map(async (set) => {
          const { data: cardsData } = await supabase
            .from('flashcards')
            .select('*')
            .eq('set_id', set.id)
            .order('position', { ascending: true });

          return {
            ...set,
            flashcards: cardsData || []
          };
        })
      );

      const data = setsWithCards;
      const error = null;

      if (error) throw error;

      return data?.map(set => ({
        id: set.id,
        name: set.title || set.name || 'Untitled Set',
        title: set.title || 'Untitled Set',
        flashcards: set.flashcards?.map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
        })) || [],
        config: set.config || {},
        createdAt: new Date(set.created_at),
      } as FlashcardSet)) || [];
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      // Fallback to localStorage on error
      return this.loadFromLocalStorage();
    }
  }

  private static async saveToSupabase(sets: FlashcardSet[], userId: string): Promise<void> {
    try {
      // This is a bulk operation - in a real app you'd optimize this
      for (const set of sets) {
        await this.updateInSupabase(set, userId);
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      // Fallback to localStorage on error
      this.saveToLocalStorage(sets);
    }
  }

  private static async createInSupabase(set: FlashcardSet, userId: string): Promise<FlashcardSet> {
    try {
      // Create the set
      const { data: setData, error: setError } = await supabase
        .from('flashcard_sets')
        .insert({
          id: set.id,
          user_id: userId,
          title: set.name || set.title || 'Untitled Set',
          description: (set as any).prompt || '',
          config: set.config || {},
        })
        .select()
        .single();

      if (setError) throw setError;

      // Create the flashcards
      if (set.flashcards && set.flashcards.length > 0) {
        const cardsToInsert = set.flashcards.map((card, index) => ({
          id: card.id,
          set_id: set.id,
          question: card.question,
          answer: card.answer,
          position: index,
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      return set;
    } catch (error) {
      console.error('Error creating in Supabase:', error);
      // Fallback to localStorage
      const sets = this.loadFromLocalStorage();
      sets.push(set);
      this.saveToLocalStorage(sets);
      return set;
    }
  }

  private static async updateInSupabase(set: FlashcardSet, userId: string): Promise<FlashcardSet> {
    try {
      // Update the set
      const { error: setError } = await supabase
        .from('flashcard_sets')
        .upsert({
          id: set.id,
          user_id: userId,
          title: set.name || set.title || 'Untitled Set',
          description: (set as any).prompt || '',
          config: set.config || {},
        });

      if (setError) throw setError;

      // Delete existing flashcards and re-insert
      const { error: deleteError } = await supabase
        .from('flashcards')
        .delete()
        .eq('set_id', set.id);

      if (deleteError) throw deleteError;

      // Insert new flashcards
      if (set.flashcards && set.flashcards.length > 0) {
        const cardsToInsert = set.flashcards.map((card, index) => ({
          id: card.id,
          set_id: set.id,
          question: card.question,
          answer: card.answer,
          position: index,
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      return set;
    } catch (error) {
      console.error('Error updating in Supabase:', error);
      // Fallback to localStorage
      const sets = this.loadFromLocalStorage();
      const index = sets.findIndex(s => s.id === set.id);
      if (index !== -1) {
        sets[index] = set;
        this.saveToLocalStorage(sets);
      }
      return set;
    }
  }

  private static async deleteFromSupabase(setId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting from Supabase:', error);
      // Fallback to localStorage
      const sets = this.loadFromLocalStorage();
      const filtered = sets.filter(s => s.id !== setId);
      this.saveToLocalStorage(filtered);
    }
  }

  // === LocalStorage Methods ===
  private static loadFromLocalStorage(): FlashcardSet[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sets = JSON.parse(stored);
      return Array.isArray(sets) ? sets : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  private static saveToLocalStorage(sets: FlashcardSet[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sets));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // === Migration Methods ===
  static async migrateLocalToSupabase(): Promise<{ migrated: number; errors: string[] }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { migrated: 0, errors: ['User not authenticated'] };
    }

    const localSets = this.loadFromLocalStorage();
    if (localSets.length === 0) {
      return { migrated: 0, errors: [] };
    }

    let migrated = 0;
    const errors: string[] = [];

    for (const set of localSets) {
      try {
        await this.createInSupabase(set, user.id);
        migrated++;
      } catch (error) {
        errors.push(`Failed to migrate set "${set.name}": ${error}`);
      }
    }

    if (migrated > 0) {
      // Clear localStorage after successful migration
      localStorage.removeItem(this.STORAGE_KEY);
    }

    return { migrated, errors };
  }
}