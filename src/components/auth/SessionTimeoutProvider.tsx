import { ReactNode } from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface SessionTimeoutProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * SessionTimeoutProvider - Wraps authenticated routes to enforce session timeout
 * Times out after 15 minutes of inactivity with 2-minute warning
 */
export const SessionTimeoutProvider = ({ children, enabled = true }: SessionTimeoutProviderProps) => {
  useSessionTimeout({ enabled });
  return <>{children}</>;
};