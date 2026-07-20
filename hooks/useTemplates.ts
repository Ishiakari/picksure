import { useState, useEffect } from 'react';
import { Template } from '@/src/data/templates';
import { templateService } from '@/services/templateService';

/**
 * Custom React Hook for accessing template dataset.
 * Handles loading, error states, and future Supabase dynamic updates.
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        setLoading(true);
        const data = await templateService.getTemplates();
        if (isMounted) {
          setTemplates(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load templates');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  return { templates, loading, error };
}
