import { useRef, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy, Play, Plus } from 'lucide-react';
import { getPatternById } from '@/lib/patterns';
import type { FlashcardSet } from '@/types';

interface VirtualizedCardGridProps {
  flashcardSets: FlashcardSet[];
  onSetClick: (set: FlashcardSet) => void;
  onPlaySet: (e: React.MouseEvent, set: FlashcardSet) => void;
  onEditSetName: (e: React.MouseEvent, setId: string) => void;
  onDuplicateSet: (e: React.MouseEvent, setId: string) => void;
  onDeleteSet: (e: React.MouseEvent, setId: string) => void;
  onAddSet: () => void;
}

export function VirtualizedCardGrid({
  flashcardSets,
  onSetClick,
  onPlaySet,
  onEditSetName,
  onDuplicateSet,
  onDeleteSet,
  onAddSet,
}: VirtualizedCardGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  
  // Add the "Add Set" card to the items
  const allItems = useMemo(() => [...flashcardSets, { id: 'add-new', isAddCard: true }], [flashcardSets]);
  
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
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Estimated height of each row including gap
    overscan: 1, // Render 1 extra row above and below viewport
  });
  
  return (
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
                  // Check if this is the "Add Set" card
                  if (item.isAddCard) {
                    return (
                      <Card
                        key="add-new"
                        className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-muted-foreground/25 bg-transparent min-h-[180px]"
                        onClick={onAddSet}
                      >
                        <CardContent className="flex h-full items-center justify-center p-4 min-h-[180px]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-3">
                              <Plus className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Add Set</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  const set = item as FlashcardSet;
                  
                  // Get the configuration styles for the card
                  const bgColor = set.config?.questionBgColor || '#ffffff';
                  const fgColor = set.config?.questionFgColor || '#000000';
                  const fontFamily = set.config?.questionFontFamily || 'Inter';
                  const fontSize = set.config?.questionFontSize || '16px';
                  const pattern = set.config?.questionBackgroundPattern;
                  const borderStyle = set.config?.questionBorderStyle || 'solid';
                  const borderWidth = set.config?.questionBorderWidth || '1px';
                  const borderColor = set.config?.questionBorderColor || '#e5e7eb';
                  const backgroundImage = set.config?.questionBackgroundImage;
                  const backgroundImageOpacity = set.config?.questionBackgroundImageOpacity || 0.3;
                  
                  // Get pattern styles if a pattern is selected
                  const patternStyles = pattern && pattern !== 'none' 
                    ? getPatternById(pattern)?.getCSS(bgColor) 
                    : { backgroundColor: bgColor };
                  
                  return (
                    <Card
                      key={set.id}
                      className="relative group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden min-h-[180px]"
                      style={{
                        borderStyle: borderStyle === 'none' ? 'solid' : borderStyle,
                        borderWidth: borderStyle === 'none' ? '1px' : borderWidth,
                        borderColor: borderColor,
                        ...patternStyles,
                      }}
                      onClick={() => onSetClick(set)}
                    >
                      {/* Background Image Layer */}
                      {backgroundImage && (
                        <div
                          className="absolute inset-0 z-0 pointer-events-none"
                          style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: backgroundImageOpacity,
                          }}
                        />
                      )}
                      
                      {/* Title at the top */}
                      <div className="relative z-10 p-4">
                        <h3 
                          className="text-lg font-semibold" 
                          style={{ 
                            color: fgColor,
                            fontFamily: fontFamily,
                            fontSize: fontSize
                          }}
                        >
                          {set.name}
                        </h3>
                      </div>
                      
                      {/* Action buttons - bottom right */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20 bg-background/80 backdrop-blur-sm rounded-md p-1">
                        {(set.cardCount ?? set.flashcards?.length ?? 0) > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-background/90"
                            onClick={(e) => onPlaySet(e, set)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-background/90"
                          onClick={(e) => onEditSetName(e, set.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-background/90"
                          onClick={(e) => onDuplicateSet(e, set.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-background/90"
                          onClick={(e) => onDeleteSet(e, set.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Card info - bottom left */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <p 
                          className="text-sm" 
                          style={{ 
                            color: fgColor, 
                            opacity: 0.8,
                            fontFamily: fontFamily 
                          }}>
                          {set.cardCount ?? set.flashcards?.length ?? 0}{' '}
                          {(set.cardCount ?? set.flashcards?.length ?? 0) === 1
                            ? 'card'
                            : 'cards'}
                        </p>
                        <p 
                          className="text-xs mt-1" 
                          style={{ 
                            color: fgColor, 
                            opacity: 0.6,
                            fontFamily: fontFamily
                          }}
                        >
                          Created {set.createdAt ? new Date(set.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}