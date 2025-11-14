import { supabase } from '@/integrations/supabase/client';

/**
 * Log access to sensitive tables for security auditing
 * Note: INSERT/UPDATE/DELETE are automatically logged via database triggers
 * This function is for logging SELECT operations from the application
 */
export const logAccess = async (
  tableName: string,
  recordId: string | null,
  accessType: 'view' | 'insert' | 'update' | 'delete',
  metadata?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Don't log anonymous access

    await supabase.from('security_access_log').insert({
      user_id: user.id,
      accessed_table: tableName,
      accessed_record_id: recordId,
      access_type: accessType,
      user_agent: navigator.userAgent,
      metadata: metadata || {}
    });
  } catch (error) {
    // Log to console but don't fail the operation
    console.warn('Failed to log access:', error);
  }
};

/**
 * Log when parent views emotion logs (sensitive mental health data)
 */
export const logEmotionLogView = (emotionLogId: string, childId: string) =>
  logAccess('emotion_logs', emotionLogId, 'view', { child_id: childId });

/**
 * Log when parent views messages with child
 */
export const logMessageView = (messageId: string, childId: string) =>
  logAccess('parent_child_messages', messageId, 'view', { child_id: childId });

/**
 * Log when parent views child's profile data
 */
export const logChildDataView = (childId: string) =>
  logAccess('children', childId, 'view', {});

/**
 * Log when parent views child's academic progress
 */
export const logProgressView = (progressId: string, childId: string) =>
  logAccess('user_progress', progressId, 'view', { child_id: childId });
