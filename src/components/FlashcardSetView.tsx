import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Play, MoreVertical, Download, Upload, FileUp, Replace, ListPlus, LayoutGrid, Table as TableIcon, Search, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PlayMode } from '@/components/PlayMode';
import { aiService } from '@/services/ai';
import { aiServiceAuth } from '@/services/ai-auth';
// Using simplified Supabase auth context
import { useAuth } from '@/contexts/AuthContextSimple';
import { AuthModal } from '@/components/AuthModal';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceholderCardGrid, PlaceholderCard } from '@/components/ui/placeholder-card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FlashcardTableView } from '@/components/FlashcardTableView';
import { VirtualizedFlashcardGrid } from '@/components/VirtualizedFlashcardGrid';

import type { FlashcardSet, Flashcard, FlashcardSetConfig } from '@/types';
import { useFlashcardSet } from '@/hooks/useFlashcards';

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
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Use lazy loading if flashcards are not loaded
  const shouldUseLazyLoading = !set.flashcards;
  const { data: fullSet, isLoading: isLoadingSet, isFetching: isFetchingSet, error: loadError } = useFlashcardSet(
    shouldUseLazyLoading ? set.id : null
  );
  
  // Use the fully loaded set if available, otherwise use the original set
  const currentSet = fullSet || set;
  const flashcards = currentSet.flashcards || [];
  
  // Show skeleton only when actually loading data (not from cache)
  const showSkeleton = shouldUseLazyLoading && isLoadingSet && !fullSet;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hasStartedGeneration = useRef(false);
  const generatedCardsRef = useRef<Flashcard[]>([]);
  
  // Local state for optimistic updates
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(flashcards);
  
  // CSV Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Flashcard[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync local flashcards when flashcards change
  useEffect(() => {
    setLocalFlashcards(flashcards);
  }, [flashcards]);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Filter flashcards based on search query
  const filteredFlashcards = useMemo(() => {
    if (!searchQuery.trim()) return localFlashcards;
    
    const query = searchQuery.toLowerCase().trim();
    return localFlashcards.filter(card => 
      card.question.toLowerCase().includes(query) ||
      card.answer.toLowerCase().includes(query)
    );
  }, [localFlashcards, searchQuery]);

  // Generate AI flashcards if prompt is provided and set is empty
  useEffect(() => {
    const generateCards = async () => {
      // Check if we should generate cards (only once per set with AI prompt)
      if (
        currentSet.config.aiPrompt && 
        flashcards.length === 0 && 
        !hasStartedGeneration.current &&
        !isGenerating &&
        !isLoadingSet && // Don't generate while still loading the set
        !showSkeleton // Don't generate while showing placeholder cards
      ) {
        // Check if user is authenticated
        if (!user) {
          console.log('AI generation requested but user not authenticated');
          setShowAuthModal(true);
          return;
        }

        hasStartedGeneration.current = true;
        setIsGenerating(true);
        setGenerationError(null);
        setGenerationProgress(0);
        generatedCardsRef.current = [];
        
        try {
          const cardCount = parseInt((currentSet.config as any).cardCount) || parseInt((currentSet.config as any).configCardCount) || 5;
          const needsTitle = !currentSet.name || currentSet.name === 'Untitled Set';
          
          // Generate title and flashcards
          const result = await aiService.generateFlashcardsWithTitle(
            currentSet.config.aiPrompt,
            cardCount,
            needsTitle,
            (card, index) => {
              const newCard: Flashcard = {
                id: uuidv4(),
                question: card.question,
                answer: card.answer,
              };
              generatedCardsRef.current.push(newCard);
              
              // Update the set with all generated cards so far (avoiding duplicates)
              const updatedSet = {
                ...currentSet,
                flashcards: [...generatedCardsRef.current],
              };
              onUpdateSet(updatedSet);
              
              setGenerationProgress((index + 1) / cardCount);
            }
          );
          
          // Update title if generated
          if (result.title && needsTitle) {
            const finalSet = {
              ...currentSet,
              name: result.title,
              flashcards: generatedCardsRef.current,
            };
            onUpdateSet(finalSet);
          }
        } catch (error) {
          console.error('Failed to generate flashcards:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards';
          
          // Check if it's an authentication error
          if (errorMessage.includes('AUTHENTICATION_REQUIRED')) {
            setShowAuthModal(true);
          } else {
            setGenerationError(errorMessage);
          }
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    generateCards();
  }, [currentSet.id, flashcards.length, currentSet.config.aiPrompt, isGenerating, isLoadingSet, showSkeleton]); // Dependencies for AI generation


  const handleEditFlashcard = useCallback((flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setQuestion(flashcard.question);
    setAnswer(flashcard.answer);
    setIsEditing(true);
  }, []);

  const handleCreateFlashcard = useCallback(() => {
    setQuestion('');
    setAnswer('');
    setIsCreating(true);
  }, []);

  const handlePlayMode = useCallback(() => {
    // Play filtered flashcards if search is active, otherwise all cards
    const cardsToPlay = searchQuery ? filteredFlashcards : localFlashcards;
    if (cardsToPlay.length > 0) {
      setIsPlaying(true);
    }
  }, [localFlashcards, filteredFlashcards, searchQuery]);

  const handleExitPlay = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleSaveFlashcard = () => {
    if (isCreating) {
      const newFlashcard: Flashcard = {
        id: uuidv4(),
        question,
        answer,
      };
      const newFlashcards = [...localFlashcards, newFlashcard];
      setLocalFlashcards(newFlashcards);
      const updatedSet = {
        ...currentSet,
        flashcards: newFlashcards,
      };
      onUpdateSet(updatedSet);
      setIsCreating(false);
    } else if (isEditing && selectedFlashcard) {
      const updatedFlashcards = localFlashcards.map((fc) =>
        fc.id === selectedFlashcard.id ? { ...fc, question, answer } : fc
      );
      setLocalFlashcards(updatedFlashcards);
      const updatedSet = {
        ...currentSet,
        flashcards: updatedFlashcards,
      };
      onUpdateSet(updatedSet);
      setIsEditing(false);
    }
    setQuestion('');
    setAnswer('');
    setSelectedFlashcard(null);
  };

  const handleUpdateFlashcardContent = useCallback((
    id: string,
    newQuestion: string,
    newAnswer: string
  ) => {
    const updatedFlashcards = localFlashcards.map((fc) =>
      fc.id === id ? { ...fc, question: newQuestion, answer: newAnswer } : fc
    );
    setLocalFlashcards(updatedFlashcards);
    const updatedSet = {
      ...currentSet,
      flashcards: updatedFlashcards,
    };
    onUpdateSet(updatedSet);
  }, [localFlashcards, currentSet, onUpdateSet]);

  const handleDeleteFlashcard = useCallback((flashcardId: string) => {
    const flashcard = localFlashcards.find((fc) => fc.id === flashcardId);
    if (flashcard) {
      setFlashcardToDelete(flashcard);
      setDeleteConfirmOpen(true);
    }
  }, [localFlashcards]);

  const confirmDeleteFlashcard = () => {
    if (flashcardToDelete) {
      const updatedFlashcards = localFlashcards.filter(
        (fc) => fc.id !== flashcardToDelete.id
      );
      setLocalFlashcards(updatedFlashcards);
      const updatedSet = {
        ...currentSet,
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

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsCreating(false);
    setQuestion('');
    setAnswer('');
    setSelectedFlashcard(null);
  }, []);

  const handleDownloadCSV = () => {
    // Prepare CSV content
    const csvHeaders = ['Question', 'Answer'];
    const csvRows = localFlashcards.map(card => {
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
        id: uuidv4(),
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
      updatedFlashcards = [...localFlashcards, ...importPreview];
    }
    
    setLocalFlashcards(updatedFlashcards);
    const updatedSet = {
      ...currentSet,
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
    // Play filtered flashcards if search is active, otherwise all cards
    const cardsToPlay = searchQuery ? filteredFlashcards : localFlashcards;
    return <PlayMode set={{ ...currentSet, flashcards: cardsToPlay }} onExit={handleExitPlay} />;
  }

  // Show skeleton cards when lazy loading the set
  if (showSkeleton) {
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
          <h1 className='text-2xl font-bold flex-1'>{currentSet.title || currentSet.name}</h1>
          <div className='flex items-center gap-3'>
            {/* Show only Play and Actions buttons during loading - disabled */}
            <Button
              variant='outline'
              size='sm'
              disabled={true}
              className='flex items-center gap-2 opacity-50'
            >
              <Play className='h-4 w-4' />
              Play
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={true}
                  className='flex items-center gap-2 opacity-50'
                >
                  <MoreVertical className='h-4 w-4' />
                  Actions
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </div>
        <div className='flex-1 overflow-y-auto px-4 pb-4'>
          {set.cardCount && set.cardCount > 0 ? (
            /* Use placeholder cards that match real card dimensions and styles */
            <PlaceholderCardGrid 
              count={set.cardCount}
              config={currentSet.config}
            />
          ) : (
            /* Show single placeholder card if no count available */
            <div className='flex items-center justify-center h-full'>
              <div className='w-[300px]'>
                <PlaceholderCard 
                  bgColor={currentSet.config?.questionBgColor}
                  borderStyle={currentSet.config?.questionBorderStyle}
                  borderWidth={currentSet.config?.questionBorderWidth}
                  borderColor={currentSet.config?.questionBorderColor}
                  backgroundImage={currentSet.config?.questionBackgroundImage || currentSet.config?.backgroundImage}
                  backgroundImageOpacity={currentSet.config?.questionBackgroundImageOpacity ?? currentSet.config?.backgroundImageOpacity}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state if loading failed
  if (loadError) {
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
          <h1 className='text-2xl font-bold flex-1'>{currentSet.title || currentSet.name}</h1>
        </div>
        <div className='flex-1 px-4 pb-4 flex items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <AlertCircle className='h-8 w-8 text-red-500' />
            <p className='text-muted-foreground text-center'>
              Failed to load flashcards.<br />
              <Button variant='link' onClick={() => window.location.reload()}>
                Try again
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
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
        <h1 className='text-2xl font-bold flex-1'>{currentSet.name}</h1>
        <div className='flex items-center gap-3'>
          {/* View Mode Toggle */}
          {localFlashcards.length > 0 && (
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'cards' | 'table')}>
              <ToggleGroupItem value="cards" aria-label="Card view">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cards
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          
          {localFlashcards.length > 0 && (
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
            {localFlashcards.length}{' '}
            {localFlashcards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      {localFlashcards.length > 0 && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search cards by question or answer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-80"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredFlashcards.length} of {localFlashcards.length} cards
            </p>
          )}
        </div>
      )}

      <div
        className='flex flex-1 flex-col gap-4 p-4'
        style={{
          backgroundColor: '#fafafa',
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Table View */}
        {viewMode === 'table' ? (
          <FlashcardTableView
            flashcards={filteredFlashcards}
            config={currentSet.config}
            onUpdateFlashcards={(updatedFlashcards) => {
              setLocalFlashcards(updatedFlashcards);
              const updatedSet = {
                ...currentSet,
                flashcards: updatedFlashcards,
              };
              onUpdateSet(updatedSet);
            }}
            onDeleteFlashcard={handleDeleteFlashcard}
          />
        ) : (
          <>
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

        {/* Show skeleton cards while generating */}
        {isGenerating && localFlashcards.length === 0 && (
          <div className='grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: 3 }).map((_, index) => (
              <PlaceholderCard 
                key={`placeholder-gen-${index}`}
                bgColor={currentSet.config?.questionBgColor}
                borderStyle={currentSet.config?.questionBorderStyle}
                borderWidth={currentSet.config?.questionBorderWidth}
                borderColor={currentSet.config?.questionBorderColor}
                backgroundImage={currentSet.config?.questionBackgroundImage || currentSet.config?.backgroundImage}
                backgroundImageOpacity={currentSet.config?.questionBackgroundImageOpacity ?? currentSet.config?.backgroundImageOpacity}
              />
            ))}
          </div>
        )}
        
        {/* Show empty state when search has no results */}
        {searchQuery && filteredFlashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No cards found</h3>
            <p className="text-muted-foreground text-center">
              No cards match "{searchQuery}".<br />
              Try a different search term.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="mt-4"
            >
              Clear search
            </Button>
          </div>
        ) : (
        /* Use virtualized grid when not generating */
        !isGenerating || localFlashcards.length > 0 ? (
          <VirtualizedFlashcardGrid
            flashcards={filteredFlashcards}
            config={currentSet.config}
            searchQuery={searchQuery}
            onCreateFlashcard={handleCreateFlashcard}
            onEditFlashcard={handleEditFlashcard}
            onDeleteFlashcard={handleDeleteFlashcard}
            onUpdateFlashcardContent={handleUpdateFlashcardContent}
            onReorder={(newFlashcards) => {
              // When reordering filtered results, we need to update the full list
              const updatedFullList = [...localFlashcards];
              newFlashcards.forEach(card => {
                const originalIndex = updatedFullList.findIndex(c => c.id === card.id);
                if (originalIndex !== -1) {
                  updatedFullList[originalIndex] = card;
                }
              });
              setLocalFlashcards(updatedFullList);
              const updatedSet = {
                ...currentSet,
                flashcards: updatedFullList,
              };
              onUpdateSet(updatedSet);
            }}
          />
        ) : null
        )}
        </>
        )}
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
                autoFocus={false}
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
                autoFocus={false}
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
                    Add imported cards to your current {localFlashcards.length} card{localFlashcards.length === 1 ? '' : 's'}
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

      {/* Auth Modal for AI Features */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        message="Sign in to use AI-powered flashcard generation"
      />
    </div>
  );
}
