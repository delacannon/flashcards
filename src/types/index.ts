// Core domain types
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface FlashcardSetConfig {
  flipAxis: 'X' | 'Y';
  cardTheme?: 'default' | 'dark' | 'blue' | 'green';
  questionBgColor?: string;
  questionFgColor?: string;
  questionFontSize?: string;
  questionFontFamily?: string;
  questionBackgroundPattern?: string;
  answerBgColor?: string;
  answerFgColor?: string;
  answerFontSize?: string;
  answerFontFamily?: string;
  answerBackgroundPattern?: string;
  backgroundImage?: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  flashcards: Flashcard[];
  config: FlashcardSetConfig;
  createdAt: Date;
  updatedAt?: Date;
}

// Action types for state management
export type FlashcardSetAction =
  | { type: 'CREATE_SET'; payload: Omit<FlashcardSet, 'id' | 'createdAt'> }
  | { type: 'UPDATE_SET'; payload: { id: string; changes: Partial<FlashcardSet> } }
  | { type: 'DELETE_SET'; payload: string }
  | { type: 'DUPLICATE_SET'; payload: string }
  | { type: 'LOAD_SETS'; payload: FlashcardSet[] };

export type FlashcardAction =
  | { type: 'CREATE_CARD'; payload: { setId: string; card: Omit<Flashcard, 'id'> } }
  | { type: 'UPDATE_CARD'; payload: { setId: string; cardId: string; changes: Partial<Flashcard> } }
  | { type: 'DELETE_CARD'; payload: { setId: string; cardId: string } }
  | { type: 'REORDER_CARDS'; payload: { setId: string; from: number; to: number } };

// UI state types
export interface PlayModeState {
  currentIndex: number;
  isFlipped: boolean;
  direction: 'left' | 'right';
}

export interface EditorState {
  isEditing: boolean;
  editingCardId: string | null;
}

// Component prop types
export interface FlashcardStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  backgroundPattern?: string;
}

export interface DragHandleProps {
  attributes?: any;
  listeners?: any;
}

// Service types
export interface StorageService {
  saveSets(sets: FlashcardSet[]): Promise<void>;
  loadSets(): Promise<FlashcardSet[]>;
  clearSets(): Promise<void>;
}

export interface MarkdownService {
  toHtml(markdown: string): string;
  toMarkdown(html: string): string;
  processHighlights(text: string): string;
}

// Form data types
export interface CreateSetData {
  name: string;
  config: FlashcardSetConfig;
}

export interface CreateCardData {
  question: string;
  answer: string;
}