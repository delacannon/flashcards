import { useState, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Play, MoreVertical, Download, Upload, FileUp, Replace, ListPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { SortableFlipCard } from '@/components/SortableFlipCard';
import { PlayMode } from '@/components/PlayMode';
import { aiService } from '@/services/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  aiPrompt?: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  flashcards: Flashcard[];
  config: FlashcardSetConfig;
  createdAt: Date;
}

interface FlashcardSetViewProps {
  set: FlashcardSet;
  onBack: () => void;
  onUpdateSet: (updatedSet: FlashcardSet) => void;
}

export function FlashcardSetView({
  set,
  onBack,
  onUpdateSet,
}: FlashcardSetViewProps) {
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hasStartedGeneration = useRef(false);
  const generatedCardsRef = useRef<Flashcard[]>([]);
  
  // CSV Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Flashcard[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');

  // Generate AI flashcards if prompt is provided and set is empty
  useEffect(() => {
    const generateCards = async () => {
      // Check if we should generate cards (only once per set with AI prompt)
      if (
        set.config.aiPrompt && 
        set.flashcards.length === 0 && 
        !hasStartedGeneration.current &&
        !isGenerating
      ) {
        hasStartedGeneration.current = true;
        setIsGenerating(true);
        setGenerationError(null);
        setGenerationProgress(0);
        generatedCardsRef.current = [];
        
        try {
          const cardCount = parseInt((set.config as any).cardCount) || parseInt((set.config as any).configCardCount) || 5;
          const needsTitle = !set.name || set.name === 'Untitled Set';
          
          // Generate title and flashcards
          const result = await aiService.generateFlashcardsWithTitle(
            set.config.aiPrompt,
            cardCount,
            needsTitle,
            (card, index) => {
              const newCard: Flashcard = {
                id: `${Date.now()}_${index}_${Math.random()}`,
                question: card.question,
                answer: card.answer,
              };
              generatedCardsRef.current.push(newCard);
              
              // Update the set with all generated cards so far (avoiding duplicates)
              const updatedSet = {
                ...set,
                flashcards: [...generatedCardsRef.current],
              };
              onUpdateSet(updatedSet);
              
              setGenerationProgress((index + 1) / cardCount);
            }
          );
          
          // Update title if generated
          if (result.title && needsTitle) {
            const finalSet = {
              ...set,
              name: result.title,
              flashcards: generatedCardsRef.current,
            };
            onUpdateSet(finalSet);
          }
        } catch (error) {
          console.error('Failed to generate flashcards:', error);
          setGenerationError(error instanceof Error ? error.message : 'Failed to generate flashcards');
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    generateCards();
  }, [set.id]); // Only depend on set.id to prevent re-runs

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
      const oldIndex = set.flashcards.findIndex((fc) => fc.id === active.id);
      const newIndex = set.flashcards.findIndex((fc) => fc.id === over.id);

      const newFlashcards = arrayMove(set.flashcards, oldIndex, newIndex);
      const updatedSet = {
        ...set,
        flashcards: newFlashcards,
      };
      onUpdateSet(updatedSet);
    }
    setActiveId(null);
  };

  const activeFlashcard = activeId
    ? set.flashcards.find((fc) => fc.id === activeId)
    : null;

  const handleEditFlashcard = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setQuestion(flashcard.question);
    setAnswer(flashcard.answer);
    setIsEditing(true);
  };

  const handleCreateFlashcard = () => {
    setQuestion('');
    setAnswer('');
    setIsCreating(true);
  };

  const handlePlayMode = () => {
    if (set.flashcards.length > 0) {
      setIsPlaying(true);
    }
  };

  const handleExitPlay = () => {
    setIsPlaying(false);
  };

  const handleSaveFlashcard = () => {
    if (isCreating) {
      const newFlashcard: Flashcard = {
        id: Date.now().toString(),
        question,
        answer,
      };
      const updatedSet = {
        ...set,
        flashcards: [...set.flashcards, newFlashcard],
      };
      onUpdateSet(updatedSet);
      setIsCreating(false);
    } else if (isEditing && selectedFlashcard) {
      const updatedFlashcards = set.flashcards.map((fc) =>
        fc.id === selectedFlashcard.id ? { ...fc, question, answer } : fc
      );
      const updatedSet = {
        ...set,
        flashcards: updatedFlashcards,
      };
      onUpdateSet(updatedSet);
      setIsEditing(false);
    }
    setQuestion('');
    setAnswer('');
    setSelectedFlashcard(null);
  };

  const handleUpdateFlashcardContent = (
    id: string,
    newQuestion: string,
    newAnswer: string
  ) => {
    const updatedFlashcards = set.flashcards.map((fc) =>
      fc.id === id ? { ...fc, question: newQuestion, answer: newAnswer } : fc
    );
    const updatedSet = {
      ...set,
      flashcards: updatedFlashcards,
    };
    onUpdateSet(updatedSet);
  };

  const handleDeleteFlashcard = (flashcardId: string) => {
    const flashcard = set.flashcards.find((fc) => fc.id === flashcardId);
    if (flashcard) {
      setFlashcardToDelete(flashcard);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteFlashcard = () => {
    if (flashcardToDelete) {
      const updatedFlashcards = set.flashcards.filter(
        (fc) => fc.id !== flashcardToDelete.id
      );
      const updatedSet = {
        ...set,
        flashcards: updatedFlashcards,
      };
      onUpdateSet(updatedSet);
    }
    setDeleteConfirmOpen(false);
    setFlashcardToDelete(null);
  };

  const cancelDeleteFlashcard = () => {
    setDeleteConfirmOpen(false);
    setFlashcardToDelete(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setQuestion('');
    setAnswer('');
    setSelectedFlashcard(null);
  };

  const handleDownloadCSV = () => {
    // Prepare CSV content
    const csvHeaders = ['Question', 'Answer'];
    const csvRows = set.flashcards.map(card => {
      // Escape values for CSV (handle quotes, commas, newlines)
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          // Escape quotes by doubling them and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      
      return [escapeCSV(card.question), escapeCSV(card.answer)];
    });
    
    // Combine headers and rows
    const csvContent = [
      csvHeaders,
      ...csvRows
    ].map(row => row.join(',')).join('\n');
    
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create safe filename
    const safeName = set.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeName}_flashcards.csv`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Flashcard[] => {
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    
    // Split into lines and filter empty ones
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Parse CSV handling quotes and commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote mode
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add last field
      result.push(current.trim());
      return result;
    };
    
    // Check if first line is header
    const firstLine = parseCSVLine(lines[0]);
    let dataStartIndex = 0;
    let questionIndex = 0;
    let answerIndex = 1;
    
    // Check for headers (case-insensitive)
    const hasHeaders = firstLine.some(cell => 
      /question|answer|front|back|q|a/i.test(cell)
    );
    
    if (hasHeaders) {
      dataStartIndex = 1;
      // Find column indices
      questionIndex = firstLine.findIndex(cell => 
        /question|front|q/i.test(cell)
      );
      answerIndex = firstLine.findIndex(cell => 
        /answer|back|a/i.test(cell)
      );
      
      // Default to first two columns if headers not recognized
      if (questionIndex === -1) questionIndex = 0;
      if (answerIndex === -1) answerIndex = 1;
    }
    
    // Parse data rows
    const flashcards: Flashcard[] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      
      // Skip if row doesn't have enough columns
      if (row.length <= Math.max(questionIndex, answerIndex)) continue;
      
      const question = row[questionIndex]?.trim();
      const answer = row[answerIndex]?.trim();
      
      // Skip empty cards
      if (!question || !answer) continue;
      
      flashcards.push({
        id: `imported_${Date.now()}_${i}_${Math.random()}`,
        question,
        answer,
      });
    }
    
    return flashcards;
  };

  const handleUploadCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedCards = parseCSV(text);
      
      if (importedCards.length === 0) {
        alert('No valid flashcards found in the CSV file. Please check the format.');
        return;
      }
      
      setImportPreview(importedCards);
      setImportDialogOpen(true);
    } catch (error) {
      console.error('Error reading CSV file:', error);
      alert('Error reading the CSV file. Please ensure it\'s a valid CSV file.');
    }
    
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const handleImportConfirm = () => {
    let updatedFlashcards: Flashcard[];
    
    if (importMode === 'replace') {
      updatedFlashcards = importPreview;
    } else {
      updatedFlashcards = [...set.flashcards, ...importPreview];
    }
    
    const updatedSet = {
      ...set,
      flashcards: updatedFlashcards,
    };
    
    onUpdateSet(updatedSet);
    setImportDialogOpen(false);
    setImportPreview([]);
  };

  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setImportPreview([]);
  };

  if (isPlaying) {
    return <PlayMode set={set} onExit={handleExitPlay} />;
  }

  return (
    <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
      <div className='flex items-center gap-4 px-4 pt-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onBack}
          className='shrink-0'
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl font-bold flex-1'>{set.name}</h1>
        <div className='flex items-center gap-3'>
          {set.flashcards.length > 0 && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePlayMode}
                className='flex items-center gap-2'
              >
                <Play className='h-4 w-4' />
                Play
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                  >
                    <MoreVertical className='h-4 w-4' />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleDownloadCSV}>
                    <Download className='mr-2 h-4 w-4' />
                    Download as CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleUploadCSV}>
                    <Upload className='mr-2 h-4 w-4' />
                    Upload CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <span className='text-sm text-muted-foreground'>
            {set.flashcards.length}{' '}
            {set.flashcards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
      </div>

      <div
        className='flex flex-1 flex-col gap-4 p-4'
        style={{
          backgroundColor: '#fafafa',
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* AI Generation Progress */}
        {isGenerating && (
          <div className='mb-4 p-4 bg-background rounded-lg border'>
            <div className='flex items-center gap-2 mb-2'>
              <Sparkles className='h-4 w-4 text-primary animate-pulse' />
              <span className='text-sm font-medium'>
                Generating flashcards with AI...
              </span>
            </div>
            <Progress value={generationProgress * 100} className='mb-2' />
            <p className='text-xs text-muted-foreground'>
              {Math.round(generationProgress * 100)}% complete
            </p>
          </div>
        )}

        {/* Error Message */}
        {generationError && (
          <div className='mb-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-start gap-2'>
            <AlertCircle className='h-4 w-4 mt-0.5 shrink-0' />
            <div className='text-sm'>
              <p className='font-medium mb-1'>Generation failed</p>
              <p className='text-xs'>{generationError}</p>
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext
            items={set.flashcards.map((fc) => fc.id)}
            strategy={rectSortingStrategy}
          >
            <div className='grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4'>
              {/* Show skeleton cards while generating */}
              {isGenerating && set.flashcards.length === 0 && (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={`skeleton-${index}`} className='h-[200px] rounded-lg' />
                  ))}
                </>
              )}
              
              {set.flashcards.map((flashcard) => (
                <SortableFlipCard
                  key={flashcard.id}
                  id={flashcard.id}
                  question={flashcard.question}
                  answer={flashcard.answer}
                  flipAxis={set.config?.flipAxis || 'Y'}
                  questionBgColor={set.config?.questionBgColor}
                  questionFgColor={set.config?.questionFgColor}
                  questionFontSize={set.config?.questionFontSize}
                  questionFontFamily={set.config?.questionFontFamily}
                  questionBackgroundPattern={
                    set.config?.questionBackgroundPattern
                  }
                  answerBgColor={set.config?.answerBgColor}
                  answerFgColor={set.config?.answerFgColor}
                  answerFontSize={set.config?.answerFontSize}
                  answerFontFamily={set.config?.answerFontFamily}
                  answerBackgroundPattern={set.config?.answerBackgroundPattern}
                  backgroundImage={set.config?.backgroundImage}
                  backgroundImageOpacity={set.config?.backgroundImageOpacity}
                  onEdit={() => handleEditFlashcard(flashcard)}
                  onDelete={() => handleDeleteFlashcard(flashcard.id)}
                  onUpdateContent={handleUpdateFlashcardContent}
                />
              ))}

              <Card
                className='min-h-[200px] cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-muted-foreground/25 bg-transparent'
                onClick={handleCreateFlashcard}
              >
                <CardContent className='flex h-full min-h-[200px] items-center justify-center p-4'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='rounded-full bg-primary/10 p-3'>
                      <Plus className='h-6 w-6 text-primary' />
                    </div>
                    <p className='text-sm text-muted-foreground'>Add Card</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SortableContext>
          <DragOverlay>
            {activeFlashcard ? (
              <div className='opacity-90 shadow-2xl rounded-xl'>
                <Card className='min-h-[200px] bg-background border-2'>
                  <CardContent className='p-6'>
                    <div className='text-center'>
                      <p className='font-medium mb-2'>Question</p>
                      <p className='text-sm'>{activeFlashcard.question}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog
        open={isEditing || isCreating}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <DialogContent className='sm:max-w-[525px]' noOverlay>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New Flashcard' : 'Edit Flashcard'}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <label htmlFor='question' className='text-sm font-medium'>
                Question
              </label>
              <Textarea
                id='question'
                placeholder='Enter the question...'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className='min-h-[80px]'
              />
            </div>
            <div className='grid gap-2'>
              <label htmlFor='answer' className='text-sm font-medium'>
                Answer
              </label>
              <Textarea
                id='answer'
                placeholder='Enter the answer...'
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className='min-h-[80px]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSaveFlashcard}>
              {isCreating ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent noOverlay>
          <DialogHeader>
            <DialogTitle>Delete Flashcard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flashcard?
            </DialogDescription>
          </DialogHeader>
          {flashcardToDelete && (
            <div className='space-y-2 py-2'>
              <div className='rounded-lg border bg-muted/50 p-3'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Question:
                </p>
                <p className='text-sm'>{flashcardToDelete.question}</p>
              </div>
              <div className='rounded-lg border bg-muted/50 p-3'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Answer:
                </p>
                <p className='text-sm'>{flashcardToDelete.answer}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={cancelDeleteFlashcard}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDeleteFlashcard}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FileUp className='h-5 w-5' />
              Import Flashcards from CSV
            </DialogTitle>
            <DialogDescription>
              Found {importPreview.length} flashcard{importPreview.length === 1 ? '' : 's'} in the uploaded file.
              Choose how to import them:
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4 py-4'>
            {/* Import mode selection */}
            <div className='space-y-3'>
              <div 
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  importMode === 'append' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setImportMode('append')}
              >
                <ListPlus className='h-5 w-5 mt-0.5 text-muted-foreground' />
                <div className='flex-1'>
                  <div className='font-medium'>Append to existing cards</div>
                  <div className='text-sm text-muted-foreground'>
                    Add imported cards to your current {set.flashcards.length} card{set.flashcards.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              
              <div 
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  importMode === 'replace' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setImportMode('replace')}
              >
                <Replace className='h-5 w-5 mt-0.5 text-muted-foreground' />
                <div className='flex-1'>
                  <div className='font-medium'>Replace all cards</div>
                  <div className='text-sm text-muted-foreground'>
                    Remove all existing cards and use only imported ones
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview of first few cards */}
            {importPreview.length > 0 && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground'>
                  Preview (showing first {Math.min(3, importPreview.length)} cards):
                </div>
                <div className='space-y-2 max-h-[200px] overflow-y-auto'>
                  {importPreview.slice(0, 3).map((card, index) => (
                    <div key={index} className='p-3 rounded-lg border bg-muted/30'>
                      <div className='text-sm'>
                        <span className='font-medium'>Q:</span> {card.question.substring(0, 100)}
                        {card.question.length > 100 && '...'}
                      </div>
                      <div className='text-sm mt-1'>
                        <span className='font-medium'>A:</span> {card.answer.substring(0, 100)}
                        {card.answer.length > 100 && '...'}
                      </div>
                    </div>
                  ))}
                  {importPreview.length > 3 && (
                    <div className='text-sm text-muted-foreground text-center py-2'>
                      ... and {importPreview.length - 3} more card{importPreview.length - 3 === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant='outline' onClick={handleImportCancel}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm}>
              {importMode === 'replace' ? 'Replace' : 'Append'} {importPreview.length} Card{importPreview.length === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type='file'
        accept='.csv,text/csv'
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
