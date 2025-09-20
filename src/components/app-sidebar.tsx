import * as React from 'react';
import { Plus, Home, Settings, Search, BookOpen } from 'lucide-react';

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

// This is sample data for the user
const userData = {
  user: {
    name: 'Student',
    email: 'student@flashcards.app',
    avatar: '/avatars/shadcn.jpg',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { actions, selectedSet } = useFlashcardContext();
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <Sidebar {...props}>
      <SidebarHeader className='border-sidebar-border h-16 border-b'>
        <NavUser user={userData.user} />
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
        <StudyStats />

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
