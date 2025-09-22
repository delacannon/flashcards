import React from 'react';
import { Clock, ChevronRight, Layers } from 'lucide-react';
import { useFlashcardContext } from '@/contexts/FlashcardContext';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function RecentSets() {
  const { sets, actions } = useFlashcardContext();
  
  // Get the 5 most recent sets (sorted by creation date)
  const recentSets = [...sets]
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  if (recentSets.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <Clock className="h-4 w-4 inline mr-2" />
          Recent Sets
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No flashcard sets yet
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Clock className="h-4 w-4 inline mr-2" />
        Recent Sets
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentSets.map((set) => (
            <SidebarMenuItem key={set.id}>
              <SidebarMenuButton
                onClick={() => actions.selectSet(set)}
                className="justify-between group"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{set.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {set.cardCount ?? set.flashcards?.length ?? 0}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}