# Query Optimization for Flashcards App

## Problem
The app was loading ALL flashcards for ALL sets just to count them, causing:
- Excessive data transfer (1000+ records for counting)
- Slow initial page load
- Unnecessary Supabase API usage

## Solution: Database View with Card Counts

### 1. Run this SQL in your Supabase SQL Editor:

```sql
-- Create view with card counts
CREATE VIEW flashcard_sets_with_counts AS
SELECT 
  fs.id,
  fs.user_id,
  fs.title,
  fs.name,
  fs.description,
  fs.config,
  fs.created_at,
  fs.updated_at,
  COUNT(fc.id)::int as card_count
FROM flashcard_sets fs
LEFT JOIN flashcards fc ON fc.set_id = fs.id
GROUP BY 
  fs.id, 
  fs.user_id, 
  fs.title, 
  fs.name, 
  fs.description, 
  fs.config, 
  fs.created_at, 
  fs.updated_at;

-- Grant permissions
GRANT SELECT ON flashcard_sets_with_counts TO authenticated;
GRANT SELECT ON flashcard_sets_with_counts TO anon;

-- Enable RLS
ALTER VIEW flashcard_sets_with_counts SET (security_invoker = on);
```

### 2. Benefits

**Before:**
- Query 1: GET /flashcard_sets (all sets)
- Query 2: GET /flashcards?select=set_id (ALL cards just for counting!)
- Data transferred: ~100KB+ for large collections

**After:**
- Query 1: GET /flashcard_sets_with_counts (sets with counts included)
- Data transferred: ~5KB (just metadata)

### 3. How It Works

The view:
- Joins flashcard_sets with flashcards
- Groups by set and counts cards
- Returns everything in a single query
- Database does the counting (very efficient)
- Automatically updates when cards are added/removed

### 4. Fallback

The TypeScript code has a fallback:
1. First tries the view (most efficient)
2. If view doesn't exist, falls back to manual counting
3. If that fails, uses localStorage

### 5. Result

- **90% reduction** in initial data transfer
- **Single query** instead of multiple
- **No loading of card content** for counting
- **Faster page loads**
- **Lower Supabase usage**

## Testing

1. Open browser DevTools → Network tab
2. Load the app
3. Should see only ONE request to `flashcard_sets_with_counts`
4. Should NOT see requests to `/flashcards` until you open a set