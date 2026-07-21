import { useState, useEffect } from 'react';
import { TEMPLATES, Template } from '@/src/data/templates';
import { templateService } from '@/services/templateService';

// Module-level cache so uploaded templates persist across navigation tabs
let cachedTemplates: Template[] = [...TEMPLATES];
let listeners: Array<(templates: Template[]) => void> = [];

function notifyListeners() {
  listeners.forEach(listener => listener([...cachedTemplates]));
}

export function addCustomTemplateToFeed(newTemplate: Template) {
  cachedTemplates = [newTemplate, ...cachedTemplates];
  notifyListeners();
}

/**
 * Custom React Hook for accessing template dataset.
 * Guarantees local fallback templates display instantly, while merging Supabase DB templates asynchronously.
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Register listener for real-time local updates
    const handleUpdate = (updatedList: Template[]) => {
      if (isMounted) setTemplates(updatedList);
    };
    listeners.push(handleUpdate);

    async function loadTemplates() {
      try {
        setLoading(true);
        const data = await templateService.getTemplates();
        if (isMounted && data && data.length > 0) {
          // Merge unique remote templates with cached list
          const existingIds = new Set(cachedTemplates.map(t => t.id));
          const newRemote = data.filter(t => !existingIds.has(t.id));
          if (newRemote.length > 0) {
            cachedTemplates = [...newRemote, ...cachedTemplates];
            setTemplates([...cachedTemplates]);
          }
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
      listeners = listeners.filter(l => l !== handleUpdate);
    };
  }, []);

  return { templates, loading, error };
}
