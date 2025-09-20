import React, { memo } from 'react';
import { Edit2, Trash2, GripVertical, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseSortableReturn } from '@dnd-kit/sortable';

interface DragHandleProps {
  sortable?: Pick<UseSortableReturn, 'attributes' | 'listeners'>;
  className?: string;
}

export const DragHandle = memo(function DragHandle({ 
  sortable, 
  className = '' 
}: DragHandleProps) {
  if (!sortable) return null;

  return (
    <div
      {...sortable.attributes}
      {...sortable.listeners}
      className={`cursor-grab active:cursor-grabbing p-1.5 rounded hover:bg-gray-100 transition-colors ${className}`}
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
});

interface CardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const CardActions = memo(function CardActions({
  onEdit,
  onDelete,
  isEditing = false,
  onSave,
  onCancel,
  className = ''
}: CardActionsProps) {
  if (isEditing) {
    return (
      <div className={`flex gap-1 ${className}`}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onSave}
          className="h-8 w-8"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {onEdit && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

interface PlayModeActionsProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  onReset: () => void;
  onShuffle: () => void;
}

export const PlayModeActions = memo(function PlayModeActions({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  onFlip,
  onReset,
  onShuffle
}: PlayModeActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          variant="outline"
        >
          Previous
        </Button>
        <Button onClick={onFlip} variant="default">
          Flip
        </Button>
        <Button
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
          variant="outline"
        >
          Next
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline">
          Reset
        </Button>
        <Button onClick={onShuffle} variant="outline">
          Shuffle
        </Button>
      </div>
    </div>
  );
});