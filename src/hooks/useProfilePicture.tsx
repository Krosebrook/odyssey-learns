/**
 * Custom hook for managing profile picture uploads
 * 
 * Features:
 * - Upload profile pictures to Supabase Storage
 * - Delete existing profile pictures
 * - Optimistic UI updates
 * - Error handling and retry logic
 * - Loading states
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateAndPrepareProfilePicture, generateProfilePictureFilename } from '@/lib/profilePictureUpload';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'profile-pictures';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface UseProfilePictureReturn {
  uploading: boolean;
  deleting: boolean;
  uploadProfilePicture: (file: File, childId: string) => Promise<string | null>;
  deleteProfilePicture: (childId: string, currentUrl: string | null) => Promise<boolean>;
  getProfilePictureUrl: (path: string) => string;
}

/**
 * Waits for a specified delay (for retries)
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extracts the file path from a full storage URL
 */
const extractPathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
};

export function useProfilePicture(): UseProfilePictureReturn {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Uploads a profile picture with retries
   */
  const uploadWithRetry = async (
    file: File,
    path: string,
    retryCount = 0
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Upload failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await wait(RETRY_DELAY * (retryCount + 1));
        return uploadWithRetry(file, path, retryCount + 1);
      }
      throw error;
    }
  };

  /**
   * Uploads a profile picture
   */
  const uploadProfilePicture = useCallback(
    async (file: File, childId: string): Promise<string | null> => {
      setUploading(true);

      try {
        // Validate and prepare the file
        const processedFile = await validateAndPrepareProfilePicture(file);

        // Generate unique filename
        const filename = generateProfilePictureFilename(childId, processedFile);
        const filePath = `${childId}/${filename}`;

        // Upload to Supabase Storage
        const publicUrl = await uploadWithRetry(processedFile, filePath);

        // Update child record with new profile picture URL
        const { error: updateError } = await supabase
          .from('children')
          .update({ profile_picture_url: publicUrl })
          .eq('id', childId);

        if (updateError) {
          console.error('Failed to update child record:', updateError);
          throw new Error('Failed to save profile picture URL');
        }

        toast.success('Profile picture uploaded successfully!');
        return publicUrl;
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile picture';
        toast.error(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  /**
   * Deletes a profile picture with retries
   */
  const deleteWithRetry = async (
    path: string,
    retryCount = 0
  ): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Delete failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await wait(RETRY_DELAY * (retryCount + 1));
        return deleteWithRetry(path, retryCount + 1);
      }
      throw error;
    }
  };

  /**
   * Deletes the current profile picture
   */
  const deleteProfilePicture = useCallback(
    async (childId: string, currentUrl: string | null): Promise<boolean> => {
      if (!currentUrl) {
        toast.error('No profile picture to delete');
        return false;
      }

      setDeleting(true);

      try {
        // Extract file path from URL
        const filePath = extractPathFromUrl(currentUrl);
        if (!filePath) {
          throw new Error('Invalid profile picture URL');
        }

        // Delete from storage
        await deleteWithRetry(filePath);

        // Update child record to remove profile picture URL
        const { error: updateError } = await supabase
          .from('children')
          .update({ profile_picture_url: null })
          .eq('id', childId);

        if (updateError) {
          console.error('Failed to update child record:', updateError);
          throw new Error('Failed to remove profile picture URL');
        }

        toast.success('Profile picture removed successfully!');
        return true;
      } catch (error) {
        console.error('Error deleting profile picture:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile picture';
        toast.error(errorMessage);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  /**
   * Gets a public URL for a profile picture path
   */
  const getProfilePictureUrl = useCallback((path: string): string => {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return {
    uploading,
    deleting,
    uploadProfilePicture,
    deleteProfilePicture,
    getProfilePictureUrl,
  };
}
