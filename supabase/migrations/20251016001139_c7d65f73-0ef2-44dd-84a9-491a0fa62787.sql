-- Enable realtime publication for parent_notifications table
-- This ensures RLS policies are enforced on realtime broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE parent_notifications;