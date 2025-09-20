import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FlashcardSet, FlashcardSetAction, FlashcardAction } from '@/types';
import { storageService } from '@/services/storage.service';

interface FlashcardContextValue {
  sets: FlashcardSet[];
  selectedSet: FlashcardSet | null;
  loading: boolean;
  error: string | null;
  actions: {
    createSet: (name: string, config?: Partial<FlashcardSet['config']>) => void;
    updateSet: (id: string, changes: Partial<FlashcardSet>) => void;
    deleteSet: (id: string) => void;
    duplicateSet: (id: string) => void;
    selectSet: (set: FlashcardSet | null) => void;
    createCard: (setId: string, question: string, answer: string) => void;
    updateCard: (setId: string, cardId: string, question: string, answer: string) => void;
    deleteCard: (setId: string, cardId: string) => void;
    reorderCards: (setId: string, from: number, to: number) => void;
  };
}

const FlashcardContext = createContext<FlashcardContextValue | undefined>(undefined);

interface State {
  sets: FlashcardSet[];
  selectedSet: FlashcardSet | null;
  loading: boolean;
  error: string | null;
}

type Action = FlashcardSetAction | FlashcardAction | 
  { type: 'SELECT_SET'; payload: FlashcardSet | null } |
  { type: 'SET_LOADING'; payload: boolean } |
  { type: 'SET_ERROR'; payload: string | null };

function flashcardReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_SETS':
      return {
        ...state,
        sets: action.payload,
        loading: false,
      };

    case 'CREATE_SET': {
      const newSet: FlashcardSet = {
        id: uuidv4(),
        name: action.payload.name,
        flashcards: [],
        config: action.payload.config || { flipAxis: 'Y', cardTheme: 'default' },
        createdAt: new Date(),
      };
      return {
        ...state,
        sets: [...state.sets, newSet],
      };
    }

    case 'UPDATE_SET': {
      const sets = state.sets.map(set =>
        set.id === action.payload.id
          ? { ...set, ...action.payload.changes, updatedAt: new Date() }
          : set
      );
      return {
        ...state,
        sets,
        selectedSet: state.selectedSet?.id === action.payload.id
          ? sets.find(s => s.id === action.payload.id) || null
          : state.selectedSet,
      };
    }

    case 'DELETE_SET':
      return {
        ...state,
        sets: state.sets.filter(set => set.id !== action.payload),
        selectedSet: state.selectedSet?.id === action.payload ? null : state.selectedSet,
      };

    case 'DUPLICATE_SET': {
      const original = state.sets.find(set => set.id === action.payload);
      if (!original) return state;
      
      const duplicate: FlashcardSet = {
        ...original,
        id: uuidv4(),
        name: `${original.name} (Copy)`,
        createdAt: new Date(),
      };
      return {
        ...state,
        sets: [...state.sets, duplicate],
      };
    }

    case 'SELECT_SET':
      return {
        ...state,
        selectedSet: action.payload,
      };

    case 'CREATE_CARD': {
      const sets = state.sets.map(set => {
        if (set.id === action.payload.setId) {
          const newCard = {
            id: uuidv4(),
            question: action.payload.card.question,
            answer: action.payload.card.answer,
          };
          return {
            ...set,
            flashcards: [...set.flashcards, newCard],
            updatedAt: new Date(),
          };
        }
        return set;
      });
      return {
        ...state,
        sets,
        selectedSet: state.selectedSet?.id === action.payload.setId
          ? sets.find(s => s.id === action.payload.setId) || null
          : state.selectedSet,
      };
    }

    case 'UPDATE_CARD': {
      const sets = state.sets.map(set => {
        if (set.id === action.payload.setId) {
          return {
            ...set,
            flashcards: set.flashcards.map(card =>
              card.id === action.payload.cardId
                ? { ...card, ...action.payload.changes }
                : card
            ),
            updatedAt: new Date(),
          };
        }
        return set;
      });
      return {
        ...state,
        sets,
        selectedSet: state.selectedSet?.id === action.payload.setId
          ? sets.find(s => s.id === action.payload.setId) || null
          : state.selectedSet,
      };
    }

    case 'DELETE_CARD': {
      const sets = state.sets.map(set => {
        if (set.id === action.payload.setId) {
          return {
            ...set,
            flashcards: set.flashcards.filter(card => card.id !== action.payload.cardId),
            updatedAt: new Date(),
          };
        }
        return set;
      });
      return {
        ...state,
        sets,
        selectedSet: state.selectedSet?.id === action.payload.setId
          ? sets.find(s => s.id === action.payload.setId) || null
          : state.selectedSet,
      };
    }

    case 'REORDER_CARDS': {
      const sets = state.sets.map(set => {
        if (set.id === action.payload.setId) {
          const cards = [...set.flashcards];
          const [movedCard] = cards.splice(action.payload.from, 1);
          cards.splice(action.payload.to, 0, movedCard);
          return {
            ...set,
            flashcards: cards,
            updatedAt: new Date(),
          };
        }
        return set;
      });
      return {
        ...state,
        sets,
        selectedSet: state.selectedSet?.id === action.payload.setId
          ? sets.find(s => s.id === action.payload.setId) || null
          : state.selectedSet,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
}

export function FlashcardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flashcardReducer, {
    sets: [],
    selectedSet: null,
    loading: true,
    error: null,
  });

  // Load sets from storage on mount
  useEffect(() => {
    const loadSets = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const sets = await storageService.loadSets();
        dispatch({ type: 'LOAD_SETS', payload: sets });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load flashcard sets' });
      }
    };
    loadSets();
  }, []);

  // Save sets to storage whenever they change
  useEffect(() => {
    if (!state.loading) {
      storageService.saveSets(state.sets);
    }
  }, [state.sets, state.loading]);

  const actions = {
    createSet: useCallback((name: string, config?: Partial<FlashcardSet['config']>) => {
      dispatch({ type: 'CREATE_SET', payload: { name, flashcards: [], config: config || { flipAxis: 'Y' } } });
    }, []),

    updateSet: useCallback((id: string, changes: Partial<FlashcardSet>) => {
      dispatch({ type: 'UPDATE_SET', payload: { id, changes } });
    }, []),

    deleteSet: useCallback((id: string) => {
      dispatch({ type: 'DELETE_SET', payload: id });
    }, []),

    duplicateSet: useCallback((id: string) => {
      dispatch({ type: 'DUPLICATE_SET', payload: id });
    }, []),

    selectSet: useCallback((set: FlashcardSet | null) => {
      dispatch({ type: 'SELECT_SET', payload: set });
    }, []),

    createCard: useCallback((setId: string, question: string, answer: string) => {
      dispatch({ type: 'CREATE_CARD', payload: { setId, card: { question, answer } } });
    }, []),

    updateCard: useCallback((setId: string, cardId: string, question: string, answer: string) => {
      dispatch({ type: 'UPDATE_CARD', payload: { setId, cardId, changes: { question, answer } } });
    }, []),

    deleteCard: useCallback((setId: string, cardId: string) => {
      dispatch({ type: 'DELETE_CARD', payload: { setId, cardId } });
    }, []),

    reorderCards: useCallback((setId: string, from: number, to: number) => {
      dispatch({ type: 'REORDER_CARDS', payload: { setId, from, to } });
    }, []),
  };

  const value: FlashcardContextValue = {
    sets: state.sets,
    selectedSet: state.selectedSet,
    loading: state.loading,
    error: state.error,
    actions,
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
}

export function useFlashcardContext() {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcardContext must be used within a FlashcardProvider');
  }
  return context;
}