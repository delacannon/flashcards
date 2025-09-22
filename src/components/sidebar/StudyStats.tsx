import React from 'react';
import { Brain, TrendingUp, Target, Award } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { FlashcardSet } from '@/types';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

interface StudyStatsProps {
  user: User | null;
  flashcardSets: FlashcardSet[];
}

export function StudyStats({ user, flashcardSets }: StudyStatsProps) {
  // Calculate stats directly from flashcardSets data (no extra queries needed!)
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, set) => sum + (set.cardCount ?? set.flashcards?.length ?? 0), 0);

  // In a real app, these would be tracked in state/database
  const studyStreak = 5; // Example: 5 days
  const cardsStudiedToday = 12; // Example

  const stats = [
    {
      icon: Brain,
      label: 'Total Sets',
      value: totalSets,
      color: 'text-gray-400',
    },
    {
      icon: Target,
      label: 'Total Cards',
      value: totalCards,
      color: 'text-gray-400',
    },
    {
      icon: TrendingUp,
      label: 'Study Streak',
      value: `${studyStreak} days`,
      color: 'text-gray-400',
    },
    {
      icon: Award,
      label: 'Today',
      value: `${cardsStudiedToday} cards`,
      color: 'text-gray-400',
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Study Overview</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className='grid grid-cols-2 gap-3 px-2'>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className='flex flex-col items-center justify-center p-3 rounded-lg bg-background border hover:bg-accent/50 transition-colors'
              >
                <Icon className={`h-5 w-5 ${stat.color} mb-1`} />
                <span className='text-xs text-muted-foreground'>
                  {stat.label}
                </span>
                <span className='text-sm font-semibold'>{stat.value}</span>
              </div>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}