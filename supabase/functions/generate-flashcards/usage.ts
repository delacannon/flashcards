import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

export interface UsageRecord {
  user_id: string;
  function_name: string;
  request_count: number;
  cards_generated: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class UsageTracker {
  private supabase: any;
  private maxRequestsPerDay: number;
  private maxCardsPerRequest: number;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.maxRequestsPerDay = parseInt(Deno.env.get('MAX_REQUESTS_PER_USER_PER_DAY') || '100');
    this.maxCardsPerRequest = parseInt(Deno.env.get('MAX_CARDS_PER_REQUEST') || '50');
  }

  async checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      // Get today's usage for the user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await this.supabase
        .from('ai_usage')
        .select('request_count')
        .eq('user_id', userId)
        .eq('function_name', 'generate-flashcards')
        .gte('timestamp', today.toISOString())
        .lt('timestamp', tomorrow.toISOString());

      if (error) {
        console.error('Error checking rate limit:', error);
        // If we can't check, allow the request but log the issue
        return { allowed: true, remaining: this.maxRequestsPerDay, resetAt: tomorrow };
      }

      const totalRequests = data?.reduce((sum, record) => sum + (record.request_count || 0), 0) || 0;
      const remaining = Math.max(0, this.maxRequestsPerDay - totalRequests);

      return {
        allowed: totalRequests < this.maxRequestsPerDay,
        remaining,
        resetAt: tomorrow,
      };
    } catch (error) {
      console.error('Error in rate limit check:', error);
      // Default to allowing if there's an error
      return { allowed: true, remaining: this.maxRequestsPerDay, resetAt: new Date() };
    }
  }

  async trackUsage(userId: string, cardsGenerated: number, metadata?: Record<string, any>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_usage')
        .insert({
          user_id: userId,
          function_name: 'generate-flashcards',
          request_count: 1,
          cards_generated: cardsGenerated,
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
        });

      if (error) {
        console.error('Error tracking usage:', error);
      }
    } catch (error) {
      console.error('Error in usage tracking:', error);
    }
  }

  validateCardCount(count: number): { valid: boolean; message?: string } {
    if (count <= 0) {
      return { valid: false, message: 'Card count must be greater than 0' };
    }
    if (count > this.maxCardsPerRequest) {
      return { valid: false, message: `Maximum ${this.maxCardsPerRequest} cards per request` };
    }
    return { valid: true };
  }
}

// SQL to create the usage tracking table (run in Supabase SQL editor):
/*
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

-- Create index for efficient querying
CREATE INDEX idx_ai_usage_user_timestamp ON ai_usage(user_id, timestamp);
CREATE INDEX idx_ai_usage_function ON ai_usage(function_name);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only service role can insert (Edge Functions use service role)
CREATE POLICY "Service role can insert usage" ON ai_usage
  FOR INSERT WITH CHECK (true);
*/