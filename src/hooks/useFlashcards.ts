import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryResult
} from '@tanstack/react-query';
import { UnifiedStorageService } from '@/services/unified-storage';
import type { FlashcardSet } from '@/types';

// Query Keys
export const flashcardKeys = {
  all: ['flashcards'] as const,
  sets: () => [...flashcardKeys.all, 'sets'] as const,
  set: (id: string) => [...flashcardKeys.sets(), id] as const,
  stats: () => [...flashcardKeys.all, 'stats'] as const,
};

// Hook to fetch all flashcard sets
export function useFlashcardSets(): UseQueryResult<FlashcardSet[], Error> {
  return useQuery({
    queryKey: flashcardKeys.sets(),
    queryFn: () => UnifiedStorageService.loadSets(),
  });
}

// Hook to fetch a specific flashcard set with all its cards (lazy loading)
export function useFlashcardSet(setId: string | null): UseQueryResult<FlashcardSet | null, Error> {
  return useQuery({
    queryKey: flashcardKeys.set(setId || ''),
    queryFn: () => setId ? UnifiedStorageService.loadSetWithCards(setId) : Promise.resolve(null),
    enabled: !!setId, // Only run query if setId is provided
    staleTime: 1000 * 60 * 10, // 10 minutes - data remains fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache longer
    refetchOnMount: false, // Use cached data if available
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

// Hook to fetch stats with reduced auto-refresh
export function useStats(refetchInterval?: number) {
  return useQuery({
    queryKey: flashcardKeys.stats(),
    queryFn: () => UnifiedStorageService.getStatsCounts(),
    refetchInterval: refetchInterval || 30000, // Reduced from 5s to 30s default
    staleTime: 1000 * 60 * 2, // 2 minutes - consider stats stale less frequently
    gcTime: 1000 * 60 * 10, // 10 minutes - keep stats cached longer
  });
}

// Hook to create a new flashcard set
export function useCreateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newSet: FlashcardSet) => 
      UnifiedStorageService.createSet(newSet),
    onMutate: async (newSet) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: flashcardKeys.sets() });

      // Snapshot the previous value
      const previousSets = queryClient.getQueryData<FlashcardSet[]>(flashcardKeys.sets());

      // Optimistically update to the new value
      if (previousSets) {
        queryClient.setQueryData<FlashcardSet[]>(
          flashcardKeys.sets(),
          [...previousSets, newSet]
        );
      }

      // Return a context object with the snapshotted value
      return { previousSets };
    },
    onError: (err, newSet, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSets) {
        queryClient.setQueryData(flashcardKeys.sets(), context.previousSets);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: flashcardKeys.sets() });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.stats() });
      // Invalidate all individual set queries since they might be affected
      queryClient.invalidateQueries({ queryKey: [...flashcardKeys.sets()] });
    },
  });
}

// Hook to update a flashcard set
export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedSet: FlashcardSet) => 
      UnifiedStorageService.updateSet(updatedSet),
    onMutate: async (updatedSet) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: flashcardKeys.sets() });
      await queryClient.cancelQueries({ queryKey: flashcardKeys.set(updatedSet.id) });

      // Snapshot the previous values
      const previousSets = queryClient.getQueryData<FlashcardSet[]>(flashcardKeys.sets());
      const previousSet = queryClient.getQueryData<FlashcardSet>(flashcardKeys.set(updatedSet.id));

      // Optimistically update the sets list (including card count)
      if (previousSets) {
        queryClient.setQueryData<FlashcardSet[]>(
          flashcardKeys.sets(),
          previousSets.map(set => 
            set.id === updatedSet.id 
              ? { 
                  ...updatedSet, 
                  cardCount: updatedSet.flashcards?.length || 0 
                }
              : set
          )
        );
      }

      // Optimistically update the individual set cache (with card count)
      queryClient.setQueryData<FlashcardSet>(
        flashcardKeys.set(updatedSet.id),
        {
          ...updatedSet,
          cardCount: updatedSet.flashcards?.length || 0
        }
      );

      // Return a context object with the snapshotted values
      return { previousSets, previousSet };
    },
    onError: (err, updatedSet, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSets) {
        queryClient.setQueryData(flashcardKeys.sets(), context.previousSets);
      }
      if (context?.previousSet) {
        queryClient.setQueryData(flashcardKeys.set(updatedSet.id), context.previousSet);
      }
    },
    onSettled: (data, error, updatedSet) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: flashcardKeys.sets() });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.stats() });
      // Invalidate the specific set to ensure it's fresh
      queryClient.invalidateQueries({ queryKey: flashcardKeys.set(updatedSet.id) });
    },
  });
}

// Hook to delete a flashcard set
export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (setId: string) => 
      UnifiedStorageService.deleteSet(setId),
    onMutate: async (setId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: flashcardKeys.sets() });

      // Snapshot the previous value
      const previousSets = queryClient.getQueryData<FlashcardSet[]>(flashcardKeys.sets());

      // Optimistically update to the new value
      if (previousSets) {
        queryClient.setQueryData<FlashcardSet[]>(
          flashcardKeys.sets(),
          previousSets.filter(set => set.id !== setId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousSets };
    },
    onError: (err, setId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSets) {
        queryClient.setQueryData(flashcardKeys.sets(), context.previousSets);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: flashcardKeys.sets() });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.stats() });
      // Invalidate all individual set queries since they might be affected
      queryClient.invalidateQueries({ queryKey: [...flashcardKeys.sets()] });
    },
  });
}

// Hook for migration from localStorage to Supabase
export function useMigrateToSupabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => UnifiedStorageService.migrateLocalToSupabase(),
    onSuccess: () => {
      // Invalidate and refetch all queries after successful migration
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}