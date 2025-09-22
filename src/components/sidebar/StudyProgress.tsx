import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useFlashcardContext } from '@/contexts/FlashcardContext';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Progress } from '@/components/ui/progress';

export function StudyProgress() {
  const { sets } = useFlashcardContext();
  
  // Calculate progress for each set (in a real app, this would track actual study progress)
  const setsWithProgress = sets.map(set => ({
    ...set,
    // Mock progress - in reality, this would be tracked per card
    progress: (set.cardCount ?? set.flashcards?.length ?? 0) > 0 ? Math.floor(Math.random() * 100) : 0
  })).slice(0, 3); // Show only top 3 sets

  const overallProgress = setsWithProgress.length > 0
    ? Math.round(setsWithProgress.reduce((sum, set) => sum + set.progress, 0) / setsWithProgress.length)
    : 0;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <BarChart3 className="h-4 w-4 inline mr-2" />
        Progress
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="space-y-3 px-2">
          {/* Overall Progress */}
          <div className="p-3 rounded-lg border bg-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall</span>
              <span className="text-sm font-semibold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Keep up the great work!
              </span>
            </div>
          </div>

          {/* Individual Set Progress */}
          {setsWithProgress.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium px-1">
                Recent Sets
              </div>
              {setsWithProgress.map((set) => (
                <div key={set.id} className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs truncate flex-1">{set.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {set.progress}%
                    </span>
                  </div>
                  <Progress value={set.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">
              No sets to track yet
            </div>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}