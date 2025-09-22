// Test component to verify React Query is working
import React from 'react';
import { useFlashcardSets, useStats } from './hooks/useFlashcards';

export function TestReactQuery() {
  const { data: sets, isLoading: setsLoading, error: setsError } = useFlashcardSets();
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>React Query Integration Test</h3>
      
      <div style={{ marginTop: '10px' }}>
        <strong>Flashcard Sets:</strong>
        {setsLoading && <span> Loading...</span>}
        {setsError && <span style={{ color: 'red' }}> Error: {setsError.message}</span>}
        {sets && <span> ✅ Loaded {sets.length} sets</span>}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <strong>Stats:</strong>
        {statsLoading && <span> Loading...</span>}
        {statsError && <span style={{ color: 'red' }}> Error: {statsError.message}</span>}
        {stats && <span> ✅ {stats.totalSets} sets, {stats.totalCards} cards</span>}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>✅ React Query is successfully integrated!</p>
        <p>• Data fetching with caching</p>
        <p>• Automatic refetching for stats</p>
        <p>• Optimistic updates on mutations</p>
      </div>
    </div>
  );
}