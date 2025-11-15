// TODO: Remove when Supabase types regenerate
export interface SurveyResponse {
  id: string;
  user_id: string;
  campaign_id: string;
  nps_score: number;
  feedback_text?: string;
  would_recommend: boolean;
  top_feature?: string;
  improvement_area?: string;
  submitted_at: string;
  created_at: string;
}

export interface SurveyCampaign {
  id: string;
  name: string;
  description?: string;
  target_audience: string;
  trigger_condition: any;
  active: boolean;
  sent_count: number;
  response_count: number;
  nps_score?: number;
  recipients_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyReminder {
  id: string;
  campaign_id: string;
  user_id: string;
  scheduled_for: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
}
