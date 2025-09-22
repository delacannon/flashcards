/**
 * Backend Database Schema for Flashcard System
 * This file contains TypeScript interfaces that define the structure
 * for storing flashcard data in a backend database.
 */

// ============================================
// USER & SUBSCRIPTION ENTITIES
// ============================================

/**
 * User preferences configuration
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  email_notifications: boolean;
  study_reminders: boolean;
  default_flip_axis: 'X' | 'Y';
}

/**
 * User entity with subscription and features
 */
export interface UserSchema {
  id: string;                    // UUID
  email: string;
  username: string;
  avatar_url?: string;
  
  // Subscription Tier
  subscription: {
    tier: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'expired';
    started_at: Date;
    expires_at?: Date;
    trial_ends_at?: Date;
    payment_method?: 'card' | 'paypal' | 'crypto';
    stripe_customer_id?: string;
    subscription_id?: string;
  };
  
  // Feature Limits & Usage
  usage_limits: {
    // Tier-based limits
    max_sets: number | null;              // Free: 5, Premium: unlimited (null)
    max_cards_per_set: number | null;     // Free: 50, Premium: unlimited
    ai_generations_per_month: number;     // Free: 5, Premium: 100
    max_storage_mb: number;               // Free: 100MB, Premium: 5GB
    max_collaborators: number;            // Free: 0, Premium: 10
    
    // Current usage tracking
    current_sets_count: number;
    ai_generations_this_month: number;
    storage_used_mb: number;
    last_ai_generation_reset: Date;      // Monthly reset date
  };
  
  // Feature Flags
  features: {
    ai_generation: boolean;         // Free: limited, Premium: yes
    ai_models: string[];           // Available AI models by tier
    premium_templates: boolean;     // Free: no, Premium: yes
    pdf_export: boolean;           // Free: no, Premium: yes
    bulk_import: boolean;          // Free: no, Premium: yes
    custom_branding: boolean;      // Free: no, Premium: yes
    analytics_level: 'none' | 'basic' | 'advanced';
    collaboration: boolean;        // Free: no, Premium: yes
    api_access: boolean;          // Free: no, Premium: yes
    remove_watermark: boolean;     // Free: no, Premium: yes
    priority_support: boolean;     // Free: no, Premium: yes
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_login_at: Date;
  email_verified: boolean;
  preferences: UserPreferences;
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

/**
 * Subscription plan configuration
 */
export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'premium' | 'enterprise';
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  
  limits: {
    max_sets: number | null;
    max_cards_per_set: number | null;
    ai_generations_per_month: number;
    max_storage_mb: number;
    max_collaborators: number;
  };
  
  features: {
    ai_generation: boolean;
    ai_models: string[];
    premium_templates: boolean;
    template_count: number;
    pdf_export: boolean;
    bulk_import: boolean;
    custom_branding: boolean;
    analytics_level: 'none' | 'basic' | 'advanced';
    collaboration: boolean;
    api_access: boolean;
    priority_support: boolean;
    remove_watermark: boolean;
  };
}

/**
 * Predefined subscription plans
 */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'plan_free',
    name: 'free',
    display_name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'USD',
    limits: {
      max_sets: 5,
      max_cards_per_set: 50,
      ai_generations_per_month: 5,
      max_storage_mb: 100,
      max_collaborators: 0
    },
    features: {
      ai_generation: true,
      ai_models: ['gpt-3.5-turbo'],
      premium_templates: false,
      template_count: 3,
      pdf_export: false,
      bulk_import: false,
      custom_branding: false,
      analytics_level: 'basic',
      collaboration: false,
      api_access: false,
      priority_support: false,
      remove_watermark: false
    }
  },
  premium: {
    id: 'plan_premium',
    name: 'premium',
    display_name: 'Premium',
    price_monthly: 9.99,
    price_yearly: 99.99,
    currency: 'USD',
    limits: {
      max_sets: null,
      max_cards_per_set: null,
      ai_generations_per_month: 100,
      max_storage_mb: 5000,
      max_collaborators: 10
    },
    features: {
      ai_generation: true,
      ai_models: ['gpt-3.5-turbo', 'gpt-4', 'claude-3'],
      premium_templates: true,
      template_count: 50,
      pdf_export: true,
      bulk_import: true,
      custom_branding: true,
      analytics_level: 'advanced',
      collaboration: true,
      api_access: true,
      priority_support: true,
      remove_watermark: true
    }
  }
};

// ============================================
// MAIN ENTITIES
// ============================================

