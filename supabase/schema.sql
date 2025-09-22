-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial', 'expired');
CREATE TYPE visibility AS ENUM ('private', 'public', 'unlisted');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  max_sets INTEGER DEFAULT 5,
  max_cards_per_set INTEGER DEFAULT 50,
  ai_generations_per_month INTEGER DEFAULT 10,
  ai_generations_used INTEGER DEFAULT 0,
  ai_generation_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcard sets table
CREATE TABLE flashcard_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility visibility DEFAULT 'private',
  tags TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"total_reviews": 0, "average_accuracy": 0, "last_reviewed": null}',
  share_code TEXT UNIQUE,
  fork_count INTEGER DEFAULT 0,
  forked_from UUID REFERENCES flashcard_sets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"reviews": 0, "correct": 0, "incorrect": 0, "last_reviewed": null}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(set_id, position)
);

-- Shared sets access table
CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  shared_with_user UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  can_edit BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(set_id, shared_with_user),
  UNIQUE(set_id, shared_with_email)
);

-- Study sessions table for analytics
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  cards_studied INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX idx_flashcard_sets_visibility ON flashcard_sets(visibility);
CREATE INDEX idx_flashcard_sets_share_code ON flashcard_sets(share_code);
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_shared_access_set_id ON shared_access(set_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_set_id ON study_sessions(set_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for flashcard_sets
CREATE POLICY "Users can view their own sets"
  ON flashcard_sets FOR SELECT
  USING (
    user_id = auth.uid() OR
    visibility = 'public' OR
    (visibility = 'unlisted' AND share_code IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE shared_access.set_id = flashcard_sets.id
      AND (shared_access.shared_with_user = auth.uid() OR 
           shared_access.shared_with_email = auth.email())
    )
  );

CREATE POLICY "Users can create their own sets"
  ON flashcard_sets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sets or shared sets with edit permission"
  ON flashcard_sets FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE shared_access.set_id = flashcard_sets.id
      AND shared_access.shared_with_user = auth.uid()
      AND shared_access.can_edit = TRUE
    )
  );

CREATE POLICY "Users can delete their own sets"
  ON flashcard_sets FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for flashcards
CREATE POLICY "Users can view flashcards from accessible sets"
  ON flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND (
        flashcard_sets.user_id = auth.uid() OR
        flashcard_sets.visibility = 'public' OR
        (flashcard_sets.visibility = 'unlisted' AND flashcard_sets.share_code IS NOT NULL) OR
        EXISTS (
          SELECT 1 FROM shared_access
          WHERE shared_access.set_id = flashcard_sets.id
          AND (shared_access.shared_with_user = auth.uid() OR 
               shared_access.shared_with_email = auth.email())
        )
      )
    )
  );

CREATE POLICY "Users can create flashcards in their own sets or shared sets with edit permission"
  ON flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND (
        flashcard_sets.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_access
          WHERE shared_access.set_id = flashcard_sets.id
          AND shared_access.shared_with_user = auth.uid()
          AND shared_access.can_edit = TRUE
        )
      )
    )
  );

CREATE POLICY "Users can update flashcards in their own sets or shared sets with edit permission"
  ON flashcards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND (
        flashcard_sets.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_access
          WHERE shared_access.set_id = flashcard_sets.id
          AND shared_access.shared_with_user = auth.uid()
          AND shared_access.can_edit = TRUE
        )
      )
    )
  );

CREATE POLICY "Users can delete flashcards from their own sets"
  ON flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND flashcard_sets.user_id = auth.uid()
    )
  );

-- RLS Policies for shared_access
CREATE POLICY "Set owners can manage sharing"
  ON shared_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = shared_access.set_id
      AND flashcard_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view shares they have access to"
  ON shared_access FOR SELECT
  USING (
    shared_with_user = auth.uid() OR
    shared_with_email = auth.email()
  );

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_sets_updated_at
  BEFORE UPDATE ON flashcard_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, username, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to reset AI generation count monthly
CREATE OR REPLACE FUNCTION reset_ai_generations()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    ai_generations_used = 0,
    ai_generation_reset_at = NOW() + INTERVAL '1 month'
  WHERE ai_generation_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to check user limits
CREATE OR REPLACE FUNCTION check_user_limits()
RETURNS TRIGGER AS $$
DECLARE
  current_sets INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Check for flashcard_sets insert
  IF TG_TABLE_NAME = 'flashcard_sets' THEN
    SELECT COUNT(*), MAX(max_sets)
    INTO current_sets, max_allowed
    FROM flashcard_sets
    JOIN user_profiles ON user_profiles.id = NEW.user_id
    WHERE flashcard_sets.user_id = NEW.user_id
    GROUP BY user_profiles.max_sets;
    
    IF max_allowed IS NOT NULL AND current_sets >= max_allowed THEN
      RAISE EXCEPTION 'Set limit reached for your subscription tier';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_set_limits
  BEFORE INSERT ON flashcard_sets
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limits();