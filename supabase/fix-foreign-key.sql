-- Fix foreign key constraint issue
-- The table is trying to reference user_profiles instead of auth.users

-- First, check what foreign key constraints exist
-- DROP the incorrect constraint if it exists
ALTER TABLE flashcard_sets 
DROP CONSTRAINT IF EXISTS flashcard_sets_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE flashcard_sets 
ADD CONSTRAINT flashcard_sets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Also check if there's a user_profiles table that shouldn't be there
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Verify the flashcard_sets table structure
-- This should now reference auth.users directly