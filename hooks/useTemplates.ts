import { useState, useEffect, useCallback } from 'react';
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
 * Custom React Hook for accessing template dataset with infinite pagination.
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates);
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (pageToFetch: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageToFetch > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await templateService.getTemplates(pageToFetch, 10);
      setHasMore(res.hasMore);

      if (isRefresh || pageToFetch === 0) {
        const existingIds = new Set(TEMPLATES.map(t => t.id));
        const newItems = res.templates.filter(t => !existingIds.has(t.id));
        cachedTemplates = [...newItems, ...TEMPLATES];
        setTemplates([...cachedTemplates]);
        setPage(0);
      } else if (res.templates.length > 0) {
        const existingIds = new Set(cachedTemplates.map(t => t.id));
        const uniqueNextPage = res.templates.filter(t => !existingIds.has(t.id));
        if (uniqueNextPage.length > 0) {
          cachedTemplates = [...cachedTemplates, ...uniqueNextPage];
          setTemplates([...cachedTemplates]);
        }
        setPage(pageToFetch);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && !refreshing && hasMore) {
      fetchPage(page + 1);
    }
  }, [page, loadingMore, loading, refreshing, hasMore]);

  const refresh = useCallback(() => {
    fetchPage(0, true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleUpdate = (updatedList: Template[]) => {
      if (isMounted) setTemplates(updatedList);
    };
    listeners.push(handleUpdate);

    fetchPage(0);

    return () => {
      isMounted = false;
      listeners = listeners.filter(l => l !== handleUpdate);
    };
  }, []);

  return { 
    templates, 
    loading, 
    loadingMore, 
    refreshing, 
    hasMore, 
    loadMore, 
    refresh, 
    error 
  };
}
