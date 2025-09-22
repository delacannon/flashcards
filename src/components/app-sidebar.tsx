import * as React from 'react';
import { Plus, Home, Settings, Search, BookOpen } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { NavUser } from '@/components/nav-user';
import { StudyStats } from '@/components/sidebar/StudyStats';
import { RecentSets } from '@/components/sidebar/RecentSets';
import { StudyTools } from '@/components/sidebar/StudyTools';
import { StudyProgress } from '@/components/sidebar/StudyProgress';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { useFlashcardContext } from '@/contexts/FlashcardContext';

import type { FlashcardSet } from '@/types';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null;
  onSignOut: () => Promise<{ error: Error | null }>;
  onShowAuthModal: () => void;
  flashcardSets: FlashcardSet[];
}

export function AppSidebar({ user, onSignOut, onShowAuthModal, flashcardSets, ...props }: AppSidebarProps) {
  const { actions, selectedSet } = useFlashcardContext();
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <Sidebar {...props}>
      <SidebarHeader className='border-sidebar-border h-16 border-b'>
        <NavUser user={user} onSignOut={onSignOut} onShowAuthModal={onShowAuthModal} />
      </SidebarHeader>

      <SidebarContent>
        {/* Search Bar */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className='px-2 py-2'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search cards...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}

        <SidebarSeparator />

        {/* Study Stats */}
        <StudyStats user={user} flashcardSets={flashcardSets} />

        <SidebarSeparator />

        {/* Study Tools */}
        <StudyTools />

        <SidebarSeparator />

        {/* Progress */}
        <StudyProgress />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className='h-4 w-4' />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
