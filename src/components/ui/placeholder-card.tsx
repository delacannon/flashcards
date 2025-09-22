import React from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderCardProps {
  className?: string;
  // Style configuration from flashcard set
  bgColor?: string;
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
}

// Individual placeholder card that matches FlipCard dimensions exactly
export function PlaceholderCard({ 
  className,
  bgColor,
  borderStyle = 'solid',
  borderWidth = '1px', 
  borderColor = '#e5e7eb',
  backgroundImage,
  backgroundImageOpacity = 0.3
}: PlaceholderCardProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Main card matching FlipCard structure - FIXED HEIGHT, no size change */}
      <div 
        className='w-full h-[200px] rounded-xl shadow-sm relative overflow-hidden'
        style={{
          borderStyle: borderStyle === 'none' ? 'none' : borderStyle,
          borderWidth: borderStyle === 'none' ? '0' : borderWidth,
          borderColor: borderColor,
          backgroundColor: bgColor ? `${bgColor}30` : 'rgb(var(--background) / 0.5)', // 30% opacity of configured color
          animation: 'opacityPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        {/* Background Image if configured */}
        {backgroundImage && (
          <div
            className='absolute inset-0 z-0'
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: backgroundImageOpacity * 0.3, // Even more subtle for placeholder
            }}
          />
        )}
        
        {/* Subtle gradient overlay */}
        <div className='absolute inset-0 opacity-50'>
          <div className='h-full w-full bg-gradient-to-br from-muted/20 to-muted/10' />
        </div>
        
        {/* Action buttons placeholder - matching the edit/delete buttons position */}
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-10 transition-opacity flex gap-1 z-20'>
          <div className='h-8 w-8 rounded-md bg-muted/20' />
          <div className='h-8 w-8 rounded-md bg-muted/20' />
        </div>
        
        {/* Content area matching FlipCard's centered layout - FIXED positioning */}
        <div className='absolute inset-0 flex items-center justify-center p-6'>
          <div className='text-center w-full'>
            {/* Top skeleton lines - simulating question content */}
            <div className='space-y-2 mb-8'>
              <div className='h-4 bg-primary/20 rounded w-3/4 mx-auto' />
              <div className='h-4 bg-primary/15 rounded w-5/6 mx-auto' />
              <div className='h-4 bg-primary/10 rounded w-1/2 mx-auto' />
            </div>
            
            {/* Bottom skeleton lines - simulating additional content */}
            <div className='space-y-2'>
              <div className='h-3 bg-primary/10 rounded w-2/3 mx-auto' />
              <div className='h-3 bg-primary/8 rounded w-1/2 mx-auto' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid of placeholder cards
interface PlaceholderCardGridProps {
  count: number;
  className?: string;
  // Pass through style configuration
  config?: {
    questionBgColor?: string;
    questionBorderStyle?: string;
    questionBorderWidth?: string;
    questionBorderColor?: string;
    questionBackgroundImage?: string;
    questionBackgroundImageOpacity?: number;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
  };
}

export function PlaceholderCardGrid({ count, className, config }: PlaceholderCardGridProps) {
  return (
    <div className={cn('grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <PlaceholderCard 
          key={`placeholder-${index}`}
          className='opacity-80'
          bgColor={config?.questionBgColor}
          borderStyle={config?.questionBorderStyle}
          borderWidth={config?.questionBorderWidth}
          borderColor={config?.questionBorderColor}
          backgroundImage={config?.questionBackgroundImage || config?.backgroundImage}
          backgroundImageOpacity={config?.questionBackgroundImageOpacity ?? config?.backgroundImageOpacity}
        />
      ))}
    </div>
  );
}