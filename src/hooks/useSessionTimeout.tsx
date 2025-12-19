import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes warning

interface UseSessionTimeoutOptions {
  enabled?: boolean;
  onTimeout?: () => void;
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const { enabled = true, onTimeout } = options;
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    warningShownRef.current = false;
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    toast.error('Session expired due to inactivity', {
      description: 'Please sign in again to continue.',
      duration: 10000,
    });
    
    if (onTimeout) {
      onTimeout();
    }
    
    await signOut();
  }, [clearTimers, signOut, onTimeout]);

  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;
    
    toast.warning('Session expiring soon', {
      description: 'Your session will expire in 2 minutes due to inactivity. Move your mouse or press a key to stay signed in.',
      duration: 30000,
      id: 'session-warning',
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled || !user) return;

    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, INACTIVITY_TIMEOUT_MS);

    // Update last activity timestamp in sessionStorage
    sessionStorage.setItem('session_activity', Date.now().toString());
  }, [enabled, user, clearTimers, showWarning, handleTimeout]);

  useEffect(() => {
    if (!enabled || !user) {
      clearTimers();
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    
    // Debounce the reset to avoid too many updates
    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedReset = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resetTimer, 1000);
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, debouncedReset, { passive: true });
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, debouncedReset);
      });
      if (debounceTimer) clearTimeout(debounceTimer);
      clearTimers();
    };
  }, [enabled, user, resetTimer, clearTimers]);

  // Check if session should already be expired on mount
  useEffect(() => {
    if (!enabled || !user) return;

    const lastActivity = sessionStorage.getItem('session_activity');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleTimeout();
      }
    }
  }, [enabled, user, handleTimeout]);

  return {
    resetTimer,
    clearTimers,
  };
};