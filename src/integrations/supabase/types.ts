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
      children: {
        Row: {
          avatar_config: Json | null
          challenge_mode_enabled: boolean | null
          created_at: string | null
          grade_level: number
          id: string
          name: string
          parent_id: string
          pin_hash: string | null
          total_points: number | null
          weekly_report_enabled: boolean | null
        }
        Insert: {
          avatar_config?: Json | null
          challenge_mode_enabled?: boolean | null
          created_at?: string | null
          grade_level: number
          id?: string
          name: string
          parent_id: string
          pin_hash?: string | null
          total_points?: number | null
          weekly_report_enabled?: boolean | null
        }
        Update: {
          avatar_config?: Json | null
          challenge_mode_enabled?: boolean | null
          created_at?: string | null
          grade_level?: number
          id?: string
          name?: string
          parent_id?: string
          pin_hash?: string | null
          total_points?: number | null
          weekly_report_enabled?: boolean | null
        }
        Relationships: [
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          child_id: string
          id: string
          requested_at: string | null
          resolved_at: string | null
          reward_id: string
          status: string
        }
        Insert: {
          child_id: string
          id?: string
          requested_at?: string | null
          resolved_at?: string | null
          reward_id: string
          status?: string
        }
        Update: {
          child_id?: string
          id?: string
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
          child_id: string
          id: string
          minutes_used: number | null
          session_end: string | null
          session_start: string | null
        }
        Insert: {
          child_id: string
          id?: string
          minutes_used?: number | null
          session_end?: string | null
          session_start?: string | null
        }
        Update: {
          child_id?: string
          id?: string
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
