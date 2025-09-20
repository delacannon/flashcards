import React, { memo } from 'react';
import { FlashcardBase } from '@/components/flashcard/FlashcardBase';
import { MarkdownRenderer } from '@/components/flashcard/MarkdownRenderer';
import type { Flashcard, FlashcardStyles } from '@/types';

interface PlayModeCardProps {
  card: Flashcard;
  questionStyles?: FlashcardStyles;
  answerStyles?: FlashcardStyles;
  flipAxis?: 'X' | 'Y';
  isFlipped: boolean;
  onFlip: () => void;
}

export const PlayModeCard = memo(function PlayModeCard({
  card,
  questionStyles = {},
  answerStyles = {},
  flipAxis = 'Y',
  isFlipped,
  onFlip
}: PlayModeCardProps) {
  const questionContent = (
    <div style={{ userSelect: 'none' }}>
      <MarkdownRenderer
        content={card.question}
        style={{
          color: questionStyles.color,
          fontSize: questionStyles.fontSize,
          fontFamily: questionStyles.fontFamily,
        }}
      />
    </div>
  );

  const answerContent = (
    <div style={{ userSelect: 'none' }}>
      <MarkdownRenderer
        content={card.answer}
        style={{
          color: answerStyles.color,
          fontSize: answerStyles.fontSize,
          fontFamily: answerStyles.fontFamily,
        }}
      />
    </div>
  );

  return (
    <div className="select-none">
      <FlashcardBase
        question={questionContent}
        answer={answerContent}
        isFlipped={isFlipped}
        onFlip={onFlip}
        flipAxis={flipAxis}
        questionStyles={questionStyles}
        answerStyles={answerStyles}
        className="cursor-pointer"
      />
    </div>
  );
});