// Import frontend types for migration helpers
import type { FlashcardSet, Flashcard } from './index';

// Re-export for backward compatibility
export type { FlashcardSet, Flashcard } from './index';

/**
 * Main flashcard set entity stored in the database
 */
export interface FlashcardSetSchema {
  id: string;                    // UUID
  user_id: string;               // Foreign key to users table
  name: string;                  // Set name
  description?: string;          // Optional description
  tags?: string[];              // Categories/tags for organization
  
  // Access Control & Visibility
  visibility: 'private' | 'public' | 'unlisted' | 'shared';
  access_control: {
    is_public: boolean;           // Anyone can view
    is_listed: boolean;           // Appears in public search/discovery
    allow_cloning: boolean;       // Others can copy this set
    allow_comments: boolean;      // Public comments allowed
    require_auth: boolean;        // Requires login to view
    password?: string;            // Optional password protection (hashed)
    
    // Sharing Settings
    share_link?: string;          // Unique shareable URL slug
    share_expires_at?: Date;      // When share link expires
    shared_with: Array<{          // Specific user sharing
      user_id: string;
      permission: 'view' | 'edit' | 'admin';
      shared_at: Date;
    }>;
  };
  
  // Public Engagement Metrics
  public_stats?: {
    views: number;                // Total view count
    unique_viewers: number;       // Unique users who viewed
    plays: number;                // Times played/studied
    likes: number;                // Like count
    favorites: number;            // Times favorited
    clones: number;              // Times cloned/copied
    avg_rating: number;          // Average rating (1-5)
    rating_count: number;        // Number of ratings
    comments_count: number;      // Total comments
    shares: number;              // Times shared
  };
  
  // Premium Features Used
  premium_features?: {
    uses_ai_generation: boolean;
    uses_premium_template: boolean;
    template_id?: string;
    template_name?: string;
  };
  
  // AI Generation Configuration
  ai_config: {
    prompt?: string;              // AI prompt used to generate cards
    model?: string;               // AI model used (e.g., "gpt-4")
    card_count?: number;          // Number of cards to generate
    generation_date?: Date;       // When AI generated the cards
  };
  
  // Visual Configuration
  styling_config: {
    flip_axis: 'X' | 'Y';
    
    // Question Side Styling
    question_styles: {
      bg_color: string;
      text_color: string;
      font_size: string;
      font_family: string;
      background_pattern?: string;
      background_image?: string;
      background_image_opacity?: number;
      border_style?: string;
      border_width?: string;
      border_color?: string;
    };
    
    // Answer Side Styling
    answer_styles: {
      bg_color: string;
      text_color: string;
      font_size: string;
      font_family: string;
      background_pattern?: string;
      background_image?: string;
      background_image_opacity?: number;
      border_style?: string;
      border_width?: string;
      border_color?: string;
    };
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_studied_at?: Date;
  study_count: number;           // Times this set has been studied
  
  // Statistics
  stats?: {
    avg_difficulty?: number;      // Average difficulty rating
    completion_rate?: number;     // % of users who complete
    avg_study_time?: number;      // Average time spent in minutes
  };
}

/**
 * Individual flashcard entity
 */
export interface FlashcardSchema {
  id: string;                    // UUID
  set_id: string;               // Foreign key to flashcard_sets
  position: number;             // Order within the set (for drag-drop)
  
  // Content
  question: string;             // Supports Markdown
  answer: string;               // Supports Markdown
  
  // Optional Media
  question_media?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    alt_text?: string;
  };
  answer_media?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    alt_text?: string;
  };
  
  // Learning Metadata
  difficulty?: 1 | 2 | 3 | 4 | 5;  // User-rated difficulty
  tags?: string[];                   // Card-specific tags
  notes?: string;                    // Private notes
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * User progress tracking for spaced repetition and analytics
 */
export interface UserProgressSchema {
  id: string;
  user_id: string;
  set_id: string;
  card_id: string;
  
  // Study Metrics
  times_studied: number;
  times_correct: number;
  times_incorrect: number;
  last_studied: Date;
  
  // Spaced Repetition Data (SM-2 Algorithm)
  ease_factor: number;          // Typically starts at 2.5
  interval: number;             // Days until next review
  next_review_date: Date;
  
  // Performance
  avg_response_time: number;    // Seconds to answer
  confidence_level?: 1 | 2 | 3 | 4 | 5;
}

// ============================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================

/**
 * Minimal DTO for list views and search results
 */
