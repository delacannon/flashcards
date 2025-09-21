import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSpring, animated, useTransition } from '@react-spring/web';
import { cn } from '@/lib/utils';
import type { FlashcardSet } from './FlashcardSetView';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkHighlight } from '@/lib/remarkHighlight';
import { getPatternById } from '@/lib/patterns';
import confetti from 'canvas-confetti';

interface PlayModeProps {
  set: FlashcardSet;
  onExit: () => void;
}

export function PlayMode({ set, onExit }: PlayModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [hasFlippedCurrentCard, setHasFlippedCurrentCard] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [hasCompletedSet, setHasCompletedSet] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const currentCard = set.flashcards[currentIndex];
  const totalCards = set.flashcards.length;
  const flipAxis = set.config?.flipAxis || 'Y';
  const progressPercentage = ((currentIndex + 1) / totalCards) * 100;

  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(1200px) rotate${flipAxis}(${flipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  const transitions = useTransition(currentIndex, {
    from: {
      opacity: 0,
      transform:
        direction === 'right'
          ? 'translate3d(100%, 0, 0) scale(0.9)'
          : 'translate3d(-100%, 0, 0) scale(0.9)',
    },
    enter: {
      opacity: 1,
      transform: 'translate3d(0%, 0, 0) scale(1)',
    },
    leave: {
      opacity: 0,
      transform:
        direction === 'right'
          ? 'translate3d(-100%, 0, 0) scale(0.9)'
          : 'translate3d(100%, 0, 0) scale(0.9)',
    },
    config: {
      mass: 1,
      tension: 120,
      friction: 20,
      clamp: true,
    },
    keys: currentIndex,
  });

  const navigatePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('left');
      setFlipped(false);
      setHasFlippedCurrentCard(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 50);
    }
  }, [currentIndex]);

  const navigateNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      if (!hasFlippedCurrentCard) {
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
        return;
      }
      setDirection('right');
      setFlipped(false);
      setHasFlippedCurrentCard(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 50);
    }
  }, [currentIndex, totalCards, hasFlippedCurrentCard]);

  const toggleFlip = useCallback(() => {
    setFlipped(!flipped);
    if (!flipped) {
      setHasFlippedCurrentCard(true);
      
      // Check if this is the last card and trigger confetti
      if (currentIndex === totalCards - 1 && !hasCompletedSet) {
        setHasCompletedSet(true);
        
        // Single confetti explosion
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#14b8a6', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'],
          startVelocity: 45,
          gravity: 0.8,
          ticks: 100,
          zIndex: 9999
        });
        
        // Start fade out transition after 3 seconds
        setTimeout(() => {
          setIsFadingOut(true);
          // Wait for fade animation to complete before exiting
          setTimeout(() => {
            onExit();
          }, 500);
        }, 3000);
      }
    }
  }, [flipped, currentIndex, totalCards, hasCompletedSet, onExit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          toggleFlip();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigatePrevious, navigateNext, toggleFlip, onExit]);

  if (!currentCard) {
    return (
      <div className='fixed inset-0 bg-background z-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg text-muted-foreground mb-4'>
            No flashcards in this set
          </p>
          <Button onClick={onExit} variant='outline'>
            Return to Set
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('fixed inset-0 bg-background z-50 flex flex-col', isFadingOut && 'fade-out')}>
      {/* Header */}
      <div className='flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-4'>
            <Button
              onClick={onExit}
              variant='ghost'
              size='icon'
              className='shrink-0'
            >
              <X className='h-5 w-5' />
            </Button>
            <h2 className='text-xl font-semibold'>{set.name}</h2>
          </div>
          <div className='text-sm text-muted-foreground'>
            {currentIndex + 1} / {totalCards}
          </div>
        </div>
        {/* Progress Bar */}
        <Progress 
          value={progressPercentage} 
          className='h-2 w-full rounded-none bg-gray-200/50'
        />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex items-center justify-between p-8 relative'>
        {/* Previous Button */}
        <Button
          onClick={navigatePrevious}
          disabled={currentIndex === 0}
          variant='ghost'
          size='icon'
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12',
            'bg-background/80 hover:bg-background/90',
            'transition-opacity',
            currentIndex === 0 && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ChevronLeft className='h-8 w-8' />
        </Button>

        {/* Card Display */}
        <div className={cn('w-full max-w-4xl mx-auto px-16', shouldShake && 'shake')}>
          <div className='relative w-full' style={{ minHeight: '400px' }}>
            {transitions((style, index) => {
              const card = set.flashcards[index];
              if (!card) return null;

              return (
                <animated.div style={style} className='absolute w-full'>
                  <div
                    className='relative w-full cursor-pointer'
                    style={{ perspective: '1200px' }}
                    onClick={toggleFlip}
                  >
                    <div
                      className='relative w-full'
                      style={{ minHeight: '400px' }}
                    >
                      {/* Question Side */}
                      <animated.div
                        className='absolute w-full h-full'
                        style={{
                          opacity: opacity.to((o) => 1 - o),
                          transform,
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <div
                          className='w-full h-full rounded-2xl shadow-xl flex items-center justify-center p-12 relative overflow-hidden'
                          style={{
                            borderStyle: set.config?.questionBorderStyle === 'none' ? 'none' : (set.config?.questionBorderStyle || 'solid'),
                            borderWidth: set.config?.questionBorderStyle === 'none' ? '0' : (set.config?.questionBorderWidth || '2px'),
                            borderColor: set.config?.questionBorderColor || '#e5e7eb',
                            ...(set.config?.questionBackgroundPattern && set.config.questionBackgroundPattern !== 'none'
                              ? getPatternById(set.config.questionBackgroundPattern)?.getCSS(set.config?.questionBgColor || '#ffffff')
                              : { backgroundColor: set.config?.questionBgColor || '#ffffff' }),
                            color: set.config?.questionFgColor || '#000000',
                            fontFamily:
                              set.config?.questionFontFamily || 'Inter',
                            minHeight: '400px',
                          }}
                        >
                          {/* Background Image */}
                          {(set.config?.questionBackgroundImage || set.config?.backgroundImage) && (
                            <div
                              className='absolute inset-0 z-0'
                              style={{
                                backgroundImage: `url(${set.config?.questionBackgroundImage || set.config?.backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                opacity: set.config?.questionBackgroundImageOpacity !== undefined 
                                  ? set.config.questionBackgroundImageOpacity 
                                  : (set.config?.backgroundImageOpacity || 0.3),
                              }}
                            />
                          )}
                          <div className='text-center relative z-10'>
                            <div
                              className='text-2xl leading-relaxed prose prose-lg max-w-none select-none'
                              style={{
                                fontSize: set.config?.questionFontSize
                                  ? `${
                                      parseInt(set.config.questionFontSize) *
                                      1.5
                                    }px`
                                  : '24px',
                                fontFamily:
                                  set.config?.questionFontFamily || 'Inter',
                                color: set.config?.questionFgColor || '#000000',
                                userSelect: 'none',
                              }}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkHighlight]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  p: ({ children }) => (
                                    <p
                                      className='m-0'
                                      style={{ fontFamily: 'inherit' }}
                                    >
                                      {children}
                                    </p>
                                  ),
                                  mark: ({ children }) => (
                                    <mark className='bg-yellow-200 px-1 rounded'>
                                      {children}
                                    </mark>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className='font-bold'>
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className='italic'>{children}</em>
                                  ),
                                  code: ({ children }) => (
                                    <code className='bg-gray-100 px-1 rounded'>
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {card.question}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </animated.div>

                      {/* Answer Side */}
                      <animated.div
                        className='w-full h-full'
                        style={{
                          opacity,
                          transform,
                          ...(flipAxis === 'Y'
                            ? { rotateY: '180deg' }
                            : { rotateX: '180deg' }),
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <div
                          className='w-full h-full rounded-2xl shadow-xl flex items-center justify-center p-12 relative overflow-hidden'
                          style={{
                            borderStyle: set.config?.answerBorderStyle === 'none' ? 'none' : (set.config?.answerBorderStyle || 'solid'),
                            borderWidth: set.config?.answerBorderStyle === 'none' ? '0' : (set.config?.answerBorderWidth || '2px'),
                            borderColor: set.config?.answerBorderColor || '#e5e7eb',
                            ...(set.config?.answerBackgroundPattern && set.config.answerBackgroundPattern !== 'none'
                              ? getPatternById(set.config.answerBackgroundPattern)?.getCSS(set.config?.answerBgColor || '#f3f4f6')
                              : { backgroundColor: set.config?.answerBgColor || '#f3f4f6' }),
                            color: set.config?.answerFgColor || '#000000',
                            fontFamily: set.config?.answerFontFamily || 'Inter',
                            minHeight: '400px',
                          }}
                        >
                          {/* Background Image */}
                          {(set.config?.answerBackgroundImage || set.config?.backgroundImage) && (
                            <div
                              className='absolute inset-0 z-0'
                              style={{
                                backgroundImage: `url(${set.config?.answerBackgroundImage || set.config?.backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                opacity: set.config?.answerBackgroundImageOpacity !== undefined 
                                  ? set.config.answerBackgroundImageOpacity 
                                  : (set.config?.backgroundImageOpacity || 0.3),
                              }}
                            />
                          )}
                          <div className='text-center relative z-10'>
                            <div
                              className='text-2xl leading-relaxed prose prose-lg max-w-none select-none'
                              style={{
                                fontSize: set.config?.answerFontSize
                                  ? `${
                                      parseInt(set.config.answerFontSize) * 1.5
                                    }px`
                                  : '24px',
                                fontFamily:
                                  set.config?.answerFontFamily || 'Inter',
                                color: set.config?.answerFgColor || '#000000',
                                userSelect: 'none',
                              }}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkHighlight]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  p: ({ children }) => (
                                    <p
                                      className='m-0'
                                      style={{ fontFamily: 'inherit' }}
                                    >
                                      {children}
                                    </p>
                                  ),
                                  mark: ({ children }) => (
                                    <mark className='bg-yellow-200 px-1 rounded'>
                                      {children}
                                    </mark>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className='font-bold'>
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className='italic'>{children}</em>
                                  ),
                                  code: ({ children }) => (
                                    <code className='bg-gray-100 px-1 rounded'>
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {card.answer}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </animated.div>
                    </div>
                  </div>
                </animated.div>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        <Button
          onClick={navigateNext}
          disabled={currentIndex === totalCards - 1}
          variant='ghost'
          size='icon'
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12',
            'bg-background/80 hover:bg-background/90',
            'transition-opacity',
            currentIndex === totalCards - 1 && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ChevronRight className='h-8 w-8' />
        </Button>
      </div>

      {/* Footer with instructions */}
      <div className='border-t p-4'>
        <div className='flex justify-center items-center gap-6 text-xs text-muted-foreground'>
          <span>← → Navigate</span>
          <span>Space/Click to flip</span>
          <span>ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
