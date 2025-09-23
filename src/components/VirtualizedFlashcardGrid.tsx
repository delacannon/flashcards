import { useRef, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { SortableFlipCard } from '@/components/SortableFlipCard';
import { getPatternById } from '@/lib/patterns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';
import type { Flashcard, FlashcardSetConfig } from '@/types';

interface VirtualizedFlashcardGridProps {
  flashcards: Flashcard[];
  config: FlashcardSetConfig;
  searchQuery?: string;
  onCreateFlashcard: () => void;
  onEditFlashcard: (flashcard: Flashcard) => void;
  onDeleteFlashcard: (flashcardId: string) => void;
  onUpdateFlashcardContent: (id: string, question: string, answer: string) => void;
  onReorder: (newFlashcards: Flashcard[]) => void;
}

export function VirtualizedFlashcardGrid({
  flashcards,
  config,
  searchQuery,
  onCreateFlashcard,
  onEditFlashcard,
  onDeleteFlashcard,
  onUpdateFlashcardContent,
  onReorder,
}: VirtualizedFlashcardGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(flashcards);
  
  // Sync local flashcards when props change (but not during drag)
  useEffect(() => {
    if (!activeId) {
      setLocalFlashcards(flashcards);
    }
  }, [flashcards, activeId]);
  
  // Add the "Add Card" to the items for virtualization
  const allItems = useMemo(() => [...localFlashcards, { id: 'add-new', isAddCard: true }], [localFlashcards]);
  
  // Calculate number of rows
  const rowCount = Math.ceil(allItems.length / columns);
  
  // Update columns based on window size
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);
  
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
    
    if (over && active.id !== over.id && over.id !== 'add-new') {
      const oldIndex = localFlashcards.findIndex((fc) => fc.id === active.id);
      const newIndex = localFlashcards.findIndex((fc) => fc.id === over.id);
      
      const newFlashcards = arrayMove(localFlashcards, oldIndex, newIndex);
      setLocalFlashcards(newFlashcards);
      
      // Notify parent of the reorder
      setTimeout(() => {
        onReorder(newFlashcards);
      }, 0);
    }
    setActiveId(null);
  };
  
  const activeFlashcard = activeId
    ? localFlashcards.find((fc) => fc.id === activeId)
    : null;
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // Estimated height of each row including gap
    overscan: 1,
  });
  
  // Helper function to check if card should be auto-flipped
  const shouldAutoFlip = (flashcard: Flashcard): boolean => {
    if (!searchQuery || !searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase().trim();
    const questionHasMatch = flashcard.question.toLowerCase().includes(query);
    const answerHasMatch = flashcard.answer.toLowerCase().includes(query);
    
    // Auto-flip if match is ONLY in the answer
    return !questionHasMatch && answerHasMatch;
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <SortableContext
        items={allItems.map((item: any) => item.id)}
        strategy={rectSortingStrategy}
      >
        <div
          ref={parentRef}
          className="h-full overflow-auto pr-4"
          style={{
            contain: 'strict',
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * columns;
              const endIndex = Math.min(startIndex + columns, allItems.length);
              const rowItems = allItems.slice(startIndex, endIndex);
              
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 pb-4">
                    {rowItems.map((item: any) => {
                      // Check if this is the "Add Card" card
                      if (item.isAddCard) {
                        return (
                          <Card
                            key="add-new"
                            className="min-h-[200px] cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-muted-foreground/25 bg-transparent"
                            onClick={onCreateFlashcard}
                          >
                            <CardContent className="flex h-full min-h-[200px] items-center justify-center p-4">
                              <div className="flex flex-col items-center gap-2">
                                <div className="rounded-full bg-primary/10 p-3">
                                  <Plus className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">Add Card</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      const flashcard = item as Flashcard;
                      
                      return (
                        <SortableFlipCard
                          key={flashcard.id}
                          id={flashcard.id}
                          question={flashcard.question}
                          answer={flashcard.answer}
                          flipAxis={config?.flipAxis || 'Y'}
                          autoFlip={shouldAutoFlip(flashcard)}
                          questionBgColor={config?.questionBgColor}
                          questionFgColor={config?.questionFgColor}
                          questionFontSize={config?.questionFontSize}
                          questionFontFamily={config?.questionFontFamily}
                          questionBackgroundPattern={config?.questionBackgroundPattern}
                          answerBgColor={config?.answerBgColor}
                          answerFgColor={config?.answerFgColor}
                          answerFontSize={config?.answerFontSize}
                          answerFontFamily={config?.answerFontFamily}
                          answerBackgroundPattern={config?.answerBackgroundPattern}
                          questionBackgroundImage={config?.questionBackgroundImage}
                          questionBackgroundImageOpacity={config?.questionBackgroundImageOpacity}
                          answerBackgroundImage={config?.answerBackgroundImage}
                          answerBackgroundImageOpacity={config?.answerBackgroundImageOpacity}
                          backgroundImage={config?.backgroundImage}
                          backgroundImageOpacity={config?.backgroundImageOpacity}
                          questionBorderStyle={config?.questionBorderStyle}
                          questionBorderWidth={config?.questionBorderWidth}
                          questionBorderColor={config?.questionBorderColor}
                          answerBorderStyle={config?.answerBorderStyle}
                          answerBorderWidth={config?.answerBorderWidth}
                          answerBorderColor={config?.answerBorderColor}
                          onEdit={() => onEditFlashcard(flashcard)}
                          onDelete={() => onDeleteFlashcard(flashcard.id)}
                          onUpdateContent={onUpdateFlashcardContent}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeFlashcard ? (
          <div className="opacity-90 shadow-2xl rounded-xl">
            <div
              className="min-h-[200px] rounded-xl relative overflow-hidden"
              style={{
                borderStyle: config?.questionBorderStyle === 'none' ? 'none' : (config?.questionBorderStyle || 'solid'),
                borderWidth: config?.questionBorderStyle === 'none' ? '0' : (config?.questionBorderWidth || '1px'),
                borderColor: config?.questionBorderColor || '#e5e7eb',
                ...(config?.questionBackgroundPattern && config?.questionBackgroundPattern !== 'none'
                  ? getPatternById(config?.questionBackgroundPattern)?.getCSS(config?.questionBgColor || '#ffffff')
                  : { backgroundColor: config?.questionBgColor || '#ffffff' }),
              }}
            >
              {/* Background Image Layer */}
              {(config?.questionBackgroundImage || config?.backgroundImage) && (
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${config?.questionBackgroundImage || config?.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: config?.questionBackgroundImageOpacity ?? config?.backgroundImageOpacity ?? 0.3,
                  }}
                />
              )}
              {/* Content Layer */}
              <div 
                className="relative z-10 p-6 flex items-center justify-center min-h-[200px]"
                style={{
                  color: config?.questionFgColor || '#000000',
                  fontFamily: config?.questionFontFamily || 'inherit',
                }}
              >
                <div 
                  className="text-center w-full prose prose-sm max-w-none"
                  style={{
                    fontSize: config?.questionFontSize || '16px',
                    fontFamily: config?.questionFontFamily || 'inherit',
                    color: config?.questionFgColor || 'inherit',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkHighlight]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }) => (
                        <p className="m-0" style={{ fontFamily: 'inherit' }}>
                          {children}
                        </p>
                      ),
                      mark: ({ children }) => (
                        <mark className="bg-yellow-200 px-1 rounded">
                          {children}
                        </mark>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {activeFlashcard.question || 'Empty question'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}