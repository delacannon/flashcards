-- Create optimized function to get user stats in a single query
-- This replaces the multiple query approach in getStatsCounts

CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS TABLE (
  total_sets INTEGER,
  total_cards INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT fs.id)::INTEGER as total_sets,
    COUNT(fc.id)::INTEGER as total_cards
  FROM flashcard_sets fs
  LEFT JOIN flashcards fc ON fs.id = fc.set_id
  WHERE fs.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- Add RLS policy for the function (if needed)
-- The function uses SECURITY DEFINER, so it runs with the privileges of the function owner
-- but we can add additional checks if needed

-- Optional: Create an index to optimize the stats query if not already exists
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);