import type { FlashcardSet, StorageService } from '@/types';

class LocalStorageService implements StorageService {
  private readonly STORAGE_KEY = 'flashcard_sets';
  private readonly STORAGE_VERSION = '1.0';

  async saveSets(sets: FlashcardSet[]): Promise<void> {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        sets: sets.map(set => ({
          ...set,
          createdAt: set.createdAt.toISOString(),
          updatedAt: set.updatedAt?.toISOString(),
        })),
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save flashcard sets:', error);
      throw new Error('Unable to save data to storage');
    }
  }

  async loadSets(): Promise<FlashcardSet[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        return [];
      }

      const data = JSON.parse(stored);
      
      // Handle version migrations if needed
      if (data.version !== this.STORAGE_VERSION) {
        return this.migrateData(data);
      }

      return data.sets.map((set: any) => ({
        ...set,
        createdAt: new Date(set.createdAt),
        updatedAt: set.updatedAt ? new Date(set.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load flashcard sets:', error);
      return [];
    }
  }

  async clearSets(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private migrateData(data: any): FlashcardSet[] {
    // Handle data migration from older versions
    console.log('Migrating data from version:', data.version);
    
    // For now, just return the sets as-is
    // In the future, add migration logic here
    return data.sets || [];
  }

  // Utility method to export data
  async exportData(): Promise<string> {
    const sets = await this.loadSets();
    return JSON.stringify(sets, null, 2);
  }

  // Utility method to import data
  async importData(jsonData: string): Promise<void> {
    try {
      const sets = JSON.parse(jsonData);
      await this.saveSets(sets);
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }
}

// Export singleton instance
export const storageService = new LocalStorageService();