export interface FlashcardSetListDTO {
  id: string;
  name: string;
  description?: string;
  card_count: number;
  tags?: string[];
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  last_studied_at?: Date;
  author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

/**
 * Full DTO for editing and studying
 */
export interface FlashcardSetFullDTO extends FlashcardSetSchema {
  flashcards: FlashcardSchema[];
  user_progress?: UserProgressSchema[];
  author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

/**
 * DTO for creating a new flashcard set
 */
export interface CreateFlashcardSetDTO {
  name: string;
  description?: string;
  tags?: string[];
  is_public?: boolean;
  ai_config?: {
    prompt?: string;
    card_count?: number;
  };
  styling_config: FlashcardSetSchema['styling_config'];
  flashcards?: Array<{
    question: string;
    answer: string;
    position: number;
  }>;
}

/**
 * DTO for updating an existing flashcard set
 */
export interface UpdateFlashcardSetDTO {
  name?: string;
  description?: string;
  tags?: string[];
  is_public?: boolean;
  styling_config?: Partial<FlashcardSetSchema['styling_config']>;
}

/**
 * DTO for study session results
 */
export interface StudySessionDTO {
  set_id: string;
  user_id: string;
  started_at: Date;
  completed_at: Date;
  cards_studied: number;
  cards_correct: number;
  cards_incorrect: number;
  avg_response_time: number;
  card_results: Array<{
    card_id: string;
    was_correct: boolean;
    response_time: number;
    confidence_level?: 1 | 2 | 3 | 4 | 5;
  }>;
}

// ============================================
// PREMIUM TEMPLATES & DISCOVERY
// ============================================

/**
 * Premium template for flashcard styling
 */
export interface PremiumTemplate {
  id: string;
  name: string;
  category: 'education' | 'language' | 'science' | 'business' | 'creative' | 'other';
  tier_required: 'free' | 'premium';
  preview_url: string;
  thumbnail_url: string;
  
  // Preset styling configuration
  styling_preset: {
    question_styles: {
      bg_color: string;
      text_color: string;
      font_size: string;
      font_family: string;
      background_pattern?: string;
      border_style?: string;
      border_width?: string;
      border_color?: string;
    };
    answer_styles: {
      bg_color: string;
      text_color: string;
      font_size: string;
      font_family: string;
      background_pattern?: string;
      border_style?: string;
      border_width?: string;
      border_color?: string;
    };
    animations?: {
      flip_duration: number;
      flip_easing: string;
      hover_effect?: string;
    };
  };
  
  // Content structure templates
  content_structure?: {
    question_format?: string;      // Template for questions
    answer_format?: string;        // Template for answers
    placeholders?: string[];
    example_content?: {
      question: string;
      answer: string;
    };
  };
  
  // Metadata
  created_by: string;
  usage_count: number;
  rating: number;
  tags: string[];
}

/**
 * Public set discovery and SEO
 */
export interface PublicSetDiscovery {
  id: string;
  set_id: string;
  
  // Discovery metadata
  featured: boolean;              // Admin-featured sets
  trending: boolean;              // Based on recent activity
  editor_pick: boolean;           // Editor's choice
  category: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: string;               // ISO 639-1 code
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  
  // SEO & Social Media
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  og_image?: string;              // Open Graph image
  og_description?: string;
  twitter_card?: string;
  canonical_url: string;
  slug: string;                   // URL-friendly identifier
  
  // Engagement & Ranking
  quality_score: number;          // Algorithm-based quality score
  engagement_score: number;       // Based on user interactions
  total_plays: number;
  weekly_plays: number;
  monthly_plays: number;
  completion_rate: number;        // % who complete the set
  avg_study_time: number;         // Minutes
  
