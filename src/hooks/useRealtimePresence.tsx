import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceData {
  user_id: string;
  child_id?: string;
  online_at: string;
  current_page?: string;
  is_active: boolean;
}

interface UseRealtimePresenceProps {
  roomId: string;
  userId: string;
  childId?: string;
}

export const useRealtimePresence = ({ roomId, userId, childId }: UseRealtimePresenceProps) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceData[]>>({});
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Track current user's presence
  const trackPresence = useCallback(
    async (currentPage?: string) => {
      if (!channel) return;

      try {
        await channel.track({
          user_id: userId,
          child_id: childId,
          online_at: new Date().toISOString(),
          current_page: currentPage,
          is_active: true,
        });
      } catch (err) {
        console.error('Error tracking presence:', err);
      }
    },
    [channel, userId, childId]
  );

  // Untrack user's presence (going offline)
  const untrackPresence = useCallback(async () => {
    if (!channel) return;

    try {
      await channel.untrack();
    } catch (err) {
      console.error('Error untracking presence:', err);
    }
  }, [channel]);

  // Set up presence channel
  useEffect(() => {
    const presenceChannel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('[Presence] Sync:', state);
        setOnlineUsers(state as unknown as Record<string, PresenceData[]>);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] Join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] Leave:', key, leftPresences);
      })
      .subscribe(async (status) => {
        console.log('[Presence] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track initial presence
          await presenceChannel.track({
            user_id: userId,
            child_id: childId,
            online_at: new Date().toISOString(),
            is_active: true,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      console.log('[Presence] Cleaning up presence channel');
      presenceChannel.unsubscribe();
    };
  }, [roomId, userId, childId]);

  // Get count of online users
  const onlineCount = Object.keys(onlineUsers).length;

  // Check if a specific user is online
  const isUserOnline = useCallback(
    (checkUserId: string) => {
      return !!onlineUsers[checkUserId];
    },
    [onlineUsers]
  );

  // Get online children IDs
  const getOnlineChildren = useCallback(() => {
    const children: string[] = [];
    Object.values(onlineUsers).forEach((presences) => {
      presences.forEach((presence) => {
        if (presence.child_id && presence.is_active) {
          children.push(presence.child_id);
        }
      });
    });
    return [...new Set(children)];
  }, [onlineUsers]);

  return {
    onlineUsers,
    onlineCount,
    isConnected,
    isUserOnline,
    getOnlineChildren,
    trackPresence,
    untrackPresence,
  };
};
