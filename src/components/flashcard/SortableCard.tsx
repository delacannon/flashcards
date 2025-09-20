import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableFlashcard } from './EditableFlashcard';
import type { Flashcard, FlashcardStyles } from '@/types';

interface SortableCardProps {
  card: Flashcard;
  questionStyles?: FlashcardStyles;
  answerStyles?: FlashcardStyles;
  flipAxis?: 'X' | 'Y';
  onUpdate?: (question: string, answer: string) => void;
  onDelete?: () => void;
}

export const SortableCard = memo(function SortableCard({
  card,
  questionStyles,
  answerStyles,
  flipAxis,
  onUpdate,
  onDelete
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <EditableFlashcard
        card={card}
        questionStyles={questionStyles}
        answerStyles={answerStyles}
        flipAxis={flipAxis}
        onUpdate={onUpdate}
        onDelete={onDelete}
        sortable={{ attributes, listeners }}
      />
    </div>
  );
});