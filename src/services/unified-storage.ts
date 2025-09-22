import { supabase } from '../lib/supabase';
import type { FlashcardSet, Flashcard } from '../types';

// Unified storage service that handles both Supabase and localStorage
export class UnifiedStorageService {
  private static STORAGE_KEY = 'flashcardSets';
  private static loadingPromise: Promise<FlashcardSet[]> | null = null;
  private static lastLoadTime = 0;
  private static CACHE_DURATION = 1000; // 1 second cache to prevent rapid re-fetches
  private static cachedSets: FlashcardSet[] | null = null;
  private static cachedUser: any = null;
  private static userCacheTime = 0;
  private static USER_CACHE_DURATION = 60000; // Cache user for 1 minute

  // Check if user is authenticated (with caching to avoid repeated calls)
  static async getCurrentUser() {
    const now = Date.now();
    
    // Return cached user if still valid
    if (this.cachedUser && (now - this.userCacheTime) < this.USER_CACHE_DURATION) {
      return this.cachedUser;
    }
    
    // Fetch and cache the user
    const { data: { user } } = await supabase.auth.getUser();
    this.cachedUser = user;
    this.userCacheTime = now;
    return user;
  }

  // Get stats counts (total sets and total cards)
  static async getStatsCounts(): Promise<{ totalSets: number; totalCards: number }> {
    const user = await this.getCurrentUser();

    if (user) {
      try {
        // First try to use cached data if available and recent
        const now = Date.now();
        if (this.cachedSets && (now - this.lastLoadTime) < this.CACHE_DURATION) {
          return {
            totalSets: this.cachedSets.length,
            totalCards: this.cachedSets.reduce((sum, set) => sum + (set.cardCount ?? set.flashcards?.length ?? 0), 0),
          };
        }

        // Use a single aggregated query to get both counts efficiently
        const { data: stats, error: statsError } = await supabase
          .rpc('get_user_stats', { user_id_param: user.id });

        if (statsError) {
          console.error('Error fetching stats with RPC:', statsError);
          
          // Fallback to optimized queries - single query for sets count, join for cards count
          // Fallback to simple separate queries for counting
          const { count: setsCount, error: setsError } = await supabase
            .from('flashcard_sets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (setsError) {
            console.error('Error fetching sets count:', setsError);
            throw setsError;
          }

          // Get user sets to get their IDs for cards count
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
        }

        // If RPC worked, use its result
        if (stats && stats.length > 0) {
          return {
            totalSets: stats[0].total_sets || 0,
            totalCards: stats[0].total_cards || 0,
          };
        }

        // Fallback if no stats returned
        return { totalSets: 0, totalCards: 0 };
      } catch (error) {
        console.error('Error fetching stats counts:', error);
        // Fallback to counting loaded data
        const sets = await this.loadSets();
        return {
          totalSets: sets.length,
          totalCards: sets.reduce((sum, set) => sum + (set.cardCount ?? set.flashcards?.length ?? 0), 0),
        };
      }
    } else {
      // For localStorage, count the stored data
      const sets = this.loadFromLocalStorage();
      return {
        totalSets: sets.length,
        totalCards: sets.reduce((sum, set) => sum + (set.cardCount ?? set.flashcards?.length ?? 0), 0),
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
    // Invalidate cache when creating
    this.invalidateCache();
    
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
    // Invalidate cache when updating
    this.invalidateCache();
    
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
    // Invalidate cache when deleting
    this.invalidateCache();
    
    const user = await this.getCurrentUser();

    if (user) {
      await this.deleteFromSupabase(setId);
    } else {
      const sets = this.loadFromLocalStorage();
      const filtered = sets.filter(s => s.id !== setId);
      this.saveToLocalStorage(filtered);
    }
  }

  // Helper method to invalidate cache
  private static invalidateCache(): void {
    this.cachedSets = null;
    this.lastLoadTime = 0;
  }

  // Load a specific set with all its flashcards (for lazy loading)
  static async loadSetWithCards(setId: string): Promise<FlashcardSet | null> {
    const user = await this.getCurrentUser();

    if (user) {
      return this.loadSetWithCardsFromSupabase(setId, user.id);
    } else {
      return this.loadSetWithCardsFromLocalStorage(setId);
    }
  }
  
  // Invalidate user cache (call this on logout)
  static invalidateUserCache(): void {
    this.cachedUser = null;
    this.userCacheTime = 0;
    this.invalidateCache(); // Also clear data cache
  }

  // === Supabase Methods ===
  private static async loadFromSupabase(userId: string): Promise<FlashcardSet[]> {
    try {
      // Try to use the view with card counts first (most efficient)
      const { data: setsData, error: setsError } = await supabase
        .from('flashcard_sets_with_counts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (setsError) {
        console.error('Error loading sets from view, falling back to manual count:', setsError);
        
        // Fallback to the old method if view doesn't exist
        const { data: fallbackSetsData, error: fallbackError } = await supabase
          .from('flashcard_sets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Error loading sets:', fallbackError);
          throw fallbackError;
        }

        if (!fallbackSetsData || fallbackSetsData.length === 0) {
          return [];
        }

        // Manual counting as fallback (less efficient)
        const setIds = fallbackSetsData.map(set => set.id);
        const { data: cardCounts, error: countError } = await supabase
          .from('flashcards')
          .select('set_id')
          .in('set_id', setIds);

        if (countError) {
          console.error('Error loading card counts:', countError);
        }

        const countsBySetId = (cardCounts || []).reduce((acc, card) => {
          acc[card.set_id] = (acc[card.set_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return fallbackSetsData.map(set => ({
          id: set.id,
          name: set.title || 'Untitled Set', // 'name' doesn't exist in DB, use title
          title: set.title || 'Untitled Set',
          cardCount: countsBySetId[set.id] || 0,
          flashcards: undefined,
          config: set.config || {},
          createdAt: new Date(set.created_at),
        } as FlashcardSet));
      }

      if (!setsData || setsData.length === 0) {
        return [];
      }

      // Using the view - card_count is already included!
      return setsData.map(set => ({
        id: set.id,
        name: set.title || 'Untitled Set', // 'name' doesn't exist in DB, use title
        title: set.title || 'Untitled Set',
        cardCount: set.card_count || 0, // card_count comes from the view
        // Don't load flashcards for lazy loading - they'll be loaded on demand
        flashcards: undefined,
        config: set.config || {},
        createdAt: new Date(set.created_at),
      } as FlashcardSet));
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

  // Load specific set with cards from Supabase
  private static async loadSetWithCardsFromSupabase(setId: string, userId: string): Promise<FlashcardSet | null> {
    try {
      // Get the set
      const { data: setData, error: setError } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('id', setId)
        .eq('user_id', userId)
        .single();

      if (setError || !setData) {
        console.error('Error loading set:', setError);
        return null;
      }

      // Get all flashcards for this set
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .order('position', { ascending: true });

      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        // Return set without cards rather than failing
      }

      return {
        id: setData.id,
        name: setData.title || 'Untitled Set', // 'name' doesn't exist in DB, use title
        title: setData.title || 'Untitled Set',
        cardCount: (cardsData || []).length,
        flashcards: (cardsData || []).map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
        })),
        config: setData.config || {},
        createdAt: new Date(setData.created_at),
      } as FlashcardSet;
    } catch (error) {
      console.error('Error loading set with cards from Supabase:', error);
      return null;
    }
  }

  // Load specific set with cards from localStorage
  private static loadSetWithCardsFromLocalStorage(setId: string): FlashcardSet | null {
    try {
      const sets = this.loadFromLocalStorage();
      const set = sets.find(s => s.id === setId);
      if (set) {
        // Ensure cardCount is set for consistency
        return {
          ...set,
          cardCount: set.flashcards?.length || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading set with cards from localStorage:', error);
      return null;
    }
  }

  // === LocalStorage Methods ===
  private static loadFromLocalStorage(): FlashcardSet[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sets = JSON.parse(stored);
      // Ensure localStorage sets have cardCount for consistency
      return Array.isArray(sets) ? sets.map(set => ({
        ...set,
        cardCount: set.flashcards?.length || 0,
      })) : [];
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