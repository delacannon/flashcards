# Supabase Setup Instructions

## Prerequisites
- A Supabase account and project created at https://supabase.com
- Your project URL and anon key (already configured in .env)

## Step-by-Step Setup

### 1. Database Schema Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the query to create all tables and policies

### 2. Storage Buckets Setup

1. Stay in the SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase/storage-buckets.sql`
4. Run the query to create storage buckets

### 3. Enable Email Authentication

1. Go to Authentication > Providers
2. Ensure Email provider is enabled
3. Configure email templates if desired (optional)

### 4. Configure Authentication Settings

1. Go to Authentication > Settings
2. Under "General Settings":
   - Set site URL to your production URL (or http://localhost:5173 for development)
   - Add http://localhost:5173 to redirect URLs
3. Under "Email Settings":
   - Configure SMTP if you want custom email sending (optional)
   - Otherwise, Supabase will handle emails

### 5. Test the Connection

1. Start your development server: `pnpm dev`
2. Open your browser to http://localhost:5173
3. Try creating a new account
4. Check your email for confirmation
5. Confirm your account and sign in

## Environment Variables

Your `.env` file should contain:

```env
VITE_SUPABASE_URL="your-project-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_OPENAI_API_KEY="your-openai-key"
```

## Data Migration

If you have existing data in localStorage:

1. Sign in to your account first
2. The app will automatically detect local data
3. You'll be prompted to migrate your data
4. A backup will be created before migration

## Security Notes

### OpenAI API Key
Currently, the OpenAI API key is exposed in the client. For production:

1. Create a Supabase Edge Function for OpenAI calls
2. Move the API key to Edge Function environment variables
3. Update the client to call the Edge Function instead

### Row Level Security (RLS)
All tables have RLS enabled:
- Users can only see and modify their own data
- Shared sets have appropriate access controls
- Public sets are viewable by anyone

## Troubleshooting

### "Missing Supabase environment variables" Error
- Ensure your `.env` file exists and contains the correct values
- Restart your development server after adding environment variables

### Authentication Emails Not Arriving
- Check spam folder
- Verify email settings in Supabase dashboard
- Consider configuring custom SMTP for production

### Database Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your project is not paused in Supabase dashboard
- Ensure RLS policies were created successfully

### Storage Upload Failures
- Verify storage buckets were created
- Check that storage policies are in place
- Ensure file size is within limits (default 50MB)

## Next Steps

1. **Production Deployment**
   - Move OpenAI API calls to Edge Functions
   - Configure custom domain
   - Set up proper email templates
   - Enable additional authentication providers if desired

2. **Features to Implement**
   - User profile management UI
   - Subscription tier management
   - Public flashcard marketplace
   - Study analytics dashboard
   - Social sharing features

3. **Performance Optimization**
   - Implement caching strategies
   - Add pagination for large datasets
   - Optimize image uploads with compression

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase