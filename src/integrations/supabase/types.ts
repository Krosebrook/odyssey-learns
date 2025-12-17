export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievement_badges: {
        Row: {
          badge_id: string
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          tier: string | null
          unlock_criteria: Json
        }
        Insert: {
          badge_id: string
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          tier?: string | null
          unlock_criteria: Json
        }
        Update: {
          badge_id?: string
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          tier?: string | null
          unlock_criteria?: Json
        }
        Relationships: []
      }
      activity_participants: {
        Row: {
          activity_id: string
          child_id: string
          contribution: Json | null
          id: string
          joined_at: string | null
          status: string | null
        }
        Insert: {
          activity_id: string
          child_id: string
          contribution?: Json | null
          id?: string
          joined_at?: string | null
          status?: string | null
        }
        Update: {
          activity_id?: string
          child_id?: string
          contribution?: Json | null
          id?: string
          joined_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "shared_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          child_id: string
          event_category: string | null
          event_properties: Json | null
          event_type: string
          id: string
          timestamp: string | null
        }
        Insert: {
          child_id: string
          event_category?: string | null
          event_properties?: Json | null
          event_type: string
          id?: string
          timestamp?: string | null
        }
        Update: {
          child_id?: string
          event_category?: string | null
          event_properties?: Json | null
          event_type?: string
          id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      avatar_items: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          item_name: string
          item_svg_data: string
          item_type: string
          points_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          item_name: string
          item_svg_data: string
          item_type: string
          points_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          item_name?: string
          item_svg_data?: string
          item_type?: string
          points_cost?: number | null
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          category: string | null
          child_id: string | null
          created_at: string | null
          description: string
          device_info: Json | null
          feedback_type: string
          id: string
          page_url: string | null
          resolved_at: string | null
          screenshot_url: string | null
          severity: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          child_id?: string | null
          created_at?: string | null
          description: string
          device_info?: Json | null
          feedback_type: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          child_id?: string | null
          created_at?: string | null
          description?: string
          device_info?: Json | null
          feedback_type?: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_feedback_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_generated_lessons: {
        Row: {
          child_id: string
          content_markdown: string
          created_at: string | null
          creator_child_id: string | null
          description: string | null
          difficulty: string | null
          estimated_minutes: number | null
          generation_prompt: string | null
          grade_level: number
          id: string
          is_active: boolean | null
          parent_approved_at: string | null
          parent_approved_by: string | null
          parent_id: string
          points_value: number | null
          quiz_questions: Json | null
          rejection_reason: string | null
          share_status: string | null
          subject: string
          times_used: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          child_id: string
          content_markdown: string
          created_at?: string | null
          creator_child_id?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          generation_prompt?: string | null
          grade_level: number
          id?: string
          is_active?: boolean | null
          parent_approved_at?: string | null
          parent_approved_by?: string | null
          parent_id: string
          points_value?: number | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          share_status?: string | null
          subject: string
          times_used?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          content_markdown?: string
          created_at?: string | null
          creator_child_id?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          generation_prompt?: string | null
          grade_level?: number
          id?: string
          is_active?: boolean | null
          parent_approved_at?: string | null
          parent_approved_by?: string | null
          parent_id?: string
          points_value?: number | null
          quiz_questions?: Json | null
          rejection_reason?: string | null
          share_status?: string | null
          subject?: string
          times_used?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_generated_lessons_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_generated_lessons_creator_child_id_fkey"
            columns: ["creator_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_config: Json | null
          challenge_mode_enabled: boolean | null
          created_at: string | null
          daily_quest_id: string | null
          daily_screen_time_limit_minutes: number | null
          deleted_at: string | null
          deletion_reason: string | null
          deletion_scheduled_at: string | null
          grade_level: number
          id: string
          name: string
          parent_id: string
          pin_hash: string | null
          quest_bonus_points: number | null
          quest_completed_at: string | null
          screen_time_enabled: boolean | null
          total_points: number | null
          weekly_report_enabled: boolean | null
        }
        Insert: {
          avatar_config?: Json | null
          challenge_mode_enabled?: boolean | null
          created_at?: string | null
          daily_quest_id?: string | null
          daily_screen_time_limit_minutes?: number | null
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          grade_level: number
          id?: string
          name: string
          parent_id: string
          pin_hash?: string | null
          quest_bonus_points?: number | null
          quest_completed_at?: string | null
          screen_time_enabled?: boolean | null
          total_points?: number | null
          weekly_report_enabled?: boolean | null
        }
        Update: {
          avatar_config?: Json | null
          challenge_mode_enabled?: boolean | null
          created_at?: string | null
          daily_quest_id?: string | null
          daily_screen_time_limit_minutes?: number | null
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          grade_level?: number
          id?: string
          name?: string
          parent_id?: string
          pin_hash?: string | null
          quest_bonus_points?: number | null
          quest_completed_at?: string | null
          screen_time_enabled?: boolean | null
          total_points?: number | null
          weekly_report_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "children_daily_quest_id_fkey"
            columns: ["daily_quest_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "children_daily_quest_id_fkey"
            columns: ["daily_quest_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_rate_limit: {
        Row: {
          parent_id: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          parent_id: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          parent_id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      collaboration_requests: {
        Row: {
          approved_at: string | null
          created_at: string | null
          id: string
          lesson_id: string | null
          parent_approved: boolean | null
          recipient_child_id: string
          requester_child_id: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          parent_approved?: boolean | null
          recipient_child_id: string
          requester_child_id: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          parent_approved?: boolean | null
          recipient_child_id?: string
          requester_child_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "collaboration_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_recipient_child_id_fkey"
            columns: ["recipient_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_requester_child_id_fkey"
            columns: ["requester_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_reward_history: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          lesson_id: string | null
          points_change: number
          reason: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          points_change: number
          reason: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          points_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_reward_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_reward_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "child_generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_rewards: {
        Row: {
          badges: string[] | null
          child_id: string
          created_at: string | null
          id: string
          level: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          badges?: string[] | null
          child_id: string
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          badges?: string[] | null
          child_id?: string
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_rewards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_lesson_quota: {
        Row: {
          bonus_lessons_granted: number | null
          child_id: string
          created_at: string | null
          custom_lessons_completed: number | null
          id: string
          platform_lessons_completed: number | null
          quota_date: string
          updated_at: string | null
        }
        Insert: {
          bonus_lessons_granted?: number | null
          child_id: string
          created_at?: string | null
          custom_lessons_completed?: number | null
          id?: string
          platform_lessons_completed?: number | null
          quota_date: string
          updated_at?: string | null
        }
        Update: {
          bonus_lessons_granted?: number | null
          child_id?: string
          created_at?: string | null
          custom_lessons_completed?: number | null
          id?: string
          platform_lessons_completed?: number | null
          quota_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_lesson_quota_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_lesson_stats: {
        Row: {
          avg_score: number | null
          avg_time_minutes: number | null
          id: string
          lesson_id: string | null
          stat_date: string
          students_attempted: number | null
          students_completed: number | null
        }
        Insert: {
          avg_score?: number | null
          avg_time_minutes?: number | null
          id?: string
          lesson_id?: string | null
          stat_date: string
          students_attempted?: number | null
          students_completed?: number | null
        }
        Update: {
          avg_score?: number | null
          avg_time_minutes?: number | null
          id?: string
          lesson_id?: string | null
          stat_date?: string
          students_attempted?: number | null
          students_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_lesson_stats_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "daily_lesson_stats_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_audit: {
        Row: {
          access_count: number | null
          access_type: string
          accessed_at: string | null
          accessed_record_id: string | null
          accessed_table: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_count?: number | null
          access_type: string
          accessed_at?: string | null
          accessed_record_id?: string | null
          accessed_table: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_count?: number | null
          access_type?: string
          accessed_at?: string | null
          accessed_record_id?: string | null
          accessed_table?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_log: {
        Row: {
          child_id: string | null
          export_format: string
          export_size_bytes: number | null
          exported_at: string | null
          id: string
          parent_id: string
        }
        Insert: {
          child_id?: string | null
          export_format: string
          export_size_bytes?: number | null
          exported_at?: string | null
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string | null
          export_format?: string
          export_size_bytes?: number | null
          exported_at?: string | null
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_log_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_log_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_logs: {
        Row: {
          child_id: string
          coping_strategy: string | null
          coping_strategy_encrypted: string | null
          created_at: string | null
          emotion_type: string
          id: string
          intensity: number
          logged_at: string | null
          reflection_notes: string | null
          reflection_notes_encrypted: string | null
          trigger: string | null
          trigger_encrypted: string | null
        }
        Insert: {
          child_id: string
          coping_strategy?: string | null
          coping_strategy_encrypted?: string | null
          created_at?: string | null
          emotion_type: string
          id?: string
          intensity: number
          logged_at?: string | null
          reflection_notes?: string | null
          reflection_notes_encrypted?: string | null
          trigger?: string | null
          trigger_encrypted?: string | null
        }
        Update: {
          child_id?: string
          coping_strategy?: string | null
          coping_strategy_encrypted?: string | null
          created_at?: string | null
          emotion_type?: string
          id?: string
          intensity?: number
          logged_at?: string | null
          reflection_notes?: string | null
          reflection_notes_encrypted?: string | null
          trigger?: string | null
          trigger_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          action: string | null
          component: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          component?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          component?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      failed_auth_attempts: {
        Row: {
          attempted_at: string | null
          email: string | null
          failure_reason: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email?: string | null
          failure_reason: string
          id?: string
          ip_address: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string | null
          failure_reason?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      idempotency_cache: {
        Row: {
          created_at: string | null
          key: string
          result: Json
        }
        Insert: {
          created_at?: string | null
          key: string
          result: Json
        }
        Update: {
          created_at?: string | null
          key?: string
          result?: Json
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          blocked_at: string | null
          expires_at: string
          ip_address: unknown
          metadata: Json | null
          reason: string
        }
        Insert: {
          blocked_at?: string | null
          expires_at: string
          ip_address: unknown
          metadata?: Json | null
          reason: string
        }
        Update: {
          blocked_at?: string | null
          expires_at?: string
          ip_address?: unknown
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      lesson_analytics: {
        Row: {
          avg_time_seconds: number | null
          created_at: string | null
          engagement_score: number | null
          id: string
          lesson_id: string
          total_saves: number | null
          total_shares: number | null
          total_views: number | null
          unique_viewers: number | null
          updated_at: string | null
        }
        Insert: {
          avg_time_seconds?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id: string
          total_saves?: number | null
          total_shares?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_time_seconds?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id?: string
          total_saves?: number | null
          total_shares?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "child_generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_analytics_events: {
        Row: {
          child_id: string
          created_at: string | null
          event_type: string
          id: string
          lesson_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          event_type: string
          id?: string
          lesson_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_analytics_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_analytics_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "child_generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_generation_dedup: {
        Row: {
          child_id: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          idempotency_key: string
          lesson_id: string | null
          status: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key: string
          lesson_id?: string | null
          status?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          lesson_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_generation_dedup_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          lesson_id: string
          note_content: string
          updated_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          lesson_id: string
          note_content: string
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          note_content?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_performance_metrics: {
        Row: {
          avg_quiz_score: number | null
          avg_time_spent_seconds: number | null
          completed_attempts: number | null
          completion_rate: number | null
          difficulty_rating: number | null
          first_attempt_success_rate: number | null
          help_requests: number | null
          id: string
          improvement_rate: number | null
          last_calculated_at: string | null
          lesson_id: string | null
          quiz_score_distribution: Json | null
          sample_size: number | null
          struggle_indicators: number | null
          total_attempts: number | null
          total_quiz_submissions: number | null
        }
        Insert: {
          avg_quiz_score?: number | null
          avg_time_spent_seconds?: number | null
          completed_attempts?: number | null
          completion_rate?: number | null
          difficulty_rating?: number | null
          first_attempt_success_rate?: number | null
          help_requests?: number | null
          id?: string
          improvement_rate?: number | null
          last_calculated_at?: string | null
          lesson_id?: string | null
          quiz_score_distribution?: Json | null
          sample_size?: number | null
          struggle_indicators?: number | null
          total_attempts?: number | null
          total_quiz_submissions?: number | null
        }
        Update: {
          avg_quiz_score?: number | null
          avg_time_spent_seconds?: number | null
          completed_attempts?: number | null
          completion_rate?: number | null
          difficulty_rating?: number | null
          first_attempt_success_rate?: number | null
          help_requests?: number | null
          id?: string
          improvement_rate?: number | null
          last_calculated_at?: string | null
          lesson_id?: string | null
          quiz_score_distribution?: Json | null
          sample_size?: number | null
          struggle_indicators?: number | null
          total_attempts?: number | null
          total_quiz_submissions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_performance_metrics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_performance_metrics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quality_scores: {
        Row: {
          category_scores: Json | null
          id: string
          lesson_id: string | null
          overall_score: number | null
          recorded_at: string | null
          review_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          category_scores?: Json | null
          id?: string
          lesson_id?: string | null
          overall_score?: number | null
          recorded_at?: string | null
          review_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          category_scores?: Json | null
          id?: string
          lesson_id?: string | null
          overall_score?: number | null
          recorded_at?: string | null
          review_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quality_scores_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_quality_scores_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_quality_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "lesson_quality_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "lesson_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reviews: {
        Row: {
          age_appropriate_score: number | null
          assessment_quality_score: number | null
          assigned_at: string | null
          auto_assigned_at: string | null
          clarity_score: number | null
          completed_at: string | null
          content_accuracy_score: number | null
          created_at: string | null
          engagement_score: number | null
          id: string
          lesson_id: string
          overall_score: number | null
          priority: string | null
          review_duration_minutes: number | null
          reviewer_id: string | null
          reviewer_notes: string | null
          revision_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["review_status"]
          strengths: string | null
          suggestions: string | null
          updated_at: string | null
          weaknesses: string | null
        }
        Insert: {
          age_appropriate_score?: number | null
          assessment_quality_score?: number | null
          assigned_at?: string | null
          auto_assigned_at?: string | null
          clarity_score?: number | null
          completed_at?: string | null
          content_accuracy_score?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id: string
          overall_score?: number | null
          priority?: string | null
          review_duration_minutes?: number | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          revision_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          suggestions?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Update: {
          age_appropriate_score?: number | null
          assessment_quality_score?: number | null
          assigned_at?: string | null
          auto_assigned_at?: string | null
          clarity_score?: number | null
          completed_at?: string | null
          content_accuracy_score?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id?: string
          overall_score?: number | null
          priority?: string | null
          review_duration_minutes?: number | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          revision_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          suggestions?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reviews_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_reviews_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_tokens: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          last_reset_date: string | null
          tokens_available: number | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          tokens_available?: number | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          tokens_available?: number | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_tokens_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_markdown: string
          created_at: string | null
          description: string | null
          differentiation: Json | null
          estimated_minutes: number | null
          grade_level: number
          id: string
          is_active: boolean | null
          points_value: number | null
          quiz_questions: Json | null
          standards_alignment: string | null
          subject: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          content_markdown: string
          created_at?: string | null
          description?: string | null
          differentiation?: Json | null
          estimated_minutes?: number | null
          grade_level: number
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          quiz_questions?: Json | null
          standards_alignment?: string | null
          subject: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          content_markdown?: string
          created_at?: string | null
          description?: string | null
          differentiation?: Json | null
          estimated_minutes?: number | null
          grade_level?: number
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          quiz_questions?: Json | null
          standards_alignment?: string | null
          subject?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      parent_child_messages: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          is_important: boolean | null
          message_text: string
          message_type: string | null
          parent_id: string
          reaction: string | null
          read_at: string | null
          sender_type: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          message_text: string
          message_type?: string | null
          parent_id: string
          reaction?: string | null
          read_at?: string | null
          sender_type: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          message_text?: string
          message_type?: string | null
          parent_id?: string
          reaction?: string | null
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notifications: {
        Row: {
          action_url: string | null
          child_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          parent_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          child_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          parent_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          child_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          parent_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_notifications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_weekly_reports: {
        Row: {
          child_id: string
          conversation_starter: string | null
          growth_area: string | null
          id: string
          lessons_completed: number | null
          parent_id: string
          report_data: Json | null
          sent_at: string | null
          strongest_subject: string | null
          top_achievement: string | null
          total_points_earned: number | null
          week_start_date: string
        }
        Insert: {
          child_id: string
          conversation_starter?: string | null
          growth_area?: string | null
          id?: string
          lessons_completed?: number | null
          parent_id: string
          report_data?: Json | null
          sent_at?: string | null
          strongest_subject?: string | null
          top_achievement?: string | null
          total_points_earned?: number | null
          week_start_date: string
        }
        Update: {
          child_id?: string
          conversation_starter?: string | null
          growth_area?: string | null
          id?: string
          lessons_completed?: number | null
          parent_id?: string
          report_data?: Json | null
          sent_at?: string | null
          strongest_subject?: string | null
          top_achievement?: string | null
          total_points_earned?: number | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_weekly_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      parental_consent_log: {
        Row: {
          consent_text: string
          consent_type: string
          consent_version: string
          consented_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          parent_id: string
          user_agent: string | null
        }
        Insert: {
          consent_text: string
          consent_type: string
          consent_version: string
          consented_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          parent_id: string
          user_agent?: string | null
        }
        Update: {
          consent_text?: string
          consent_type?: string
          consent_version?: string
          consented_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          parent_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_consent_log_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_connections: {
        Row: {
          accepted_at: string | null
          child_id: string
          id: string
          peer_id: string
          requested_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          child_id: string
          id?: string
          peer_id: string
          requested_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          child_id?: string
          id?: string
          peer_id?: string
          requested_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_connections_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_connections_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          avatar_url: string | null
          birth_year: number | null
          coppa_consent_version: string | null
          coppa_consented_at: string | null
          created_at: string | null
          full_name: string
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
        }
        Insert: {
          age_verified?: boolean | null
          avatar_url?: string | null
          birth_year?: number | null
          coppa_consent_version?: string | null
          coppa_consented_at?: string | null
          created_at?: string | null
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
        }
        Update: {
          age_verified?: boolean | null
          avatar_url?: string | null
          birth_year?: number | null
          coppa_consent_version?: string | null
          coppa_consented_at?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
        }
        Relationships: []
      }
      rate_limit_violations: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          parent_id: string
          violation_type: string
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          parent_id: string
          violation_type: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          parent_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      review_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["review_status"]
          notes: string | null
          previous_status: Database["public"]["Enums"]["review_status"] | null
          review_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["review_status"]
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["review_status"] | null
          review_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["review_status"]
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["review_status"] | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_history_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_history_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "lesson_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_performance: {
        Row: {
          avg_review_time_minutes: number | null
          avg_score_given: number | null
          id: string
          reviewer_id: string
          reviews_this_week: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          avg_review_time_minutes?: number | null
          avg_score_given?: number | null
          id?: string
          reviewer_id: string
          reviews_this_week?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_review_time_minutes?: number | null
          avg_score_given?: number | null
          id?: string
          reviewer_id?: string
          reviews_this_week?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          child_id: string
          id: string
          parent_id: string | null
          parent_notes: string | null
          requested_at: string | null
          resolved_at: string | null
          reward_id: string
          status: string
        }
        Insert: {
          child_id: string
          id?: string
          parent_id?: string | null
          parent_notes?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          reward_id: string
          status?: string
        }
        Update: {
          child_id?: string
          id?: string
          parent_id?: string | null
          parent_notes?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string
          points_cost: number
          redemption_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id: string
          points_cost: number
          redemption_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string
          points_cost?: number
          redemption_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          id: string
          new_value: string | null
          performed_at: string | null
          performed_by: string | null
          previous_value: string | null
          reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          new_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_value?: string | null
          reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          new_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          previous_value?: string | null
          reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      screen_time_sessions: {
        Row: {
          activity_type: string | null
          child_id: string
          id: string
          lesson_id: string | null
          minutes_used: number | null
          session_end: string | null
          session_start: string | null
        }
        Insert: {
          activity_type?: string | null
          child_id: string
          id?: string
          lesson_id?: string | null
          minutes_used?: number | null
          session_end?: string | null
          session_start?: string | null
        }
        Update: {
          activity_type?: string | null
          child_id?: string
          id?: string
          lesson_id?: string | null
          minutes_used?: number | null
          session_end?: string | null
          session_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screen_time_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_time_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "screen_time_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      security_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_record_id: string | null
          accessed_table: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_record_id?: string | null
          accessed_table: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_record_id?: string | null
          accessed_table?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          content: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          lesson_id: string | null
          max_participants: number | null
          started_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          content?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_participants?: number | null
          started_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_participants?: number | null
          started_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "shared_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_lesson_performance: {
        Row: {
          attempts: number | null
          avg_score: number | null
          best_score: number | null
          child_id: string
          completed: boolean | null
          first_attempt_at: string | null
          id: string
          last_attempt_at: string | null
          lesson_id: string | null
          mastered: boolean | null
          struggled: boolean | null
          total_time_spent_seconds: number | null
        }
        Insert: {
          attempts?: number | null
          avg_score?: number | null
          best_score?: number | null
          child_id: string
          completed?: boolean | null
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          lesson_id?: string | null
          mastered?: boolean | null
          struggled?: boolean | null
          total_time_spent_seconds?: number | null
        }
        Update: {
          attempts?: number | null
          avg_score?: number | null
          best_score?: number | null
          child_id?: string
          completed?: boolean | null
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          lesson_id?: string | null
          mastered?: boolean | null
          struggled?: boolean | null
          total_time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_performance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lesson_performance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "student_lesson_performance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_baselines: {
        Row: {
          baseline_updated_at: string | null
          table_access_patterns: Json | null
          typical_access_times: string[] | null
          user_id: string
        }
        Insert: {
          baseline_updated_at?: string | null
          table_access_patterns?: Json | null
          typical_access_times?: string[] | null
          user_id: string
        }
        Update: {
          baseline_updated_at?: string | null
          table_access_patterns?: Json | null
          typical_access_times?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          child_id: string
          earned_at: string | null
          id: string
          progress: number | null
        }
        Insert: {
          badge_id: string
          child_id: string
          earned_at?: string | null
          id?: string
          progress?: number | null
        }
        Update: {
          badge_id?: string
          child_id?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "achievement_badges"
            referencedColumns: ["badge_id"]
          },
          {
            foreignKeyName: "user_badges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          child_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          score: number | null
          status: string
          time_spent_seconds: number | null
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          score?: number | null
          status?: string
          time_spent_seconds?: number | null
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          score?: number | null
          status?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_review_dashboard"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_leaderboard: {
        Row: {
          badge_count: number | null
          display_name: string | null
          level: number | null
          rank: number | null
          total_points: number | null
        }
        Relationships: []
      }
      lesson_review_dashboard: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          grade_level: number | null
          lesson_created_at: string | null
          lesson_id: string | null
          overall_score: number | null
          review_id: string | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          reviewer_id: string | null
          reviewer_name: string | null
          started_at: string | null
          status_label: string | null
          strengths: string | null
          subject: string | null
          suggestions: string | null
          title: string | null
          weaknesses: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_role: { Args: { _email: string }; Returns: undefined }
      auto_assign_pending_reviews: { Args: never; Returns: Json }
      award_creator_points: {
        Args: {
          p_child_id: string
          p_lesson_id?: string
          p_points: number
          p_reason: string
        }
        Returns: undefined
      }
      calculate_creator_level: { Args: { p_points: number }; Returns: number }
      calculate_engagement_score: {
        Args: {
          p_saves: number
          p_shares: number
          p_unique_viewers: number
          p_views: number
        }
        Returns: number
      }
      calculate_streak: { Args: { p_child_id: string }; Returns: number }
      check_platform_lesson_quota: {
        Args: { p_child_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests: number
          p_user_id: string
          p_window_minutes: number
        }
        Returns: Json
      }
      cleanup_expired_dedup_records: { Args: never; Returns: undefined }
      cleanup_idempotency_cache: { Args: never; Returns: undefined }
      cleanup_old_error_logs: { Args: never; Returns: undefined }
      decrypt_emotion_field: {
        Args: { ciphertext: string; encryption_key: string }
        Returns: string
      }
      encrypt_emotion_field: {
        Args: { encryption_key: string; plaintext: string }
        Returns: string
      }
      get_lesson_performance_overview: {
        Args: { p_lesson_id: string }
        Returns: {
          avg_score: number
          avg_time_minutes: number
          completion_rate: number
          difficulty_rating: number
          sample_size: number
          total_attempts: number
        }[]
      }
      get_review_statistics: {
        Args: never
        Returns: {
          approved_reviews: number
          avg_overall_score: number
          avg_review_time_hours: number
          in_review: number
          needs_revision: number
          pending_reviews: number
          rejected_reviews: number
          total_reviews: number
        }[]
      }
      get_struggling_students: {
        Args: { p_lesson_id: string }
        Returns: {
          attempts: number
          avg_score: number
          child_id: string
          child_name: string
          last_attempt: string
        }[]
      }
      has_permission: {
        Args: {
          _required_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_lesson_usage: {
        Args: { lesson_uuid: string }
        Returns: undefined
      }
      internal_is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      log_sensitive_access: {
        Args: {
          p_access_type: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      request_collaboration: {
        Args: {
          p_child_id: string
          p_idempotency_key?: string
          p_lesson_id: string
          p_target_child_id: string
        }
        Returns: Json
      }
      update_lesson_performance_metrics: {
        Args: { p_lesson_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "parent" | "child" | "admin" | "moderator"
      review_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "needs_revision"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["parent", "child", "admin", "moderator"],
      review_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "needs_revision",
      ],
    },
  },
} as const
