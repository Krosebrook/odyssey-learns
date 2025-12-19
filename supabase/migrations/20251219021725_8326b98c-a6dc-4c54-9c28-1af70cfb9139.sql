-- Enable realtime for parent_child_messages table
ALTER TABLE public.parent_child_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_child_messages;

-- Enable realtime for user_progress table
ALTER TABLE public.user_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_progress;