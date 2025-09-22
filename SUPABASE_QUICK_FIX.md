# Quick Fix for Database Error

The signup error occurs because the database trigger is trying to create a user profile. Here are two solutions:

## Solution 1: Remove the Trigger (Recommended for Testing)

Run this SQL in your Supabase SQL editor:

```sql
-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
```

## Solution 2: Create Minimal Tables

If you haven't created any tables yet, run this minimal SQL first:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create minimal user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
```

## Testing Without Database

For immediate testing, you can also comment out the profile creation in the AuthContext:

1. Open `src/contexts/AuthContext.tsx`
2. Comment out lines 72-84 (the profile creation after signup)
3. Comment out lines 103-117 (the profile check after signin)

This will allow you to test authentication without any database tables.

## After Testing

Once authentication is working, you can run the full schema from `supabase/schema.sql` to enable all features.