  // Recommendations
  similar_sets: string[];         // IDs of similar sets
  prerequisites?: string[];       // Sets to study first
  next_sets?: string[];          // Sets to study next
}

/**
 * Rate limiting configuration by tier
 */
export interface RateLimits {
  tier: 'free' | 'premium' | 'enterprise';
  limits: {
    requests_per_minute: number;      // API requests
    requests_per_hour: number;
    requests_per_day: number;
    ai_calls_per_hour: number;
    ai_calls_per_day: number;
    exports_per_day: number;
    bulk_operations_per_hour: number;
    file_upload_size_mb: number;
    concurrent_sessions: number;
  };
}

/**
 * API rate limit presets
 */
export const RATE_LIMITS: Record<string, RateLimits> = {
  free: {
    tier: 'free',
    limits: {
      requests_per_minute: 10,
      requests_per_hour: 100,
      requests_per_day: 500,
      ai_calls_per_hour: 5,
      ai_calls_per_day: 10,
      exports_per_day: 1,
      bulk_operations_per_hour: 0,
      file_upload_size_mb: 5,
      concurrent_sessions: 1
    }
  },
  premium: {
    tier: 'premium',
    limits: {
      requests_per_minute: 100,
      requests_per_hour: 1000,
      requests_per_day: 10000,
      ai_calls_per_hour: 50,
      ai_calls_per_day: 200,
      exports_per_day: 50,
      bulk_operations_per_hour: 10,
      file_upload_size_mb: 50,
      concurrent_sessions: 5
    }
  }
};

// ============================================
// ACCESS CONTROL HELPERS
// ============================================

/**
 * Check if user can access a flashcard set
 */
export function canUserAccessSet(
  user: UserSchema | null,
  set: FlashcardSetSchema,
  action: 'view' | 'edit' | 'delete' | 'share'
): boolean {
  // Owner always has full access
  if (user && set.user_id === user.id) return true;
  
  // Check visibility and access control
  switch (action) {
    case 'view':
      // Public sets can be viewed by anyone
      if (set.visibility === 'public') return true;
      // Unlisted sets can be viewed with link
      if (set.visibility === 'unlisted' && set.access_control.share_link) return true;
      // Check specific sharing
      if (user && set.access_control.shared_with.some(s => s.user_id === user.id)) return true;
      return false;
      
    case 'edit': {
      if (!user) return false;
      const shareAccess = set.access_control.shared_with.find(s => s.user_id === user.id);
      return shareAccess ? ['edit', 'admin'].includes(shareAccess.permission) : false;
    }
      
    case 'delete':
    case 'share': {
      if (!user) return false;
      const adminAccess = set.access_control.shared_with.find(s => s.user_id === user.id);
      return adminAccess?.permission === 'admin';
    }
      
    default:
      return false;
  }
}

/**
 * Check if user has access to a feature
 */
export function canUseFeature(
  user: UserSchema,
  feature: keyof UserSchema['features']
): boolean {
  return user.features[feature] === true || 
         (feature === 'analytics_level' && user.features[feature] !== 'none');
}

/**
 * Check usage limits
 */
export function checkUsageLimit(
  user: UserSchema,
  resource: 'sets' | 'cards' | 'ai_generation' | 'storage'
): { allowed: boolean; limit: number | null; current: number } {
  switch(resource) {
    case 'sets':
      return {
        allowed: user.usage_limits.max_sets === null || 
                 user.usage_limits.current_sets_count < user.usage_limits.max_sets,
        limit: user.usage_limits.max_sets,
        current: user.usage_limits.current_sets_count
      };
    case 'ai_generation':
      return {
        allowed: user.usage_limits.ai_generations_this_month < user.usage_limits.ai_generations_per_month,
        limit: user.usage_limits.ai_generations_per_month,
        current: user.usage_limits.ai_generations_this_month
      };
    case 'storage':
      return {
        allowed: user.usage_limits.storage_used_mb < user.usage_limits.max_storage_mb,
        limit: user.usage_limits.max_storage_mb,
        current: user.usage_limits.storage_used_mb
      };
    default:
      return { allowed: true, limit: null, current: 0 };
  }
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Converts the current frontend FlashcardSet to backend schema
 */
export function toBackendSchema(frontendSet: FlashcardSet): CreateFlashcardSetDTO {
  return {
    name: frontendSet.name,
    tags: [],
    is_public: false,
    ai_config: {
      prompt: frontendSet.config?.aiPrompt,
      card_count: frontendSet.config?.cardCount,
    },
    styling_config: {
      flip_axis: frontendSet.config?.flipAxis || 'Y',
      question_styles: {
        bg_color: frontendSet.config?.questionBgColor || '#ffffff',
        text_color: frontendSet.config?.questionFgColor || '#000000',
        font_size: frontendSet.config?.questionFontSize || '16px',
        font_family: frontendSet.config?.questionFontFamily || 'Inter',
        background_pattern: frontendSet.config?.questionBackgroundPattern,
        background_image: frontendSet.config?.questionBackgroundImage,
        background_image_opacity: frontendSet.config?.questionBackgroundImageOpacity,
        border_style: frontendSet.config?.questionBorderStyle,
        border_width: frontendSet.config?.questionBorderWidth,
        border_color: frontendSet.config?.questionBorderColor,
      },
      answer_styles: {
        bg_color: frontendSet.config?.answerBgColor || '#f3f4f6',
        text_color: frontendSet.config?.answerFgColor || '#000000',
        font_size: frontendSet.config?.answerFontSize || '16px',
        font_family: frontendSet.config?.answerFontFamily || 'Inter',
        background_pattern: frontendSet.config?.answerBackgroundPattern,
        background_image: frontendSet.config?.answerBackgroundImage,
        background_image_opacity: frontendSet.config?.answerBackgroundImageOpacity,
        border_style: frontendSet.config?.answerBorderStyle,
        border_width: frontendSet.config?.answerBorderWidth,
        border_color: frontendSet.config?.answerBorderColor,
      },
    },
    flashcards: frontendSet.flashcards?.map((card: Flashcard, index: number) => ({
      question: card.question,
      answer: card.answer,
      position: index,
    })),
  };
}

/**
 * Converts backend schema to frontend format
 */
export function fromBackendSchema(backendSet: FlashcardSetFullDTO): FlashcardSet {
  return {
    id: backendSet.id,
    name: backendSet.name,
    flashcards: backendSet.flashcards.map(card => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
    })),
    config: {
      flipAxis: backendSet.styling_config.flip_axis,
      // Question styles
      questionBgColor: backendSet.styling_config.question_styles.bg_color,
      questionFgColor: backendSet.styling_config.question_styles.text_color,
      questionFontSize: backendSet.styling_config.question_styles.font_size,
      questionFontFamily: backendSet.styling_config.question_styles.font_family,
      questionBackgroundPattern: backendSet.styling_config.question_styles.background_pattern,
      questionBackgroundImage: backendSet.styling_config.question_styles.background_image,
      questionBackgroundImageOpacity: backendSet.styling_config.question_styles.background_image_opacity,
      questionBorderStyle: backendSet.styling_config.question_styles.border_style,
      questionBorderWidth: backendSet.styling_config.question_styles.border_width,
      questionBorderColor: backendSet.styling_config.question_styles.border_color,
      // Answer styles
      answerBgColor: backendSet.styling_config.answer_styles.bg_color,
      answerFgColor: backendSet.styling_config.answer_styles.text_color,
      answerFontSize: backendSet.styling_config.answer_styles.font_size,
      answerFontFamily: backendSet.styling_config.answer_styles.font_family,
      answerBackgroundPattern: backendSet.styling_config.answer_styles.background_pattern,
      answerBackgroundImage: backendSet.styling_config.answer_styles.background_image,
      answerBackgroundImageOpacity: backendSet.styling_config.answer_styles.background_image_opacity,
      answerBorderStyle: backendSet.styling_config.answer_styles.border_style,
      answerBorderWidth: backendSet.styling_config.answer_styles.border_width,
      answerBorderColor: backendSet.styling_config.answer_styles.border_color,
      // AI config
      aiPrompt: backendSet.ai_config?.prompt,
      cardCount: backendSet.ai_config?.card_count,
    },
    createdAt: new Date(backendSet.created_at),
    updatedAt: backendSet.updated_at ? new Date(backendSet.updated_at) : undefined,
  };
}

// ============================================
// API ENDPOINTS INTERFACE
// ============================================

/**
 * API service interface for backend communication
 */
export interface FlashcardAPIService {
  // Flashcard Sets
  getSets(userId: string): Promise<FlashcardSetListDTO[]>;
  getSet(setId: string): Promise<FlashcardSetFullDTO>;
  createSet(data: CreateFlashcardSetDTO): Promise<FlashcardSetFullDTO>;
  updateSet(setId: string, data: UpdateFlashcardSetDTO): Promise<FlashcardSetFullDTO>;
  deleteSet(setId: string): Promise<void>;
  duplicateSet(setId: string): Promise<FlashcardSetFullDTO>;
  
  // Flashcards
  createCard(setId: string, card: Omit<FlashcardSchema, 'id' | 'set_id' | 'created_at' | 'updated_at'>): Promise<FlashcardSchema>;
  updateCard(cardId: string, updates: Partial<FlashcardSchema>): Promise<FlashcardSchema>;
  deleteCard(cardId: string): Promise<void>;
  reorderCards(setId: string, cardOrder: string[]): Promise<void>;
  
  // Study Sessions
  startStudySession(setId: string): Promise<string>; // Returns session ID
  submitStudySession(sessionData: StudySessionDTO): Promise<void>;
  getProgress(userId: string, setId: string): Promise<UserProgressSchema[]>;
  
  // Public Sets
  searchPublicSets(query: string, tags?: string[]): Promise<FlashcardSetListDTO[]>;
  clonePublicSet(setId: string): Promise<FlashcardSetFullDTO>;
}