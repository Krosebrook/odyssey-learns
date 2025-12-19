import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender_type: 'parent' | 'child';
  message_type: string;
  message_text: string;
  is_important: boolean;
  read_at: string | null;
  created_at: string;
  parent_id: string;
  child_id: string;
}

interface UseRealtimeMessagesProps {
  childId: string | null;
  parentId: string;
}

export const useRealtimeMessages = ({ childId, parentId }: UseRealtimeMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!childId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('parent_child_messages')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMessages((data || []) as Message[]);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!childId) return;

    loadMessages();

    const channel = supabase
      .channel(`messages:${childId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parent_child_messages',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          console.log('[Realtime] New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parent_child_messages',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          console.log('[Realtime] Message updated:', payload);
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from messages channel');
      supabase.removeChannel(channel);
    };
  }, [childId, loadMessages]);

  // Send a message with optimistic update
  const sendMessage = useCallback(
    async (
      messageText: string,
      messageType: 'text' | 'encouragement' | 'celebration' = 'text'
    ) => {
      if (!childId || !messageText.trim()) return { success: false };

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        parent_id: parentId,
        child_id: childId,
        sender_type: 'parent',
        message_type: messageType,
        message_text: messageText.trim(),
        is_important: messageType === 'encouragement' || messageType === 'celebration',
        read_at: null,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const { data, error: insertError } = await supabase
          .from('parent_child_messages')
          .insert({
            parent_id: parentId,
            child_id: childId,
            sender_type: 'parent',
            message_type: messageType,
            message_text: messageText.trim(),
            is_important: messageType === 'encouragement' || messageType === 'celebration',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? (data as Message) : msg
          )
        );

        return { success: true, data };
      } catch (err) {
        console.error('Error sending message:', err);
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
        return { success: false, error: err };
      }
    },
    [childId, parentId]
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!childId) return;

    try {
      await supabase
        .from('parent_child_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('child_id', childId)
        .eq('sender_type', 'child')
        .is('read_at', null);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [childId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch: loadMessages,
  };
};
