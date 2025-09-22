import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Award } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { FlashcardSet } from '@/types';
import { UnifiedStorageService } from '@/services/unified-storage';
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
  const [dbTotalSets, setDbTotalSets] = useState(0);
  const [dbTotalCards, setDbTotalCards] = useState(0);

  // Calculate local counts from the current flashcardSets
  const localTotalSets = flashcardSets.length;
  const localTotalCards = flashcardSets.reduce((sum, set) => sum + (set.flashcards?.length || 0), 0);

  // Use the higher value between local and database counts for consistency
  const totalSets = Math.max(localTotalSets, dbTotalSets);
  const totalCards = Math.max(localTotalCards, dbTotalCards);

  // Fetch from database on mount and when user changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await UnifiedStorageService.getStatsCounts();
        setDbTotalSets(stats.totalSets);
        setDbTotalCards(stats.totalCards);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep default values of 0
      }
    };

    fetchStats();
  }, [user?.id]); // Only refetch when user changes

  // Also update database counts after a delay when local data changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const stats = await UnifiedStorageService.getStatsCounts();
        setDbTotalSets(stats.totalSets);
        setDbTotalCards(stats.totalCards);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }, 1000); // Wait 1 second for saves to complete

    return () => clearTimeout(timer);
  }, [localTotalSets, localTotalCards]); // Update after local changes

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
