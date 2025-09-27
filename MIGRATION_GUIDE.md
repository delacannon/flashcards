# Migration Guide: OpenAI API to Supabase Edge Functions

This guide explains how to migrate from client-side OpenAI API calls to secure server-side Supabase Edge Functions.

## Why Migrate?

**Security Benefits:**
- API keys are never exposed in client-side code
- Built-in authentication and authorization
- Rate limiting and usage tracking
- Reduced bundle size (no OpenAI SDK in frontend)

**Before:** OpenAI API key was exposed in browser environment variables
**After:** API key is securely stored in Supabase Edge Functions

## Migration Steps

### Step 1: Set Up Supabase Project

If you haven't already, create a Supabase project:

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Note your project URL and anon key

### Step 2: Configure Environment Variables

Update your `.env` file:

```env
# Keep these Supabase settings
VITE_SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Remove this line (no longer needed in client)
# VITE_OPENAI_API_KEY="xxx" ← DELETE THIS
```

### Step 3: Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login and link your project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Set your OpenAI API key as a secret:
```bash
supabase secrets set OPENAI_API_KEY=your_actual_openai_api_key
```

4. Deploy the Edge Function:
```bash
supabase functions deploy generate-flashcards
```

### Step 4: Create Usage Tracking Table

Run the SQL from `supabase/ai-usage-table.sql` in your Supabase SQL editor:

```sql
-- This creates the ai_usage table and related functions
-- See supabase/ai-usage-table.sql for full script
```

### Step 5: Test the Migration

1. Start your development server:
```bash
pnpm dev
```

2. Sign in to the app (required for AI features)

3. Try generating flashcards - it should now use Edge Functions

4. Check the Supabase logs:
```bash
supabase functions log generate-flashcards --follow
```

## Code Changes

The migration is designed to be transparent to the application code. The new `ai-edge.ts` service maintains the same interface as the original services:

```typescript
// Old code (still works)
import { aiService } from '@/services/ai';

// New code (uses Edge Functions)
import { aiService } from '@/services/ai-edge';

// Usage remains the same
const result = await aiService.generateFlashcardsWithTitle(
  prompt,
  count,
  generateTitle,
  onCardCallback
);
```

## Rollback Plan

If you need to temporarily rollback:

1. Add back the `VITE_OPENAI_API_KEY` to your `.env`
2. Change imports from `@/services/ai-edge` back to `@/services/ai`
3. The old services are still available as fallback

## Monitoring Usage

View usage statistics in your Supabase dashboard:

```sql
-- Daily usage per user
SELECT 
  user_id,
  DATE(timestamp) as date,
  SUM(request_count) as requests,
  SUM(cards_generated) as total_cards
FROM ai_usage
WHERE function_name = 'generate-flashcards'
GROUP BY user_id, DATE(timestamp)
ORDER BY date DESC;
```

## Rate Limits

Default limits (configurable):
- 100 requests per user per day
- 50 cards maximum per request

To adjust limits:
```bash
supabase secrets set MAX_REQUESTS_PER_USER_PER_DAY=200
supabase secrets set MAX_CARDS_PER_REQUEST=100
```

## Troubleshooting

### "Not configured" error
- Ensure Supabase URL and anon key are set in `.env`
- Check Edge Function is deployed: `supabase functions list`

### "Authentication required" error
- User must be signed in to use AI features
- Check Supabase Auth is working properly

### Rate limit errors
- Check user's usage in `ai_usage` table
- Adjust limits if needed (see Rate Limits section)

### CORS errors
- Ensure your domain is in Supabase dashboard settings
- Check Edge Function CORS headers

## Cost Considerations

- **Supabase Edge Functions**: First 500K invocations/month free
- **OpenAI API**: Same costs as before (billed by OpenAI)
- **Database storage**: Minimal (usage tracking only)

## Support

For issues or questions:
1. Check `supabase/functions/README.md` for detailed docs
2. View Edge Function logs: `supabase functions log`
3. Check Supabase dashboard for errors
4. Open an issue in the project repository