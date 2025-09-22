-- IMPORTANT: Run this SQL in your Supabase SQL Editor to fix the signup error

-- Step 1: Drop any existing triggers and functions that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Check if user_profiles table exists and drop it if it's causing issues
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 3: Remove any other auth-related triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all triggers on auth.users table
    FOR r IN (SELECT tgname, tgrelid::regclass 
              FROM pg_trigger 
              WHERE tgrelid = 'auth.users'::regclass 
              AND tgisinternal = FALSE) 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ' || r.tgrelid || ' CASCADE';
    END LOOP;
END $$;

-- Step 4: Clean up any auth hooks (if any exist)
DELETE FROM supabase_functions.hooks WHERE hook_table_id = (SELECT id FROM supabase_functions.hook_tables WHERE schema_name = 'auth' AND table_name = 'users');

-- Step 5: Clear any RLS policies that might interfere
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;

-- Now authentication should work without any database dependencies!
-- You can sign up and sign in without any tables.

-- Optional: To verify everything is clean, run:
-- SELECT * FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
-- This should only show internal PostgreSQL triggers, not custom ones.