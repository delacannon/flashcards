-- CLEAN SCHEMA - Start fresh with correct references
-- Run this to create a working schema without user_profiles dependency

-- 1. Drop everything first (if exists)
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS flashcard_sets CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create flashcard_sets table with CORRECT foreign key to auth.users
CREATE TABLE flashcard_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);

-- 6. OPTIONAL: Enable RLS (comment out if you want to test without it first)
-- ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- 7. OPTIONAL: Simple RLS policies (comment out if testing without RLS)
-- CREATE POLICY "Users own their sets"
--   ON flashcard_sets FOR ALL
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Authenticated users can manage flashcards"
--   ON flashcards FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- 8. Verify the setup
-- You should now be able to insert into flashcard_sets with your user_id