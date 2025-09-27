-- AI Usage Tracking Table for Edge Functions
-- Run this in your Supabase SQL editor to set up usage tracking

-- Create the usage tracking table
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_timestamp ON ai_usage(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_function ON ai_usage(function_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can view own usage" ON ai_usage;
DROP POLICY IF EXISTS "Service role can insert usage" ON ai_usage;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only service role can insert (Edge Functions use service role)
CREATE POLICY "Service role can insert usage" ON ai_usage
  FOR INSERT WITH CHECK (true);

-- Create a view for easy usage statistics
CREATE OR REPLACE VIEW ai_usage_stats AS
SELECT 
  user_id,
  function_name,
  DATE(timestamp) as date,
  COUNT(*) as request_count,
  SUM(cards_generated) as total_cards_generated,
  AVG(cards_generated) as avg_cards_per_request,
  MAX(timestamp) as last_request_at
FROM ai_usage
GROUP BY user_id, function_name, DATE(timestamp);

-- Grant access to the view
GRANT SELECT ON ai_usage_stats TO authenticated;

-- Function to get user's remaining requests for today
CREATE OR REPLACE FUNCTION get_remaining_requests(p_user_id UUID)
RETURNS TABLE(
  remaining_requests INTEGER,
  reset_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_daily_requests INTEGER := 100; -- Default limit, can be adjusted
  today_requests INTEGER;
  tomorrow TIMESTAMPTZ;
BEGIN
  -- Calculate tomorrow's date (reset time)
  tomorrow := date_trunc('day', CURRENT_TIMESTAMP + INTERVAL '1 day');
  
  -- Count today's requests
  SELECT COALESCE(SUM(request_count), 0) INTO today_requests
  FROM ai_usage
  WHERE user_id = p_user_id
    AND function_name = 'generate-flashcards'
    AND timestamp >= date_trunc('day', CURRENT_TIMESTAMP)
    AND timestamp < tomorrow;
  
  -- Return remaining requests and reset time
  RETURN QUERY
  SELECT 
    GREATEST(0, max_daily_requests - today_requests)::INTEGER as remaining_requests,
    tomorrow as reset_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_remaining_requests(UUID) TO authenticated;

-- Sample queries for monitoring

-- Get daily usage summary
/*
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(request_count) as total_requests,
  SUM(cards_generated) as total_cards,
  ROUND(AVG(cards_generated), 2) as avg_cards_per_request
FROM ai_usage
WHERE function_name = 'generate-flashcards'
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;
*/

-- Get top users by usage
/*
SELECT 
  u.email,
  au.user_id,
  SUM(au.request_count) as total_requests,
  SUM(au.cards_generated) as total_cards,
  MAX(au.timestamp) as last_used
FROM ai_usage au
JOIN auth.users u ON au.user_id = u.id
WHERE au.function_name = 'generate-flashcards'
  AND au.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.email, au.user_id
ORDER BY total_requests DESC
LIMIT 20;
*/

-- Check a specific user's remaining requests
/*
SELECT * FROM get_remaining_requests('user-uuid-here');
*/