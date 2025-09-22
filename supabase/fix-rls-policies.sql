-- Fix RLS Policies - Remove infinite recursion

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can create own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can update own flashcard sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can delete own flashcard sets" ON flashcard_sets;

DROP POLICY IF EXISTS "Users can view flashcards from own sets" ON flashcards;
DROP POLICY IF EXISTS "Users can create flashcards in own sets" ON flashcards;
DROP POLICY IF EXISTS "Users can update flashcards in own sets" ON flashcards;
DROP POLICY IF EXISTS "Users can delete flashcards from own sets" ON flashcards;

-- Recreate simpler policies for flashcard_sets
CREATE POLICY "Enable all for users own sets"
  ON flashcard_sets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate simpler policies for flashcards
-- This avoids the subquery that was causing recursion
CREATE POLICY "Enable read for flashcards"
  ON flashcards FOR SELECT
  USING (
    set_id IN (
      SELECT id FROM flashcard_sets 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (
    set_id IN (
      SELECT id FROM flashcard_sets 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for flashcards"
  ON flashcards FOR UPDATE
  USING (
    set_id IN (
      SELECT id FROM flashcard_sets 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for flashcards"
  ON flashcards FOR DELETE
  USING (
    set_id IN (
      SELECT id FROM flashcard_sets 
      WHERE user_id = auth.uid()
    )
  );