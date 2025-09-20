import React, { memo, ReactNode } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/lib/utils';
import { getPatternById } from '@/lib/patterns';
import type { FlashcardStyles } from '@/types';

export interface FlashcardBaseProps {
  question: ReactNode;
  answer: ReactNode;
  isFlipped: boolean;
  onFlip?: () => void;
  flipAxis?: 'X' | 'Y';
  questionStyles?: FlashcardStyles;
  answerStyles?: FlashcardStyles;
  className?: string;
  dragHandle?: ReactNode;
  actions?: ReactNode;
}

export const FlashcardBase = memo(function FlashcardBase({
  question,
  answer,
  isFlipped,
  onFlip,
  flipAxis = 'Y',
  questionStyles = {},
  answerStyles = {},
  className,
  dragHandle,
  actions,
}: FlashcardBaseProps) {
  const { transform, opacity } = useSpring({
    opacity: isFlipped ? 1 : 0,
    transform: `perspective(600px) rotate${flipAxis}(${isFlipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.no-flip') ||
      target.closest('[contenteditable]')
    ) {
      return;
    }
    onFlip?.();
  };

  return (
    <div
      className={cn('relative group cursor-pointer', className)}
      onClick={handleCardClick}
    >
      {/* Front side - Question */}
      <animated.div
        className="absolute w-full h-full"
        style={{
          opacity: opacity.to((o) => 1 - o),
          transform,
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          className="w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]"
          style={{
            ...(
              questionStyles.backgroundPattern && questionStyles.backgroundPattern !== 'none'
                ? getPatternById(questionStyles.backgroundPattern)?.getCSS(questionStyles.backgroundColor || '#ffffff')
                : { backgroundColor: questionStyles.backgroundColor }
            ),
            color: questionStyles.color,
            fontFamily: questionStyles.fontFamily,
          }}
        >
          {/* Drag Handle */}
          {dragHandle && (
            <div className="absolute top-2 left-2 z-10 no-flip">
              {dragHandle}
            </div>
          )}
          
          {/* Actions (Edit/Delete) */}
          {actions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 no-flip">
              {actions}
            </div>
          )}

          {/* Question Content */}
          <div className="flex h-full min-h-[200px] items-center justify-center p-6">
            <div className="text-center w-full">
              <p className="text-xs opacity-70 mb-2">Question</p>
              <div style={{ fontSize: questionStyles.fontSize || '14px' }}>
                {question}
              </div>
            </div>
          </div>
        </div>
      </animated.div>

      {/* Back side - Answer */}
      <animated.div
        className="w-full h-full"
        style={{
          opacity,
          transform,
          ...(flipAxis === 'Y' ? { rotateY: '180deg' } : { rotateX: '180deg' }),
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          className="w-full h-full rounded-xl border shadow hover:shadow-lg transition-shadow min-h-[200px]"
          style={{
            ...(
              answerStyles.backgroundPattern && answerStyles.backgroundPattern !== 'none'
                ? getPatternById(answerStyles.backgroundPattern)?.getCSS(answerStyles.backgroundColor || '#f3f4f6')
                : { backgroundColor: answerStyles.backgroundColor }
            ),
            color: answerStyles.color,
            fontFamily: answerStyles.fontFamily,
          }}
        >
          {/* Drag Handle */}
          {dragHandle && (
            <div className="absolute top-2 left-2 z-10 no-flip">
              {dragHandle}
            </div>
          )}
          
          {/* Actions (Edit/Delete) */}
          {actions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 no-flip">
              {actions}
            </div>
          )}

          {/* Answer Content */}
          <div className="flex h-full min-h-[200px] items-center justify-center p-6">
            <div className="text-center w-full">
              <p className="text-xs opacity-70 mb-2">Answer</p>
              <div style={{ fontSize: answerStyles.fontSize || '14px' }}>
                {answer}
              </div>
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
});