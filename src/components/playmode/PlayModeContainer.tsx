import React, { memo, useState, useCallback, useMemo } from 'react';
import { PlayModeCard } from './PlayModeCard';
import { PlayModeActions } from '@/components/flashcard/CardActions';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { FlashcardSet } from '@/types';

interface PlayModeContainerProps {
  set: FlashcardSet;
  onExit: () => void;
}

export const PlayModeContainer = memo(function PlayModeContainer({
  set,
  onExit
}: PlayModeContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(set.flashcards);

  const currentCard = useMemo(
    () => shuffledCards[currentIndex],
    [shuffledCards, currentIndex]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, shuffledCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffledCards(set.flashcards);
  }, [set.flashcards]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [shuffledCards]);

  if (shuffledCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <p className="text-lg mb-4">No flashcards in this set</p>
        <Button onClick={onExit}>Exit Play Mode</Button>
      </div>
    );
  }

  const questionStyles = {
    backgroundColor: set.config.questionBgColor,
    color: set.config.questionFgColor,
    fontSize: set.config.questionFontSize,
    fontFamily: set.config.questionFontFamily,
  };

  const answerStyles = {
    backgroundColor: set.config.answerBgColor,
    color: set.config.answerFgColor,
    fontSize: set.config.answerFontSize,
    fontFamily: set.config.answerFontFamily,
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{set.name}</h2>
          <p className="text-gray-600">
            Card {currentIndex + 1} of {shuffledCards.length}
          </p>
        </div>
        <Button
          onClick={onExit}
          variant="outline"
          size="icon"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{
            width: `${((currentIndex + 1) / shuffledCards.length) * 100}%`,
          }}
        />
      </div>

      {/* Card */}
      <div className="mb-8">
        <PlayModeCard
          card={currentCard}
          questionStyles={questionStyles}
          answerStyles={answerStyles}
          flipAxis={set.config.flipAxis}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Controls */}
      <PlayModeActions
        currentIndex={currentIndex}
        totalCards={shuffledCards.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFlip={handleFlip}
        onReset={handleReset}
        onShuffle={handleShuffle}
      />
    </div>
  );
});