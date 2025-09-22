import React from 'react';
import {
  BookOpen,
  Shuffle,
  Timer,
  Zap,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useFlashcardContext } from '@/contexts/FlashcardContext';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function StudyTools() {
  const { sets } = useFlashcardContext();

  const totalCards = sets.reduce((sum, set) => sum + (set.cardCount ?? set.flashcards?.length ?? 0), 0);
  const hasCards = totalCards > 0;

  const tools = [
    {
      icon: Zap,
      label: 'Quick Study',
      description: 'Random cards from all sets',
      color: 'text-gray-500',
      action: () => {
        // TODO: Implement quick study mode
        console.log('Starting quick study...');
      },
    },
    {
      icon: BookOpen,
      label: 'Practice Mode',
      description: 'Study without scoring',
      color: 'text-gray-500',
      action: () => {
        // TODO: Implement practice mode
        console.log('Starting practice mode...');
      },
    },
    {
      icon: Timer,
      label: 'Speed Review',
      description: 'Timed flashcard session',
      color: 'text-gray-500',
      action: () => {
        // TODO: Implement speed review
        console.log('Starting speed review...');
      },
    },
    {
      icon: GraduationCap,
      label: 'Quiz Mode',
      description: 'Test your knowledge',
      color: 'text-gray-500',
      action: () => {
        // TODO: Implement quiz mode
        console.log('Starting quiz mode...');
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Sparkles className='h-4 w-4 inline mr-2' />
        Study Tools
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className='space-y-2 px-2'>
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Button
                key={index}
                variant='outline'
                className='w-full justify-start text-left h-auto py-3 px-3 hover:bg-accent/50'
                onClick={tool.action}
                disabled={!hasCards}
              >
                <div className='flex items-start gap-3 w-full'>
                  <Icon
                    className={`h-5 w-5 ${tool.color} mt-0.5 flex-shrink-0`}
                  />
                  <div className='flex-1 space-y-0.5'>
                    <div className='font-medium text-sm'>{tool.label}</div>
                    <div className='text-xs text-muted-foreground'>
                      {tool.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
