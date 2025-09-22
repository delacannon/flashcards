import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Using simplified Supabase auth context (no database dependencies)
import { AuthProvider, useAuth } from '@/contexts/AuthContextSimple';
import { AuthModal } from '@/components/AuthModal';
import { AppSidebar } from '@/components/app-sidebar';
import type { FlashcardSet, Flashcard, FlashcardSetConfig } from '@/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Copy, Play } from 'lucide-react';
import {
  FlashcardSetView,
  type FlashcardSet,
  type FlashcardSetConfig,
} from '@/components/FlashcardSetView';
import { PlayMode } from '@/components/PlayMode';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DebouncedColorInput } from '@/components/ui/DebouncedColorInput';
import { PatternGallery } from '@/components/ui/PatternGallery';
import { getPatternById } from '@/lib/patterns';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { aiService } from '@/services/ai';
import { aiServiceAuth } from '@/services/ai-auth';
import { UnifiedStorageService } from '@/services/unified-storage';
import { useEffect } from 'react';

function MainApp() {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [playingSet, setPlayingSet] = useState<FlashcardSet | null>(null);

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const loadingRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  // Update AI service with current user
  useEffect(() => {
    aiServiceAuth.setUser(user as any);
  }, [user]);

  // Load flashcard sets on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      // Get current user ID
      const currentUserId = user?.id || null;
      
      // Skip if already loading
      if (loadingRef.current) {
        return;
      }
      
      // Skip if user ID hasn't changed (avoid re-loading for same user)
      if (hasLoadedInitialData && previousUserIdRef.current === currentUserId) {
        return;
      }
      
      loadingRef.current = true;
      previousUserIdRef.current = currentUserId;
      setIsLoadingData(true);
      
      try {
        const sets = await UnifiedStorageService.loadSets();
        setFlashcardSets(sets);
        setHasLoadedInitialData(true);

        // If user just logged in and has local data, offer to migrate
        if (user && localStorage.getItem('flashcardSets')) {
          const localSets = JSON.parse(localStorage.getItem('flashcardSets') || '[]');
          if (localSets.length > 0) {
            if (confirm(`You have ${localSets.length} flashcard sets saved locally. Would you like to sync them to the cloud?`)) {
              const result = await UnifiedStorageService.migrateLocalToSupabase();
              if (result.migrated > 0) {
                console.log(`Migrated ${result.migrated} sets to cloud`);
                // Reload to get the migrated sets
                const updatedSets = await UnifiedStorageService.loadSets();
                setFlashcardSets(updatedSets);
              }
              if (result.errors.length > 0) {
                console.error('Migration errors:', result.errors);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading flashcard sets:', error);
      } finally {
        setIsLoadingData(false);
        loadingRef.current = false;
      }
    };

    // Only load if not currently loading
    if (!loading) {
      loadData();
    }
  }, [user?.id, loading]); // Only depend on user.id and loading state
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [configFlipAxis, setConfigFlipAxis] = useState<'X' | 'Y'>('Y');
  const [configQuestionBgColor, setConfigQuestionBgColor] =
    useState<string>('#ffffff');
  const [configQuestionFgColor, setConfigQuestionFgColor] =
    useState<string>('#000000');
  const [configQuestionFontSize, setConfigQuestionFontSize] =
    useState<string>('16px');
  const [configQuestionFontFamily, setConfigQuestionFontFamily] =
    useState<string>('Inter');
  const [configAnswerBgColor, setConfigAnswerBgColor] =
    useState<string>('#f3f4f6');
  const [configAnswerFgColor, setConfigAnswerFgColor] =
    useState<string>('#000000');
  const [configAnswerFontSize, setConfigAnswerFontSize] =
    useState<string>('16px');
  const [configAnswerFontFamily, setConfigAnswerFontFamily] =
    useState<string>('Inter');
  const [configQuestionPattern, setConfigQuestionPattern] =
    useState<string>('none');
  const [configAnswerPattern, setConfigAnswerPattern] =
    useState<string>('none');
  const [configCardCount, setConfigCardCount] = useState<number>(5);
  const [configAiPrompt, setConfigAiPrompt] = useState<string>('');
  // Question side background image
  const [configQuestionBackgroundImage, setConfigQuestionBackgroundImage] =
    useState<string>('');
  const [
    configQuestionBackgroundImageOpacity,
    setConfigQuestionBackgroundImageOpacity,
  ] = useState<number>(0.3);
  // Answer side background image
  const [configAnswerBackgroundImage, setConfigAnswerBackgroundImage] =
    useState<string>('');
  const [
    configAnswerBackgroundImageOpacity,
    setConfigAnswerBackgroundImageOpacity,
  ] = useState<number>(0.3);
  // Question side border styles
  const [configQuestionBorderStyle, setConfigQuestionBorderStyle] = useState<string>('solid');
  const [configQuestionBorderWidth, setConfigQuestionBorderWidth] = useState<string>('1px');
  const [configQuestionBorderColor, setConfigQuestionBorderColor] = useState<string>('#e5e7eb');
  // Answer side border styles
  const [configAnswerBorderStyle, setConfigAnswerBorderStyle] = useState<string>('solid');
  const [configAnswerBorderWidth, setConfigAnswerBorderWidth] = useState<string>('1px');
  const [configAnswerBorderColor, setConfigAnswerBorderColor] = useState<string>('#e5e7eb');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);

  const handleSetClick = (set: FlashcardSet) => {
    setSelectedSet(set);
  };

  const handlePlaySet = (e: React.MouseEvent, set: FlashcardSet) => {
    e.stopPropagation();
    if (set.flashcards.length > 0) {
      setPlayingSet(set);
    }
  };

  const handleExitPlay = () => {
    setPlayingSet(null);
  };

  const handleEditSetName = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    const set = flashcardSets.find((s) => s.id === setId);
    if (set) {
      setEditingSetId(setId);
      setInputValue(set.name);
      setConfigFlipAxis(set.config?.flipAxis || 'Y');
      setConfigQuestionBgColor(set.config?.questionBgColor || '#ffffff');
      setConfigQuestionFgColor(set.config?.questionFgColor || '#000000');
      setConfigQuestionFontSize(set.config?.questionFontSize || '16px');
      setConfigQuestionFontFamily(set.config?.questionFontFamily || 'Inter');
      setConfigAnswerBgColor(set.config?.answerBgColor || '#f3f4f6');
      setConfigAnswerFgColor(set.config?.answerFgColor || '#000000');
      setConfigAnswerFontSize(set.config?.answerFontSize || '16px');
      setConfigAnswerFontFamily(set.config?.answerFontFamily || 'Inter');
      setConfigQuestionPattern(set.config?.questionBackgroundPattern || 'none');
      setConfigAnswerPattern(set.config?.answerBackgroundPattern || 'none');
      // Handle legacy background image - apply to both sides if exists
      if (set.config?.backgroundImage) {
        setConfigQuestionBackgroundImage(set.config.backgroundImage);
        setConfigAnswerBackgroundImage(set.config.backgroundImage);
        setConfigQuestionBackgroundImageOpacity(
          set.config.backgroundImageOpacity || 0.3
        );
        setConfigAnswerBackgroundImageOpacity(
          set.config.backgroundImageOpacity || 0.3
        );
      } else {
        setConfigQuestionBackgroundImage(
          set.config?.questionBackgroundImage || ''
        );
        setConfigAnswerBackgroundImage(set.config?.answerBackgroundImage || '');
        setConfigQuestionBackgroundImageOpacity(
          set.config?.questionBackgroundImageOpacity || 0.3
        );
        setConfigAnswerBackgroundImageOpacity(
          set.config?.answerBackgroundImageOpacity || 0.3
        );
      }
      // Set border styles
      setConfigQuestionBorderStyle(set.config?.questionBorderStyle || 'solid');
      setConfigQuestionBorderWidth(set.config?.questionBorderWidth || '1px');
      setConfigQuestionBorderColor(set.config?.questionBorderColor || '#e5e7eb');
      setConfigAnswerBorderStyle(set.config?.answerBorderStyle || 'solid');
      setConfigAnswerBorderWidth(set.config?.answerBorderWidth || '1px');
      setConfigAnswerBorderColor(set.config?.answerBorderColor || '#e5e7eb');
      setIsModalOpen(true);
      setIsCreatingSet(false);
    }
  };

  const handleDeleteSet = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    setSetToDelete(setId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSet = async () => {
    if (setToDelete) {
      // Delete from storage
      await UnifiedStorageService.deleteSet(setToDelete);
      
      setFlashcardSets(flashcardSets.filter((s) => s.id !== setToDelete));
      if (selectedSet?.id === setToDelete) {
        setSelectedSet(null);
      }
    }
    setDeleteConfirmOpen(false);
    setSetToDelete(null);
  };

  const cancelDeleteSet = () => {
    setDeleteConfirmOpen(false);
    setSetToDelete(null);
  };

  const handleDuplicateSet = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    const setToDuplicate = flashcardSets.find((s) => s.id === setId);
    if (setToDuplicate) {
      const duplicatedSet: FlashcardSet = {
        ...setToDuplicate,
        id: uuidv4(),
        name: `${setToDuplicate.name} (Copy)`,
        createdAt: new Date(),
      };
      setFlashcardSets([...flashcardSets, duplicatedSet]);
    }
  };

  const handleAddSet = () => {
    setInputValue('');
    setConfigFlipAxis('Y');
    setConfigQuestionBgColor('#ffffff');
    setConfigQuestionFgColor('#000000');
    setConfigQuestionFontSize('16px');
    setConfigQuestionFontFamily('Inter');
    setConfigAnswerBgColor('#f3f4f6');
    setConfigAnswerFgColor('#000000');
    setConfigAnswerFontSize('16px');
    setConfigAnswerFontFamily('Inter');
    setConfigQuestionPattern('none');
    setConfigAnswerPattern('none');
    setConfigCardCount(5);
    setConfigAiPrompt('');
    setConfigQuestionBackgroundImage('');
    setConfigQuestionBackgroundImageOpacity(0.3);
    setConfigAnswerBackgroundImage('');
    setConfigAnswerBackgroundImageOpacity(0.3);
    setIsCreatingSet(true);
    setEditingSetId(null);
    setIsModalOpen(true);
  };

  const copyQuestionToAnswer = () => {
    // Copy all question side styles to answer side
    setConfigAnswerBgColor(configQuestionBgColor);
    setConfigAnswerFgColor(configQuestionFgColor);
    setConfigAnswerFontFamily(configQuestionFontFamily);
    setConfigAnswerFontSize(configQuestionFontSize);
    setConfigAnswerPattern(configQuestionPattern);
    setConfigAnswerBackgroundImage(configQuestionBackgroundImage);
    setConfigAnswerBackgroundImageOpacity(configQuestionBackgroundImageOpacity);
    setConfigAnswerBorderStyle(configQuestionBorderStyle);
    setConfigAnswerBorderWidth(configQuestionBorderWidth);
    setConfigAnswerBorderColor(configQuestionBorderColor);
  };

  const copyAnswerToQuestion = () => {
    // Copy all answer side styles to question side
    setConfigQuestionBgColor(configAnswerBgColor);
    setConfigQuestionFgColor(configAnswerFgColor);
    setConfigQuestionFontFamily(configAnswerFontFamily);
    setConfigQuestionFontSize(configAnswerFontSize);
    setConfigQuestionPattern(configAnswerPattern);
    setConfigQuestionBackgroundImage(configAnswerBackgroundImage);
    setConfigQuestionBackgroundImageOpacity(configAnswerBackgroundImageOpacity);
    setConfigQuestionBorderStyle(configAnswerBorderStyle);
    setConfigQuestionBorderWidth(configAnswerBorderWidth);
    setConfigQuestionBorderColor(configAnswerBorderColor);
  };

  const handleSave = async () => {
    const config: FlashcardSetConfig = {
      flipAxis: configFlipAxis,
      cardTheme: 'default',
      questionBgColor: configQuestionBgColor,
      questionFgColor: configQuestionFgColor,
      questionFontSize: configQuestionFontSize,
      questionFontFamily: configQuestionFontFamily,
      questionBackgroundPattern: configQuestionPattern,
      answerBgColor: configAnswerBgColor,
      answerFgColor: configAnswerFgColor,
      answerFontSize: configAnswerFontSize,
      answerFontFamily: configAnswerFontFamily,
      answerBackgroundPattern: configAnswerPattern,
      questionBackgroundImage: configQuestionBackgroundImage,
      questionBackgroundImageOpacity: configQuestionBackgroundImageOpacity,
      answerBackgroundImage: configAnswerBackgroundImage,
      answerBackgroundImageOpacity: configAnswerBackgroundImageOpacity,
      questionBorderStyle: configQuestionBorderStyle,
      questionBorderWidth: configQuestionBorderWidth,
      questionBorderColor: configQuestionBorderColor,
      answerBorderStyle: configAnswerBorderStyle,
      answerBorderWidth: configAnswerBorderWidth,
      answerBorderColor: configAnswerBorderColor,
      aiPrompt: configAiPrompt,
    };

    if (isCreatingSet) {
      // If AI prompt is provided, create empty set and let FlashcardSetView handle generation
      const flashcards = configAiPrompt
        ? []
        : Array.from({ length: configCardCount }, (_, i) => ({
            id: uuidv4(),
            question: `Question card ${i + 1}`,
            answer: `Answer card ${i + 1}`,
          }));

      const newSet: FlashcardSet = {
        id: uuidv4(),
        title: inputValue || 'Untitled Set',
        name: inputValue || 'Untitled Set',
        flashcards,
        config: {
          ...config,
          cardCount: configCardCount, // Pass card count for AI generation
        } as FlashcardSetConfig,
        createdAt: new Date(),
      };
      
      // Save to storage (Supabase or localStorage)
      const savedSet = await UnifiedStorageService.createSet(newSet);
      setFlashcardSets([...flashcardSets, savedSet]);

      // If AI prompt provided, immediately navigate to the set view for generation
      if (configAiPrompt) {
        setSelectedSet(newSet);
        setIsModalOpen(false);
      }
    } else if (editingSetId) {
      const setToUpdate = flashcardSets.find(s => s.id === editingSetId);
      if (setToUpdate) {
        const updatedSet = { ...setToUpdate, name: inputValue, title: inputValue, config };
        await UnifiedStorageService.updateSet(updatedSet);
        setFlashcardSets(
          flashcardSets.map((set) =>
            set.id === editingSetId ? updatedSet : set
          )
        );
      }
    }
    setIsModalOpen(false);
    setInputValue('');
    setEditingSetId(null);
    setIsCreatingSet(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInputValue('');
    setEditingSetId(null);
    setIsCreatingSet(false);
  };

  const handleUpdateSet = async (updatedSet: FlashcardSet) => {
    // Update state immediately for optimistic UI
    setFlashcardSets(
      flashcardSets.map((set) => (set.id === updatedSet.id ? updatedSet : set))
    );
    setSelectedSet(updatedSet);
    
    // Save to storage in background (don't await)
    UnifiedStorageService.updateSet(updatedSet).catch(error => {
      console.error('Failed to save flashcard set:', error);
      // Optionally, you could revert the state here or show an error toast
    });
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
  };

  // Show loading only for a moment, then continue even if not logged in
  if (loading) {
    // Don't block the app, just show loading briefly
  }

  if (playingSet) {
    return <PlayMode set={playingSet} onExit={handleExitPlay} />;
  }

  return (
      <SidebarProvider>
        <AppSidebar 
          user={user} 
          onSignOut={signOut} 
          onShowAuthModal={() => setShowAuthModal(true)}
          flashcardSets={flashcardSets}
        />
        <SidebarInset>
        <header className='bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator
            orientation='vertical'
            className='mr-2 data-[orientation=vertical]:h-4'
          />
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {selectedSet ? selectedSet.name : 'Flashcard Sets'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {selectedSet ? (
          <FlashcardSetView
            set={selectedSet}
            onBack={handleBackToSets}
            onUpdateSet={handleUpdateSet}
          />
        ) : (
          <div
            className='flex flex-1 flex-col gap-4 p-4'
            style={{
              backgroundColor: '#fafafa',
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className='flex justify-between items-center mb-4'>
              <h1 className='text-2xl font-bold'>My Flashcard Sets</h1>
              <span className='text-sm text-muted-foreground'>
                {flashcardSets.length}{' '}
                {flashcardSets.length === 1 ? 'set' : 'sets'}
              </span>
            </div>
            <div className='grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4'>
              {flashcardSets.map((set) => (
                <Card
                  key={set.id}
                  className='relative group cursor-pointer hover:shadow-lg transition-shadow bg-muted/50'
                  onClick={() => handleSetClick(set)}
                >
                  <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10'>
                    {set.flashcards.length > 0 && (
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8'
                        onClick={(e) => handlePlaySet(e, set)}
                      >
                        <Play className='h-4 w-4' />
                      </Button>
                    )}
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8'
                      onClick={(e) => handleEditSetName(e, set.id)}
                    >
                      <Edit2 className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8'
                      onClick={(e) => handleDuplicateSet(e, set.id)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8'
                      onClick={(e) => handleDeleteSet(e, set.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle className='text-lg'>{set.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground'>
                      {set.flashcards.length}{' '}
                      {set.flashcards.length === 1 ? 'card' : 'cards'}
                    </p>
                    <p className='text-xs text-muted-foreground mt-2'>
                      Created {set.createdAt.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card
                className='cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-muted-foreground/25 bg-transparent'
                onClick={handleAddSet}
              >
                <CardContent className='flex h-full items-center justify-center p-4 min-h-[180px]'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='rounded-full bg-primary/10 p-3'>
                      <Plus className='h-6 w-6 text-primary' />
                    </div>
                    <p className='text-sm text-muted-foreground'>Add Set</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className='max-w-6xl max-h-[calc(100vh-128px)] flex flex-col' noOverlay hideClose>
            <DialogHeader className='flex-shrink-0 relative'>
              <DialogTitle>
                {isCreatingSet ? 'Create New Set' : 'Edit Set'}
              </DialogTitle>
              <div className='absolute right-0 top-0 flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size='sm' onClick={handleSave}>Save</Button>
              </div>
            </DialogHeader>
            <div className='grid gap-2 py-4 overflow-y-auto flex-1'>
              {/* Name Input */}
              <div>
                <Label htmlFor='name' className='text-base font-semibold'>
                  Set Name
                </Label>
                <Input
                  id='name'
                  placeholder='Enter flashcard set name...'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className='mt-2'
                />
              </div>

              {/* AI Generation and Card Count - Side by Side (only for creating) */}
              {isCreatingSet && (
                <div className='grid grid-cols-2 gap-4'>
                  {/* AI Generation */}
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      AI Generation (Optional)
                    </h4>
                    <div className='space-y-3'>
                      <Textarea
                        id='ai-prompt'
                        placeholder={user 
                          ? 'e.g., "Spanish vocabulary for beginners", "Chemistry periodic table elements", "World War II key events"'
                          : 'Sign in to use AI-powered flashcard generation'
                        }
                        value={configAiPrompt}
                        onChange={(e) => setConfigAiPrompt(e.target.value)}
                        className='min-h-[80px]'
                        disabled={!user}
                      />

                      {!user && (
                        <div className='space-y-2'>
                          <p className='text-xs text-muted-foreground'>
                            🔒 Sign in to unlock AI-powered flashcard generation
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowAuthModal(true)}
                          >
                            Sign In to Use AI
                          </Button>
                        </div>
                      )}
                      {user && !aiService.isConfigured() && (
                        <p className='text-xs text-amber-600'>
                          ⚠️ OpenAI API key not configured. Add
                          VITE_OPENAI_API_KEY to .env file to enable AI
                          generation.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Number of Cards */}
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      Number of Cards
                    </h4>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <Label htmlFor='card-count' className='text-xs'>
                          {configAiPrompt ? 'Cards to generate' : 'Default cards'}
                        </Label>
                        <span className='text-sm font-medium text-muted-foreground'>
                          {configCardCount}{' '}
                          {configCardCount === 1 ? 'card' : 'cards'}
                        </span>
                      </div>
                      <Slider
                        id='card-count'
                        min={5}
                        max={115}
                        step={5}
                        value={[configCardCount]}
                        onValueChange={(value) => setConfigCardCount(value[0])}
                        className='w-full'
                      />
                      <div className='flex justify-between text-xs text-muted-foreground'>
                        <span>5</span>
                        <span>115</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Flip Direction 
              <div className='border rounded-lg p-4'>
                <h4 className='text-sm font-semibold mb-3'>Flip Animation</h4>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='flip-axis'>Direction</Label>
                  <div className='flex items-center gap-3'>
                    <span
                      className={cn(
                        'text-sm',
                        configFlipAxis === 'Y' && 'font-medium'
                      )}
                    >
                      <ArrowLeftRight className='h-4 w-4 inline mr-1' />
                      Horizontal
                    </span>
                    <Switch
                      id='flip-axis'
                      checked={configFlipAxis === 'X'}
                      onCheckedChange={(checked) =>
                        setConfigFlipAxis(checked ? 'X' : 'Y')
                      }
                    />
                    <span
                      className={cn(
                        'text-sm',
                        configFlipAxis === 'X' && 'font-medium'
                      )}
                    >
                      <ArrowUpDown className='h-4 w-4 inline mr-1' />
                      Vertical
                    </span>
                  </div>
                </div>
              </div>*/}

              {/* Card Configuration Tabs */}
              <Tabs defaultValue='question' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='question'>Question Side</TabsTrigger>
                  <TabsTrigger value='answer'>Answer Side</TabsTrigger>
                </TabsList>

                {/* Question Side Tab */}
                <TabsContent value='question' className='space-y-4 mt-4'>
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      Background Image
                    </h4>
                    <div className='space-y-3'>
                      <div>
                        <Input
                          id='question-background-image'
                          type='url'
                          placeholder='https://example.com/image.jpg'
                          value={configQuestionBackgroundImage}
                          onChange={(e) =>
                            setConfigQuestionBackgroundImage(e.target.value)
                          }
                          className='text-sm'
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          Image URL for question side background
                        </p>
                      </div>
                      {configQuestionBackgroundImage && (
                        <div className='space-y-2'>
                          <div>
                            <div className='flex items-center justify-between mb-1'>
                              <Label className='text-xs'>Opacity</Label>
                              <span className='text-xs text-muted-foreground'>
                                {Math.round(
                                  configQuestionBackgroundImageOpacity * 100
                                )}
                                %
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[
                                configQuestionBackgroundImageOpacity * 100,
                              ]}
                              onValueChange={(value) =>
                                setConfigQuestionBackgroundImageOpacity(
                                  value[0] / 100
                                )
                              }
                              className='w-full'
                            />
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='w-full text-xs'
                            onClick={() => {
                              setConfigQuestionBackgroundImage('');
                              setConfigQuestionBackgroundImageOpacity(0.3);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Styling and Border Configuration Side by Side */}
                  <div className='grid grid-cols-2 gap-4'>
                    {/* Styling Section */}
                    <div className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-4'>
                        <h4 className='text-sm font-semibold'>Styling</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={copyQuestionToAnswer}
                                type='button'
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='text-xs'>Copy all styles to Answer side</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className='space-y-4'>
                        {/* Colors */}
                        <div className='grid grid-cols-2 gap-3'>
                          <DebouncedColorInput
                            label='Background'
                            value={configQuestionBgColor}
                            onChange={setConfigQuestionBgColor}
                          />
                          <DebouncedColorInput
                            label='Text Color'
                            value={configQuestionFgColor}
                            onChange={setConfigQuestionFgColor}
                          />
                        </div>

                        {/* Typography */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <Label className='text-xs'>Font Family</Label>
                          <Select
                            value={configQuestionFontFamily}
                            onValueChange={setConfigQuestionFontFamily}
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Inter'>Inter</SelectItem>
                              <SelectItem value='Roboto'>Roboto</SelectItem>
                              <SelectItem value='Open Sans'>
                                Open Sans
                              </SelectItem>
                              <SelectItem value='Poppins'>Poppins</SelectItem>
                              <SelectItem value='Montserrat'>
                                Montserrat
                              </SelectItem>
                              <SelectItem value='Lato'>Lato</SelectItem>
                              <SelectItem value='Raleway'>Raleway</SelectItem>
                              <SelectItem value='Playfair Display'>
                                Playfair Display
                              </SelectItem>
                              <SelectItem value='Merriweather'>
                                Merriweather
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className='text-xs'>Font Size</Label>
                          <Select
                            value={configQuestionFontSize}
                            onValueChange={setConfigQuestionFontSize}
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='12px'>Small (12px)</SelectItem>
                              <SelectItem value='14px'>
                                Normal (14px)
                              </SelectItem>
                              <SelectItem value='16px'>
                                Medium (16px)
                              </SelectItem>
                              <SelectItem value='18px'>Large (18px)</SelectItem>
                              <SelectItem value='20px'>
                                Extra Large (20px)
                              </SelectItem>
                              <SelectItem value='24px'>Huge (24px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Pattern Selection */}
                      <PatternGallery
                        label='Background Pattern'
                        selectedPattern={configQuestionPattern}
                        onSelectPattern={setConfigQuestionPattern}
                        baseColor={configQuestionBgColor}
                      />

                      {/* Preview */}
                      <div
                        className='rounded-lg min-h-[100px] relative overflow-hidden'
                        style={{
                          borderStyle: configQuestionBorderStyle === 'none' ? 'none' : configQuestionBorderStyle,
                          borderWidth: configQuestionBorderStyle === 'none' ? '0' : configQuestionBorderWidth,
                          borderColor: configQuestionBorderColor,
                          ...(configQuestionPattern &&
                          configQuestionPattern !== 'none'
                            ? getPatternById(configQuestionPattern)?.getCSS(
                                configQuestionBgColor
                              )
                            : { backgroundColor: configQuestionBgColor }),
                        }}
                      >
                        {/* Background Image Layer */}
                        {configQuestionBackgroundImage && (
                          <div
                            className='absolute inset-0 z-0'
                            style={{
                              backgroundImage: `url(${configQuestionBackgroundImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              opacity: configQuestionBackgroundImageOpacity,
                            }}
                          />
                        )}
                        {/* Content Layer */}
                        <div
                          className='relative z-10 p-4 min-h-[100px] flex items-center justify-center'
                          style={{
                            color: configQuestionFgColor,
                            fontFamily: configQuestionFontFamily,
                            fontSize: configQuestionFontSize,
                          }}
                        >
                          <div className='text-center'>
                            <p className='opacity-70 text-xs mb-1'>
                              Question Preview
                            </p>
                            <p>Sample Question Text</p>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* Border Style Configuration for Question Side */}
                    <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>Border Style</h4>
                    <div className='space-y-3'>
                      {/* Border Style */}
                      <div>
                        <Label htmlFor='question-border-style' className='text-xs'>
                          Border Style
                        </Label>
                        <Select
                          value={configQuestionBorderStyle}
                          onValueChange={setConfigQuestionBorderStyle}
                        >
                          <SelectTrigger id='question-border-style' className='mt-1'>
                            <SelectValue placeholder='Select border style' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='none'>None</SelectItem>
                            <SelectItem value='solid'>Solid</SelectItem>
                            <SelectItem value='dashed'>Dashed</SelectItem>
                            <SelectItem value='dotted'>Dotted</SelectItem>
                            <SelectItem value='double'>Double</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Border Width */}
                      {configQuestionBorderStyle !== 'none' && (
                        <>
                          <div>
                            <div className='flex items-center justify-between mb-1'>
                              <Label htmlFor='question-border-width' className='text-xs'>
                                Border Width
                              </Label>
                              <span className='text-xs text-muted-foreground'>
                                {configQuestionBorderWidth}
                              </span>
                            </div>
                            <Slider
                              id='question-border-width'
                              min={0}
                              max={8}
                              step={1}
                              value={[parseInt(configQuestionBorderWidth)]}
                              onValueChange={(value) =>
                                setConfigQuestionBorderWidth(`${value[0]}px`)
                              }
                              className='w-full'
                            />
                          </div>

                          {/* Border Color */}
                          <DebouncedColorInput
                            label='Border Color'
                            value={configQuestionBorderColor}
                            onChange={setConfigQuestionBorderColor}
                          />
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Answer Side Tab */}
                <TabsContent value='answer' className='space-y-4 mt-4'>
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      Background Image
                    </h4>
                    <div className='space-y-3'>
                      <div>
                        <Input
                          id='answer-background-image'
                          type='url'
                          placeholder='https://example.com/image.jpg'
                          value={configAnswerBackgroundImage}
                          onChange={(e) =>
                            setConfigAnswerBackgroundImage(e.target.value)
                          }
                          className='text-sm'
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          Image URL for answer side background
                        </p>
                      </div>
                      {configAnswerBackgroundImage && (
                        <div className='space-y-2'>
                          <div>
                            <div className='flex items-center justify-between mb-1'>
                              <Label className='text-xs'>Opacity</Label>
                              <span className='text-xs text-muted-foreground'>
                                {Math.round(
                                  configAnswerBackgroundImageOpacity * 100
                                )}
                                %
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[configAnswerBackgroundImageOpacity * 100]}
                              onValueChange={(value) =>
                                setConfigAnswerBackgroundImageOpacity(
                                  value[0] / 100
                                )
                              }
                              className='w-full'
                            />
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='w-full text-xs'
                            onClick={() => {
                              setConfigAnswerBackgroundImage('');
                              setConfigAnswerBackgroundImageOpacity(0.3);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Styling and Border Configuration Side by Side */}
                  <div className='grid grid-cols-2 gap-4'>
                    {/* Styling Section */}
                    <div className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-4'>
                        <h4 className='text-sm font-semibold'>Styling</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={copyAnswerToQuestion}
                                type='button'
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='text-xs'>Copy all styles to Question side</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className='space-y-4'>
                        {/* Colors */}
                        <div className='grid grid-cols-2 gap-3'>
                          <DebouncedColorInput
                            label='Background'
                            value={configAnswerBgColor}
                            onChange={setConfigAnswerBgColor}
                          />
                          <DebouncedColorInput
                            label='Text Color'
                            value={configAnswerFgColor}
                            onChange={setConfigAnswerFgColor}
                          />
                        </div>

                        {/* Typography */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <Label className='text-xs'>Font Family</Label>
                          <Select
                            value={configAnswerFontFamily}
                            onValueChange={setConfigAnswerFontFamily}
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Inter'>Inter</SelectItem>
                              <SelectItem value='Roboto'>Roboto</SelectItem>
                              <SelectItem value='Open Sans'>
                                Open Sans
                              </SelectItem>
                              <SelectItem value='Poppins'>Poppins</SelectItem>
                              <SelectItem value='Montserrat'>
                                Montserrat
                              </SelectItem>
                              <SelectItem value='Lato'>Lato</SelectItem>
                              <SelectItem value='Raleway'>Raleway</SelectItem>
                              <SelectItem value='Playfair Display'>
                                Playfair Display
                              </SelectItem>
                              <SelectItem value='Merriweather'>
                                Merriweather
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className='text-xs'>Font Size</Label>
                          <Select
                            value={configAnswerFontSize}
                            onValueChange={setConfigAnswerFontSize}
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='12px'>Small (12px)</SelectItem>
                              <SelectItem value='14px'>
                                Normal (14px)
                              </SelectItem>
                              <SelectItem value='16px'>
                                Medium (16px)
                              </SelectItem>
                              <SelectItem value='18px'>Large (18px)</SelectItem>
                              <SelectItem value='20px'>
                                Extra Large (20px)
                              </SelectItem>
                              <SelectItem value='24px'>Huge (24px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Pattern Selection */}
                      <PatternGallery
                        label='Background Pattern'
                        selectedPattern={configAnswerPattern}
                        onSelectPattern={setConfigAnswerPattern}
                        baseColor={configAnswerBgColor}
                      />

                      {/* Preview */}
                      <div
                        className='rounded-lg min-h-[100px] relative overflow-hidden'
                        style={{
                          borderStyle: configAnswerBorderStyle === 'none' ? 'none' : configAnswerBorderStyle,
                          borderWidth: configAnswerBorderStyle === 'none' ? '0' : configAnswerBorderWidth,
                          borderColor: configAnswerBorderColor,
                          ...(configAnswerPattern &&
                          configAnswerPattern !== 'none'
                            ? getPatternById(configAnswerPattern)?.getCSS(
                                configAnswerBgColor
                              )
                            : { backgroundColor: configAnswerBgColor }),
                        }}
                      >
                        {/* Background Image Layer */}
                        {configAnswerBackgroundImage && (
                          <div
                            className='absolute inset-0 z-0'
                            style={{
                              backgroundImage: `url(${configAnswerBackgroundImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              opacity: configAnswerBackgroundImageOpacity,
                            }}
                          />
                        )}
                        {/* Content Layer */}
                        <div
                          className='relative z-10 p-4 min-h-[100px] flex items-center justify-center'
                          style={{
                            color: configAnswerFgColor,
                            fontFamily: configAnswerFontFamily,
                            fontSize: configAnswerFontSize,
                          }}
                        >
                          <div className='text-center'>
                            <p className='opacity-70 text-xs mb-1'>
                              Answer Preview
                            </p>
                            <p>Sample Answer Text</p>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* Border Style Configuration for Answer Side */}
                    <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>Border Style</h4>
                    <div className='space-y-3'>
                      {/* Border Style */}
                      <div>
                        <Label htmlFor='answer-border-style' className='text-xs'>
                          Border Style
                        </Label>
                        <Select
                          value={configAnswerBorderStyle}
                          onValueChange={setConfigAnswerBorderStyle}
                        >
                          <SelectTrigger id='answer-border-style' className='mt-1'>
                            <SelectValue placeholder='Select border style' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='none'>None</SelectItem>
                            <SelectItem value='solid'>Solid</SelectItem>
                            <SelectItem value='dashed'>Dashed</SelectItem>
                            <SelectItem value='dotted'>Dotted</SelectItem>
                            <SelectItem value='double'>Double</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Border Width */}
                      {configAnswerBorderStyle !== 'none' && (
                        <>
                          <div>
                            <div className='flex items-center justify-between mb-1'>
                              <Label htmlFor='answer-border-width' className='text-xs'>
                                Border Width
                              </Label>
                              <span className='text-xs text-muted-foreground'>
                                {configAnswerBorderWidth}
                              </span>
                            </div>
                            <Slider
                              id='answer-border-width'
                              min={0}
                              max={8}
                              step={1}
                              value={[parseInt(configAnswerBorderWidth)]}
                              onValueChange={(value) =>
                                setConfigAnswerBorderWidth(`${value[0]}px`)
                              }
                              className='w-full'
                            />
                          </div>

                          {/* Border Color */}
                          <DebouncedColorInput
                            label='Border Color'
                            value={configAnswerBorderColor}
                            onChange={setConfigAnswerBorderColor}
                          />
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Flashcard Set</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "
                {flashcardSets.find((s) => s.id === setToDelete)?.name}"? This
                will permanently remove the set and all{' '}
                {flashcardSets.find((s) => s.id === setToDelete)?.flashcards
                  .length || 0}{' '}
                flashcard
                {(flashcardSets.find((s) => s.id === setToDelete)?.flashcards
                  .length || 0) === 1
                  ? ''
                  : 's'}{' '}
                it contains.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={cancelDeleteSet}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={confirmDeleteSet}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auth Modal */}
        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
