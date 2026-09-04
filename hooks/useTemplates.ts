import { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { Template } from '@/src/data/templates';
import { templateService } from '@/services/templateService';

// Module-level cache so uploaded templates persist across navigation tabs
let cachedTemplates: Template[] = [];
let listeners: Array<(templates: Template[]) => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...cachedTemplates]));
}

export function addCustomTemplateToFeed(newTemplate: Template) {
  // Prepend new template and ensure no duplicates
  cachedTemplates = [newTemplate, ...cachedTemplates.filter((t) => t.id !== newTemplate.id)];
  notifyListeners();

  // Prefetch image if remote URI
  if (
    typeof newTemplate.imageSource === 'object' &&
    'uri' in newTemplate.imageSource &&
    newTemplate.imageSource.uri
  ) {
    Image.prefetch(newTemplate.imageSource.uri, 'memory-disk');
  }
}

export function updateTemplateStatsInFeed(id: string, savedCount: number, usedCount: number) {
  cachedTemplates = cachedTemplates.map((t) => {
    if (t.id === id) {
      return {
        ...t,
        savedCount: String(savedCount),
        usedCount: String(usedCount),
      };
    }
    return t;
  });
  notifyListeners();
}

/**
 * Custom React Hook for accessing template dataset from Supabase with pagination, error handling, and image prefetching.
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates);
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(cachedTemplates.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const prefetchImages = (items: Template[]) => {
    const urlsToPrefetch: string[] = [];
    items.forEach((item) => {
      if (
        typeof item.imageSource === 'object' &&
        'uri' in item.imageSource &&
        item.imageSource.uri
      ) {
        if (item.imageSource.uri.startsWith('http')) {
          urlsToPrefetch.push(item.imageSource.uri);
        }
      }
    });

    if (urlsToPrefetch.length > 0) {
      Image.prefetch(urlsToPrefetch, 'memory-disk').catch((err) => {
        console.warn('Background image prefetch warning:', err);
      });
    }
  };

  const fetchPage = async (pageToFetch: number, isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageToFetch > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await templateService.getTemplates(pageToFetch, 10);
      setHasMore(res.hasMore);

      // Background pre-fetch images
      prefetchImages(res.templates);

      if (isRefresh || pageToFetch === 0) {
        cachedTemplates = [...res.templates];
        setTemplates([...cachedTemplates]);
        setPage(0);
      } else if (res.templates.length > 0) {
        const existingIds = new Set(cachedTemplates.map((t) => t.id));
        const uniqueNextPage = res.templates.filter((t) => !existingIds.has(t.id));
        if (uniqueNextPage.length > 0) {
          cachedTemplates = [...cachedTemplates, ...uniqueNextPage];
          setTemplates([...cachedTemplates]);
        }
        setPage(pageToFetch);
      }
    } catch (err: any) {
      console.error('Failed to load templates in useTemplates:', err);
      setError(err?.message || 'Failed to load templates from database');
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

  const retry = useCallback(() => {
    fetchPage(0, false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleUpdate = (updatedList: Template[]) => {
      if (isMounted) setTemplates(updatedList);
    };
    listeners.push(handleUpdate);

    // Initial fetch if cache is empty or stale
    if (cachedTemplates.length === 0) {
      fetchPage(0);
    }

    return () => {
      isMounted = false;
      listeners = listeners.filter((l) => l !== handleUpdate);
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
    retry,
    error,
  };
}

