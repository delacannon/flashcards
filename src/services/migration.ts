import { FlashcardService } from './flashcards';
import type { FlashcardSet } from '../types';

export class MigrationService {
  static async migrateFromLocalStorage(userId: string): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const localData = localStorage.getItem('flashcardSets');
      
      if (!localData) {
        return { migrated: 0, errors: [] };
      }

      const localSets: FlashcardSet[] = JSON.parse(localData);
      
      if (!Array.isArray(localSets) || localSets.length === 0) {
        return { migrated: 0, errors: [] };
      }

      for (const set of localSets) {
        try {
          const setToMigrate = {
            title: set.title || set.name || 'Untitled Set',
            prompt: set.prompt || '',
            numberOfCards: set.numberOfCards || set.flashcards?.length || set.cards?.length || 0,
            cards: set.cards || set.flashcards || [],
            config: set.config || { flipAxis: 'Y' },
          };

          const { error } = await FlashcardService.createSet(userId, setToMigrate);
          
          if (error) {
            errors.push(`Failed to migrate set "${setToMigrate.title}": ${error.message}`);
          } else {
            migrated++;
          }
        } catch (error) {
          errors.push(`Failed to migrate set: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (migrated > 0) {
        const backupKey = `flashcardSets_backup_${Date.now()}`;
        localStorage.setItem(backupKey, localData);
        
        localStorage.removeItem('flashcardSets');
        
        console.log(`Backed up local data to ${backupKey}`);
      }

    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { migrated, errors };
  }

  static async checkForLocalData(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('flashcardSets');
      if (!localData) return false;
      
      const sets = JSON.parse(localData);
      return Array.isArray(sets) && sets.length > 0;
    } catch {
      return false;
    }
  }

  static getLocalDataCount(): number {
    try {
      const localData = localStorage.getItem('flashcardSets');
      if (!localData) return 0;
      
      const sets = JSON.parse(localData);
      return Array.isArray(sets) ? sets.length : 0;
    } catch {
      return 0;
    }
  }

  static backupLocalData(): string | null {
    try {
      const localData = localStorage.getItem('flashcardSets');
      if (!localData) return null;
      
      const backupKey = `flashcardSets_backup_${Date.now()}`;
      localStorage.setItem(backupKey, localData);
      
      return backupKey;
    } catch {
      return null;
    }
  }

  static restoreFromBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) return false;
      
      localStorage.setItem('flashcardSets', backupData);
      return true;
    } catch {
      return false;
    }
  }

  static listBackups(): string[] {
    const backups: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flashcardSets_backup_')) {
        backups.push(key);
      }
    }
    
    return backups.sort().reverse();
  }

  static deleteBackup(backupKey: string): boolean {
    try {
      localStorage.removeItem(backupKey);
      return true;
    } catch {
      return false;
    }
  }
}