-- Create a view that includes card counts for each flashcard set
-- This eliminates the need to load all flashcards just for counting

-- Drop the view if it exists (for re-running)
DROP VIEW IF EXISTS flashcard_sets_with_counts CASCADE;

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

-- Grant permissions to authenticated users
GRANT SELECT ON flashcard_sets_with_counts TO authenticated;
GRANT SELECT ON flashcard_sets_with_counts TO anon;

-- Add RLS policies (inherit from base table)
-- The view will use the security context of the user querying it
ALTER VIEW flashcard_sets_with_counts SET (security_invoker = on);

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);

-- Add index on set_id in flashcards for better join performance
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);

-- Create a comment explaining the view
COMMENT ON VIEW flashcard_sets_with_counts IS 
'View that includes flashcard sets with their card counts. Used for efficient lazy loading without fetching all flashcard content.';