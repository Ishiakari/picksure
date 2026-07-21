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
 * Supports pull-to-refresh and async Supabase template merging.
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRemoteTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      if (data && data.length > 0) {
        const existingIds = new Set(cachedTemplates.map(t => t.id));
        const newRemote = data.filter(t => !existingIds.has(t.id));
        if (newRemote.length > 0) {
          cachedTemplates = [...newRemote, ...cachedTemplates];
          notifyListeners();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates');
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchRemoteTemplates();
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    // Register listener for real-time local updates
    const handleUpdate = (updatedList: Template[]) => {
      if (isMounted) setTemplates(updatedList);
    };
    listeners.push(handleUpdate);

    fetchRemoteTemplates();

    return () => {
      isMounted = false;
      listeners = listeners.filter(l => l !== handleUpdate);
    };
  }, []);

  return { templates, loading, refreshing, refresh, error };
}
