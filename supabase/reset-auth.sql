-- Nuclear option: Reset auth to factory settings
-- WARNING: This will not delete users but will remove any custom auth configuration

-- Remove all custom schemas, tables, functions related to user profiles
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Re-enable standard extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- Auth should now work with defaults
-- You can sign up/sign in without any custom tables or triggers