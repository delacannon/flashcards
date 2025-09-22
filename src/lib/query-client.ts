import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - increased for better caching
      gcTime: 1000 * 60 * 15, // 15 minutes - increased garbage collection time
      retry: 2, // Slightly more retries for better reliability
      refetchOnWindowFocus: false, // Disable auto-refetch on window focus
      refetchOnMount: true, // Revert to boolean for compatibility
      refetchOnReconnect: true, // Revert to boolean for compatibility
      refetchInterval: false, // Disable default polling - let components opt-in
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});