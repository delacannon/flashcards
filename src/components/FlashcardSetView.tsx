import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FlipCard } from '@/components/FlipCard';

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
  answerBgColor?: string;
  answerFgColor?: string;
  answerFontSize?: string;
  answerFontFamily?: string;
  backgroundImage?: string;
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

export function FlashcardSetView({ set, onBack, onUpdateSet }: FlashcardSetViewProps) {
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

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
      const updatedFlashcards = set.flashcards.map(fc =>
        fc.id === selectedFlashcard.id
          ? { ...fc, question, answer }
          : fc
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

  const handleDeleteFlashcard = (flashcardId: string) => {
    const updatedFlashcards = set.flashcards.filter(fc => fc.id !== flashcardId);
    const updatedSet = {
      ...set,
      flashcards: updatedFlashcards,
    };
    onUpdateSet(updatedSet);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setQuestion('');
    setAnswer('');
    setSelectedFlashcard(null);
  };

  return (
    <div className='flex flex-1 flex-col gap-4'>
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
          <span className='text-sm text-muted-foreground'>
            {set.config?.flipAxis === 'X' ? '↕️ Vertical' : '↔️ Horizontal'} flip
          </span>
          <span className='text-sm text-muted-foreground'>
            • {set.flashcards.length} {set.flashcards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {set.flashcards.map((flashcard) => (
            <FlipCard
              key={flashcard.id}
              question={flashcard.question}
              answer={flashcard.answer}
              flipAxis={set.config?.flipAxis || 'Y'}
              questionBgColor={set.config?.questionBgColor}
              questionFgColor={set.config?.questionFgColor}
              questionFontSize={set.config?.questionFontSize}
              questionFontFamily={set.config?.questionFontFamily}
              answerBgColor={set.config?.answerBgColor}
              answerFgColor={set.config?.answerFgColor}
              answerFontSize={set.config?.answerFontSize}
              answerFontFamily={set.config?.answerFontFamily}
              onEdit={() => handleEditFlashcard(flashcard)}
              onDelete={() => handleDeleteFlashcard(flashcard.id)}
              className='min-h-[200px]'
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
      </div>

      <Dialog open={isEditing || isCreating} onOpenChange={(open) => {
        if (!open) handleCancel();
      }}>
        <DialogContent className='sm:max-w-[525px]'>
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
    </div>
  );
}