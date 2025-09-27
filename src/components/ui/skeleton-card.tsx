import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showActions?: boolean;
}

export function SkeletonCard({ className, showActions = true }: SkeletonCardProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Main card skeleton matching actual flashcard dimensions */}
      <div className='h-[200px] rounded-lg bg-muted/30 animate-pulse border border-border/40 shadow-sm'>
        {/* Content placeholder matching flashcard content layout */}
        <div className='p-6 space-y-4 h-full flex flex-col'>
          {/* Question area */}
          <div className='space-y-2 flex-1'>
            <div className='h-3 bg-muted/60 rounded w-16'></div>
            <div className='h-5 bg-muted/80 rounded w-4/5'></div>
            <div className='h-5 bg-muted/80 rounded w-3/5'></div>
          </div>
          
          {/* Answer hint area */}
          <div className='space-y-2 mt-auto'>
            <div className='h-3 bg-muted/40 rounded w-12'></div>
            <div className='h-4 bg-muted/50 rounded w-2/3'></div>
          </div>
        </div>
      </div>
      
      {/* Action buttons skeleton - matching actual card buttons */}
      {showActions && (
        <div className='absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity flex gap-2'>
          <div className='h-8 w-8 rounded-md bg-muted/60 animate-pulse'></div>
          <div className='h-8 w-8 rounded-md bg-muted/60 animate-pulse'></div>
        </div>
      )}
    </div>
  );
}

// Loading state for a grid of skeleton cards
interface SkeletonCardGridProps {
  count: number;
  className?: string;
}

export function SkeletonCardGrid({ count, className }: SkeletonCardGridProps) {
  return (
    <div className={cn('grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard 
          key={`skeleton-${index}`}
          // Add staggered animation delay for a nicer effect
          className={`animate-in fade-in-50 duration-500`}
          style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}