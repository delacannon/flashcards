import React, { memo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { patterns } from '@/lib/patterns';
import { cn } from '@/lib/utils';

interface PatternGalleryProps {
  selectedPattern?: string;
  onSelectPattern: (patternId: string) => void;
  baseColor: string;
  label?: string;
}

export const PatternGallery = memo(function PatternGallery({
  selectedPattern = 'none',
  onSelectPattern,
  baseColor,
  label = 'Background Pattern'
}: PatternGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        scrollElement.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label}</label>
      <div className="relative">
        {/* Left scroll button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm",
            !canScrollLeft && "hidden"
          )}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Right scroll button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm",
            !canScrollRight && "hidden"
          )}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Pattern gallery */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => onSelectPattern(pattern.id)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all overflow-hidden",
                selectedPattern === pattern.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50"
              )}
              style={pattern.preview(baseColor)}
            >
              <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur-sm px-1 py-0.5">
                <span className="text-[10px] font-medium">{pattern.name}</span>
              </div>
              {selectedPattern === pattern.id && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

interface PatternSelectorProps {
  questionPattern?: string;
  answerPattern?: string;
  onQuestionPatternChange: (pattern: string) => void;
  onAnswerPatternChange: (pattern: string) => void;
  questionColor: string;
  answerColor: string;
}

export const PatternSelector = memo(function PatternSelector({
  questionPattern = 'none',
  answerPattern = 'none',
  onQuestionPatternChange,
  onAnswerPatternChange,
  questionColor,
  answerColor
}: PatternSelectorProps) {
  return (
    <div className="space-y-4">
      <PatternGallery
        label="Question Background Pattern"
        selectedPattern={questionPattern}
        onSelectPattern={onQuestionPatternChange}
        baseColor={questionColor}
      />
      <PatternGallery
        label="Answer Background Pattern"
        selectedPattern={answerPattern}
        onSelectPattern={onAnswerPatternChange}
        baseColor={answerColor}
      />
    </div>
  );
});