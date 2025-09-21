import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppSidebar } from '@/components/app-sidebar';
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
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ArrowLeftRight,
  ArrowUpDown,
  Play,
} from 'lucide-react';
import {
  FlashcardSetView,
  type FlashcardSet,
  type FlashcardSetConfig,
} from '@/components/FlashcardSetView';
import { PlayMode } from '@/components/PlayMode';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DebouncedColorInput } from '@/components/ui/DebouncedColorInput';
import { StackedCard } from '@/components/ui/StackedCard';
import { PatternGallery } from '@/components/ui/PatternGallery';
import { getPatternById } from '@/lib/patterns';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { aiService } from '@/services/ai';

function App() {
  const [playingSet, setPlayingSet] = useState<FlashcardSet | null>(null);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
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
      setIsModalOpen(true);
      setIsCreatingSet(false);
    }
  };

  const handleDeleteSet = (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    setSetToDelete(setId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSet = () => {
    if (setToDelete) {
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
    setIsCreatingSet(true);
    setEditingSetId(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
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
        name: inputValue || 'Untitled Set',
        flashcards,
        config: {
          ...config,
          cardCount: configCardCount, // Pass card count for AI generation
        } as FlashcardSetConfig,
        createdAt: new Date(),
      };
      setFlashcardSets([...flashcardSets, newSet]);

      // If AI prompt provided, immediately navigate to the set view for generation
      if (configAiPrompt) {
        setSelectedSet(newSet);
        setIsModalOpen(false);
      }
    } else if (editingSetId) {
      setFlashcardSets(
        flashcardSets.map((set) =>
          set.id === editingSetId ? { ...set, name: inputValue, config } : set
        )
      );
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

  const handleUpdateSet = (updatedSet: FlashcardSet) => {
    setFlashcardSets(
      flashcardSets.map((set) => (set.id === updatedSet.id ? updatedSet : set))
    );
    setSelectedSet(updatedSet);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
  };

  if (playingSet) {
    return <PlayMode set={playingSet} onExit={handleExitPlay} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator
            orientation='vertical'
            className='mr-2 data-[orientation=vertical]:h-4'
          />
          <Breadcrumb>
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
          <DialogContent className='max-w-5xl overflow-y-auto' noOverlay>
            <DialogHeader>
              <DialogTitle>
                {isCreatingSet ? 'Create New Set' : 'Edit Set'}
              </DialogTitle>
            </DialogHeader>
            <div className='grid gap-2 py-4'>
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

              {/* AI Generation or Default Cards (only for creating) */}
              {isCreatingSet && (
                <>
                  {/* AI Prompt */}
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      AI Generation (Optional)
                    </h4>
                    <div className='space-y-3'>
                      <Textarea
                        id='ai-prompt'
                        placeholder='e.g., "Spanish vocabulary for beginners", "Chemistry periodic table elements", "World War II key events"'
                        value={configAiPrompt}
                        onChange={(e) => setConfigAiPrompt(e.target.value)}
                        className='min-h-[80px]'
                      />

                      {!aiService.isConfigured() && (
                        <p className='text-xs text-amber-600'>
                          ⚠️ OpenAI API key not configured. Add
                          VITE_OPENAI_API_KEY to .env file to enable AI
                          generation.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Count */}
                  <div className='border rounded-lg p-4'>
                    <h4 className='text-sm font-semibold mb-3'>
                      Number of Cards
                    </h4>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <Label htmlFor='card-count'>
                          {configAiPrompt
                            ? 'Cards to generate with AI'
                            : 'Generate cards with default content'}
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
                </>
              )}

              {/* Flip Direction */}
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
              </div>

              {/* Card Configuration Grid */}
              <div className='grid grid-cols-2 gap-6'>
                {/* Question Side Configuration */}
                <div className='border rounded-lg p-4'>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs'>
                      Q
                    </span>
                    Question Side
                  </h4>

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
                            <SelectItem value='Open Sans'>Open Sans</SelectItem>
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
                            <SelectItem value='14px'>Normal (14px)</SelectItem>
                            <SelectItem value='16px'>Medium (16px)</SelectItem>
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
                      className='rounded-lg border p-4 min-h-[100px] flex items-center justify-center'
                      style={{
                        ...(configQuestionPattern &&
                        configQuestionPattern !== 'none'
                          ? getPatternById(configQuestionPattern)?.getCSS(
                              configQuestionBgColor
                            )
                          : { backgroundColor: configQuestionBgColor }),
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

                {/* Answer Side Configuration */}
                <div className='border rounded-lg p-4'>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='bg-green-100 text-green-700 px-2 py-1 rounded text-xs'>
                      A
                    </span>
                    Answer Side
                  </h4>

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
                            <SelectItem value='Open Sans'>Open Sans</SelectItem>
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
                            <SelectItem value='14px'>Normal (14px)</SelectItem>
                            <SelectItem value='16px'>Medium (16px)</SelectItem>
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
                      className='rounded-lg border p-4 min-h-[100px] flex items-center justify-center'
                      style={{
                        ...(configAnswerPattern &&
                        configAnswerPattern !== 'none'
                          ? getPatternById(configAnswerPattern)?.getCSS(
                              configAnswerBgColor
                            )
                          : { backgroundColor: configAnswerBgColor }),
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
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
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
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
