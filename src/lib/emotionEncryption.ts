import { supabase } from '@/integrations/supabase/client';

/**
 * Generate encryption key from user session token
 * Uses first 32 characters of access token for symmetric encryption
 */
const getEncryptionKey = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session for encryption');
  // Use session token as encryption key (unique per user)
  return session.access_token.substring(0, 32);
};

/**
 * Encrypt sensitive emotion data before storing in database
 * Uses pgcrypto's symmetric encryption via RPC
 */
export const encryptEmotionData = async (
  trigger: string | null,
  copingStrategy: string | null,
  reflectionNotes: string | null
) => {
  const key = await getEncryptionKey();
  
  const encryptField = async (field: string | null) => {
    if (!field) return null;
    const { data, error } = await supabase.rpc('encrypt_emotion_field', {
      plaintext: field,
      encryption_key: key
    });
    if (error) throw error;
    return data;
  };

  return {
    trigger_encrypted: await encryptField(trigger),
    coping_strategy_encrypted: await encryptField(copingStrategy),
    reflection_notes_encrypted: await encryptField(reflectionNotes)
  };
};

/**
 * Decrypt sensitive emotion data when reading from database
 * Uses pgcrypto's symmetric decryption via RPC
 */
export const decryptEmotionData = async (
  triggerEncrypted: any,
  copingStrategyEncrypted: any,
  reflectionNotesEncrypted: any
) => {
  const key = await getEncryptionKey();
  
  const decryptField = async (field: any) => {
    if (!field) return null;
    const { data, error } = await supabase.rpc('decrypt_emotion_field', {
      ciphertext: field,
      encryption_key: key
    });
    if (error) {
      console.error('Decryption error:', error);
      return null;
    }
    return data;
  };

  return {
    trigger: await decryptField(triggerEncrypted),
    coping_strategy: await decryptField(copingStrategyEncrypted),
    reflection_notes: await decryptField(reflectionNotesEncrypted)
  };
};
