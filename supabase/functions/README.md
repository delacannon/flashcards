# Supabase Edge Functions for Flashcards App

This directory contains the Supabase Edge Functions that provide secure server-side AI capabilities for the flashcards application.

## Overview

The Edge Functions handle:
- OpenAI API calls for flashcard generation
- Authentication and authorization
- Rate limiting and usage tracking
- Streaming responses for real-time updates

## Functions

### `generate-flashcards`
Generates AI-powered flashcards using OpenAI's GPT-4 model.

**Features:**
- Secure server-side API key management
- Streaming support for real-time card generation
- Usage tracking and rate limiting
- Automatic title generation

## Setup Instructions

### 1. Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Using brew (macOS)
brew install supabase/tap/supabase

# Using scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Initialize Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `supabase/functions/` directory:

```bash
cp supabase/functions/.env.example supabase/functions/.env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_actual_openai_api_key_here
MAX_REQUESTS_PER_USER_PER_DAY=100  # Optional
MAX_CARDS_PER_REQUEST=50           # Optional
```

### 4. Deploy Edge Functions

Deploy to your Supabase project:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-flashcards

# Set secrets (production)
supabase secrets set OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 5. Create Usage Tracking Table

Run this SQL in your Supabase dashboard:

```sql
-- Create usage tracking table
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  cards_generated INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_ai_usage_user_timestamp ON ai_usage(user_id, timestamp);
CREATE INDEX idx_ai_usage_function ON ai_usage(function_name);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert
CREATE POLICY "Service role can insert usage" ON ai_usage
  FOR INSERT WITH CHECK (true);
```

## Local Development

### Run Functions Locally

```bash
# Start functions locally
supabase functions serve

# With environment variables
supabase functions serve --env-file supabase/functions/.env.local

# Test a specific function
curl -i --location --request POST \
  'http://127.0.0.1:54321/functions/v1/generate-flashcards' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Spanish vocabulary","count":5,"generateTitle":true}'
```

## Client-Side Usage

The client automatically uses the Edge Functions when available. No changes needed to existing code:

```typescript
import { aiService } from '@/services/ai-edge';

// Generate flashcards
const result = await aiService.generateFlashcardsWithTitle(
  'Spanish vocabulary',
  10,
  true,
  (card, index) => {
    // Handle each card as it's generated
    console.log(`Card ${index}:`, card);
  }
);
```

## Migration from Client-Side API Keys

1. **Remove old environment variable**: Delete `VITE_OPENAI_API_KEY` from your `.env` file
2. **Deploy Edge Functions**: Follow setup instructions above
3. **Update imports**: The app now uses `ai-edge.ts` instead of direct OpenAI client
4. **Test**: Verify flashcard generation works with Edge Functions

## Security Benefits

- ✅ API keys never exposed to client
- ✅ Built-in authentication via Supabase Auth
- ✅ Rate limiting per user
- ✅ Usage tracking and monitoring
- ✅ Secure server-side processing

## Monitoring

View function logs:

```bash
# View logs for all functions
supabase functions log

# View logs for specific function
supabase functions log generate-flashcards

# Follow logs in real-time
supabase functions log generate-flashcards --follow
```

Check usage statistics in your database:

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

-- Total usage this month
SELECT 
  COUNT(DISTINCT user_id) as unique_users,
  SUM(request_count) as total_requests,
  SUM(cards_generated) as total_cards
FROM ai_usage
WHERE 
  function_name = 'generate-flashcards'
  AND timestamp >= date_trunc('month', CURRENT_DATE);
```

## Troubleshooting

### Function not responding
- Check Edge Function logs: `supabase functions log generate-flashcards`
- Verify OPENAI_API_KEY is set: `supabase secrets list`
- Ensure user is authenticated

### Rate limit errors
- Check MAX_REQUESTS_PER_USER_PER_DAY setting
- View user's usage in ai_usage table
- Consider increasing limits for premium users

### CORS errors
- Ensure your domain is properly configured in Supabase dashboard
- Check Edge Function CORS headers match your needs

## Cost Optimization

- Edge Function invocations: First 500K/month free
- OpenAI API: Monitor usage via OpenAI dashboard
- Database storage: Usage tracking table is minimal
- Consider implementing caching for common prompts

## Support

For issues or questions:
1. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
2. Review OpenAI API docs: https://platform.openai.com/docs
3. Open an issue in the project repository