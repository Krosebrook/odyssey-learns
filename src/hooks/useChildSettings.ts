import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Child settings type
 */
export interface ChildSettings {
  id: string;
  name: string;
  challenge_mode_enabled: boolean;
  daily_screen_time_limit_minutes: number;
  weekly_report_enabled: boolean;
  total_points: number;
}

/**
 * Settings update input
 */
export interface UpdateChildSettingsInput {
  challenge_mode_enabled?: boolean;
  daily_screen_time_limit_minutes?: number;
  weekly_report_enabled?: boolean;
}

/**
 * Query key factory for child settings
 */
export const childSettingsKeys = {
  all: ['child-settings'] as const,
  byId: (childId: string) => [...childSettingsKeys.all, childId] as const,
};

/**
 * Fetch child settings from Supabase
 */
const fetchChildSettings = async (childId: string): Promise<ChildSettings> => {
  const { data, error } = await supabase
    .from('children')
    .select('id, name, challenge_mode_enabled, daily_screen_time_limit_minutes, weekly_report_enabled, total_points')
    .eq('id', childId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch child settings: ${error.message}`);
  }

  if (!data) {
    throw new Error('Child not found');
  }

  return {
    ...data,
    challenge_mode_enabled: data.challenge_mode_enabled || false,
    daily_screen_time_limit_minutes: data.daily_screen_time_limit_minutes || 60,
    weekly_report_enabled: data.weekly_report_enabled !== false,
    total_points: data.total_points || 0,
  };
};

/**
 * Update child settings in Supabase
 */
const updateChildSettings = async ({
  childId,
  settings,
}: {
  childId: string;
  settings: UpdateChildSettingsInput;
}): Promise<void> => {
  const { error } = await supabase
    .from('children')
    .update(settings)
    .eq('id', childId);

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }
};

/**
 * Custom hook for managing child settings with React Query
 * 
 * Provides:
 * - Cached settings data with automatic background refetching
 * - Optimistic updates for better UX
 * - Automatic error handling
 * - Loading states
 * 
 * @param childId - The ID of the child
 * @returns Object with settings data, loading state, and update function
 * 
 * @example
 * const { settings, isLoading, updateSettings } = useChildSettings(childId);
 * 
 * // Update settings with optimistic update
 * updateSettings.mutate({ challenge_mode_enabled: true });
 */
export function useChildSettings(childId: string | null) {
  const queryClient = useQueryClient();

  // Query for fetching settings
  const query = useQuery({
    queryKey: childSettingsKeys.byId(childId || ''),
    queryFn: () => fetchChildSettings(childId!),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: (settings: UpdateChildSettingsInput) =>
      updateChildSettings({ childId: childId!, settings }),
    
    // Optimistic update: immediately update UI before server responds
    onMutate: async (newSettings) => {
      if (!childId) return;

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: childSettingsKeys.byId(childId) });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<ChildSettings>(
        childSettingsKeys.byId(childId)
      );

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<ChildSettings>(
          childSettingsKeys.byId(childId),
          {
            ...previousSettings,
            ...newSettings,
          }
        );
      }

      // Return context object with the snapshotted value
      return { previousSettings };
    },
    
    // On error, rollback to the previous value
    onError: (err, newSettings, context) => {
      if (context?.previousSettings && childId) {
        queryClient.setQueryData(
          childSettingsKeys.byId(childId),
          context.previousSettings
        );
      }
      toast.error('Failed to save settings. Please try again.');
      console.error('Settings update error:', err);
    },
    
    // Always refetch after error or success
    onSettled: () => {
      if (childId) {
        queryClient.invalidateQueries({ queryKey: childSettingsKeys.byId(childId) });
      }
    },
    
    // Show success toast
    onSuccess: () => {
      toast.success('Settings saved successfully!');
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateSettings: updateMutation,
    refetch: query.refetch,
  };
}

/**
 * Prefetch child settings for better UX
 * Call this before navigating to the settings page
 * 
 * @param childId - The ID of the child
 * @param queryClient - The React Query client instance
 * 
 * @example
 * <Link 
 *   to="/settings" 
 *   onMouseEnter={() => prefetchChildSettings(childId, queryClient)}
 * >
 *   Settings
 * </Link>
 */
export function prefetchChildSettings(
  childId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  queryClient.prefetchQuery({
    queryKey: childSettingsKeys.byId(childId),
    queryFn: () => fetchChildSettings(childId),
    staleTime: 2 * 60 * 1000,
  });
}
