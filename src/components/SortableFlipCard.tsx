import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { EditableFlipCard } from './EditableFlipCard';
import { cn } from '@/lib/utils';

interface SortableFlipCardProps {
  id: string;
  question: string;
  answer: string;
  flipAxis?: 'X' | 'Y';
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
  backgroundImageOpacity?: number;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateContent: (id: string, question: string, answer: string) => void;
}

export function SortableFlipCard(props: SortableFlipCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 'auto',
  };

  const dragHandleElement = (
    <div
      {...attributes}
      {...listeners}
      className={cn(
        'p-1.5 rounded-md',
        'bg-background/80 backdrop-blur-sm border shadow-sm',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        'cursor-grab active:cursor-grabbing',
        'hover:bg-accent'
      )}
    >
      <GripVertical className='h-4 w-4 text-muted-foreground' />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-50 pointer-events-none'
      )}
    >
      {/* Flashcard with drag handle passed as prop */}
      <EditableFlipCard
        {...props}
        className='min-h-[200px]'
        dragHandle={dragHandleElement}
      />
    </div>
  );
}
