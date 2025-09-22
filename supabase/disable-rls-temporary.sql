-- TEMPORARY SOLUTION: Disable RLS completely to test if the app works
-- Run this to disable RLS and test the connection

-- Disable RLS on both tables
ALTER TABLE flashcard_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;

-- This will make the tables accessible to all authenticated users
-- You should only use this for testing!

-- To re-enable RLS later, run:
-- ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;