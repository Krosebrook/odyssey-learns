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
          difficulty: string | null
          estimated_minutes: number | null
          generation_prompt: string | null
          grade_level: number
          id: string
          is_active: boolean | null
          parent_id: string
          points_value: number | null
          quiz_questions: Json | null
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          child_id: string
          content_markdown: string
          created_at?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          generation_prompt?: string | null
          grade_level: number
          id?: string
          is_active?: boolean | null
          parent_id: string
          points_value?: number | null
          quiz_questions?: Json | null
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          content_markdown?: string
          created_at?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          generation_prompt?: string | null
          grade_level?: number
          id?: string
          is_active?: boolean | null
          parent_id?: string
          points_value?: number | null
          quiz_questions?: Json | null
          subject?: string
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
        ]
      }
      children: {
        Row: {
          avatar_config: Json | null
          challenge_mode_enabled: boolean | null
          created_at: string | null
          daily_quest_id: string | null
          daily_screen_time_limit_minutes: number | null
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
      emotion_logs: {
        Row: {
          child_id: string
          coping_strategy: string | null
          created_at: string | null
          emotion_type: string
          id: string
          intensity: number
          logged_at: string | null
          reflection_notes: string | null
          trigger: string | null
        }
        Insert: {
          child_id: string
          coping_strategy?: string | null
          created_at?: string | null
          emotion_type: string
          id?: string
          intensity: number
          logged_at?: string | null
          reflection_notes?: string | null
          trigger?: string | null
        }
        Update: {
          child_id?: string
          coping_strategy?: string | null
          created_at?: string | null
          emotion_type?: string
          id?: string
          intensity?: number
          logged_at?: string | null
          reflection_notes?: string | null
          trigger?: string | null
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
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
        }
        Update: {
          avatar_url?: string | null
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
          id: string
          metadata: Json | null
          parent_id: string
          violation_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id: string
          violation_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string
          violation_type?: string
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
            referencedRelation: "lessons"
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
            referencedRelation: "lessons"
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
      [_ in never]: never
    }
    Functions: {
      add_admin_role: {
        Args: { _email: string }
        Returns: undefined
      }
      calculate_streak: {
        Args: { p_child_id: string }
        Returns: number
      }
      check_platform_lesson_quota: {
        Args: { p_child_id: string }
        Returns: Json
      }
      cleanup_idempotency_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
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
    }
    Enums: {
      app_role: "parent" | "child" | "admin" | "moderator"
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
    },
  },
} as const
