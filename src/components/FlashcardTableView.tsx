import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, GripVertical, Plus, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';
import type { Flashcard, FlashcardSetConfig } from '@/types';
import { cn } from '@/lib/utils';

interface FlashcardTableViewProps {
  flashcards: Flashcard[];
  config?: FlashcardSetConfig;
  onUpdateFlashcards: (flashcards: Flashcard[]) => void;
  onDeleteFlashcard: (flashcardId: string) => void;
}

interface SortableRowProps {
  flashcard: Flashcard;
  index: number;
  isEditing: boolean;
  editingCell: 'question' | 'answer' | null;
  tempValue: string;
  onStartEdit: (flashcardId: string, field: 'question' | 'answer', value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTempValueChange: (value: string) => void;
  onDeleteFlashcard: (flashcardId: string) => void;
  onDuplicateFlashcard: (flashcard: Flashcard) => void;
  config?: FlashcardSetConfig;
}

function SortableRow({
  flashcard,
  index,
  isEditing,
  editingCell,
  tempValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTempValueChange,
  onDeleteFlashcard,
  onDuplicateFlashcard,
  config,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flashcard.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const renderCell = (field: 'question' | 'answer', value: string) => {
    if (isEditing && editingCell === field) {
      return (
        <Textarea
          value={tempValue}
          onChange={(e) => onTempValueChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-y"
          autoFocus
        />
      );
    }

    return (
      <div
        className="cursor-pointer min-h-[40px] p-2 rounded hover:bg-muted/50 transition-colors"
        onClick={() => onStartEdit(flashcard.id, field, value)}
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkHighlight]}
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ children }) => <p className="m-0">{children}</p>,
              mark: ({ children }) => (
                <mark className="bg-yellow-200 px-1 rounded">{children}</mark>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
            }}
          >
            {value || '*Empty*'}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group",
        isDragging && "opacity-50"
      )}
    >
      <TableCell className="w-[40px] p-2">
        <div className="flex items-center gap-1">
          <button
            className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">{index + 1}</span>
        </div>
      </TableCell>
      <TableCell className="w-[45%]">
        {renderCell('question', flashcard.question)}
      </TableCell>
      <TableCell className="w-[45%]">
        {renderCell('answer', flashcard.answer)}
      </TableCell>
      <TableCell className="w-[10%] p-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onDuplicateFlashcard(flashcard)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDeleteFlashcard(flashcard.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function FlashcardTableView({
  flashcards,
  config,
  onUpdateFlashcards,
  onDeleteFlashcard,
}: FlashcardTableViewProps) {
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(flashcards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<'question' | 'answer' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync with parent flashcards when they change
  useEffect(() => {
    if (!activeId && !editingId) {
      setLocalFlashcards(flashcards);
    }
  }, [flashcards, activeId, editingId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localFlashcards.findIndex((fc) => fc.id === active.id);
      const newIndex = localFlashcards.findIndex((fc) => fc.id === over.id);

      const newFlashcards = arrayMove(localFlashcards, oldIndex, newIndex);
      setLocalFlashcards(newFlashcards);
      onUpdateFlashcards(newFlashcards);
    }
    setActiveId(null);
  };

  const handleStartEdit = (flashcardId: string, field: 'question' | 'answer', value: string) => {
    setEditingId(flashcardId);
    setEditingCell(field);
    setTempValue(value);
  };

  const handleSaveEdit = () => {
    if (editingId && editingCell) {
      const updatedFlashcards = localFlashcards.map((fc) =>
        fc.id === editingId ? { ...fc, [editingCell]: tempValue } : fc
      );
      setLocalFlashcards(updatedFlashcards);
      onUpdateFlashcards(updatedFlashcards);
    }
    setEditingId(null);
    setEditingCell(null);
    setTempValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingCell(null);
    setTempValue('');
  };

  const handleAddFlashcard = () => {
    const newFlashcard: Flashcard = {
      id: uuidv4(),
      question: 'New Question',
      answer: 'New Answer',
    };
    const newFlashcards = [...localFlashcards, newFlashcard];
    setLocalFlashcards(newFlashcards);
    onUpdateFlashcards(newFlashcards);
    
    // Start editing the new card immediately
    setTimeout(() => {
      handleStartEdit(newFlashcard.id, 'question', newFlashcard.question);
    }, 100);
  };

  const handleDuplicateFlashcard = (flashcard: Flashcard) => {
    const duplicatedFlashcard: Flashcard = {
      ...flashcard,
      id: uuidv4(),
    };
    const index = localFlashcards.findIndex(fc => fc.id === flashcard.id);
    const newFlashcards = [
      ...localFlashcards.slice(0, index + 1),
      duplicatedFlashcard,
      ...localFlashcards.slice(index + 1),
    ];
    setLocalFlashcards(newFlashcards);
    onUpdateFlashcards(newFlashcards);
  };

  const activeFlashcard = activeId
    ? localFlashcards.find((fc) => fc.id === activeId)
    : null;

  // Table header styles based on config
  const headerStyle = {
    backgroundColor: config?.questionBgColor || '#f9fafb',
    color: config?.questionFgColor || '#111827',
    fontFamily: config?.questionFontFamily || 'Inter',
  };

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" style={headerStyle}>#</TableHead>
              <TableHead className="w-[45%]" style={headerStyle}>Question</TableHead>
              <TableHead className="w-[45%]" style={headerStyle}>Answer</TableHead>
              <TableHead className="w-[10%]" style={headerStyle}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={localFlashcards.map((fc) => fc.id)}
              strategy={verticalListSortingStrategy}
            >
              {localFlashcards.map((flashcard, index) => (
                <SortableRow
                  key={flashcard.id}
                  flashcard={flashcard}
                  index={index}
                  isEditing={editingId === flashcard.id}
                  editingCell={editingId === flashcard.id ? editingCell : null}
                  tempValue={editingId === flashcard.id ? tempValue : ''}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onTempValueChange={setTempValue}
                  onDeleteFlashcard={onDeleteFlashcard}
                  onDuplicateFlashcard={handleDuplicateFlashcard}
                  config={config}
                />
              ))}
            </SortableContext>
            <TableRow>
              <TableCell colSpan={4} className="text-center p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddFlashcard}
                  className="w-full max-w-[200px] mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Card
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <DragOverlay>
          {activeFlashcard ? (
            <div className="bg-background rounded-lg shadow-lg p-4 opacity-90">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Question:</p>
                  <p className="text-sm">{activeFlashcard.question}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Answer:</p>
                  <p className="text-sm">{activeFlashcard.answer}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}