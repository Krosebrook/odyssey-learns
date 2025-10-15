import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Secure hook for child selection that validates ownership server-side.
 * NEVER trust localStorage for authorization - this validates against the database.
 */
export const useValidatedChild = () => {
  const [childId, setChildId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const validateChild = async () => {
      if (!user) {
        setChildId(null);
        setIsValidating(false);
        return;
      }

      const storedChildId = localStorage.getItem('selectedChildId');
      
      if (!storedChildId) {
        setChildId(null);
        setIsValidating(false);
        return;
      }

      // Validate ownership server-side via RLS
      const { data, error } = await supabase
        .from('children')
        .select('id')
        .eq('id', storedChildId)
        .eq('parent_id', user.id)
        .single();

      if (error || !data) {
        // Invalid child ID - clear it
        localStorage.removeItem('selectedChildId');
        setChildId(null);
        navigate('/');
      } else {
        setChildId(data.id);
      }
      
      setIsValidating(false);
    };

    validateChild();
  }, [user, navigate]);

  const selectChild = async (newChildId: string) => {
    if (!user) return false;

    // Validate ownership before storing
    const { data, error } = await supabase
      .from('children')
      .select('id')
      .eq('id', newChildId)
      .eq('parent_id', user.id)
      .single();

    if (error || !data) {
      return false;
    }

    localStorage.setItem('selectedChildId', newChildId);
    setChildId(newChildId);
    return true;
  };

  return { childId, isValidating, selectChild };
};
