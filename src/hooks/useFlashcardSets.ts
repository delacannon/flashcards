import { useState, useCallback, useMemo } from 'react';
import { useFlashcardContext } from '@/contexts/FlashcardContext';
import type { FlashcardSet } from '@/types';

export function useFlashcardSets() {
  const { sets, selectedSet, loading, error, actions } = useFlashcardContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'cards'>('date');

  const filteredSets = useMemo(() => {
    let filtered = sets;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(set =>
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.flashcards.some(card =>
          card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'cards':
          return b.flashcards.length - a.flashcards.length;
        default:
          return 0;
      }
    });
  }, [sets, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    totalSets: sets.length,
    totalCards: sets.reduce((sum, set) => sum + set.flashcards.length, 0),
    averageCardsPerSet: sets.length > 0
      ? Math.round(sets.reduce((sum, set) => sum + set.flashcards.length, 0) / sets.length)
      : 0,
  }), [sets]);

  const createSetWithDefaults = useCallback((name: string) => {
    const defaultConfig = {
      flipAxis: 'Y' as const,
      cardTheme: 'default' as const,
      questionBgColor: '#ffffff',
      questionFgColor: '#000000',
      questionFontSize: '16px',
      questionFontFamily: 'Inter',
      questionBackgroundPattern: 'none',
      answerBgColor: '#f3f4f6',
      answerFgColor: '#000000',
      answerFontSize: '16px',
      answerFontFamily: 'Inter',
      answerBackgroundPattern: 'none',
    };
    actions.createSet(name, defaultConfig);
  }, [actions]);

  return {
    // Data
    sets: filteredSets,
    selectedSet,
    loading,
    error,
    stats,
    
    // Filters
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    
    // Actions
    createSet: createSetWithDefaults,
    updateSet: actions.updateSet,
    deleteSet: actions.deleteSet,
    duplicateSet: actions.duplicateSet,
    selectSet: actions.selectSet,
  };
}