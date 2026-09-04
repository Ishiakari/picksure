import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

let cachedBookmarkedIds: Set<string> = new Set();
let listeners: Array<(ids: Set<string>) => void> = [];

function notifyListeners() {
  const snapshot = new Set(cachedBookmarkedIds);
  listeners.forEach((listener) => listener(snapshot));
}

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(cachedBookmarkedIds);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userKey = user?.id || 'guest';
      const sIds = new Set<string>();

      // 1. Fetch from Supabase if authenticated
      if (user?.id) {
        const { data, error: dbError } = await supabase
          .from('saved_templates')
          .select('template_id')
          .eq('user_id', user.id);
        if (dbError) {
          console.warn('Supabase saved_templates error:', dbError.message);
        } else if (data) {
          data.forEach((row) => sIds.add(row.template_id));
        }
      }

      // 2. Fallback / merge with local device AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const prefix = 'saved_template_' + userKey + '_';
      for (const k of keys) {
        if (k.startsWith(prefix)) {
          const val = await AsyncStorage.getItem(k);
          if (val === 'true') {
            sIds.add(k.replace(prefix, ''));
          }
        }
      }

      cachedBookmarkedIds = sIds;
      setBookmarkedIds(new Set(sIds));
      notifyListeners();
    } catch (err: any) {
      console.warn('Error loading bookmarks:', err);
      setError(err?.message || 'Failed to load saved templates');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const handleUpdate = (updatedIds: Set<string>) => {
      if (isMounted) {
        setBookmarkedIds(new Set(updatedIds));
      }
    };
    listeners.push(handleUpdate);

    loadBookmarks();

    return () => {
      isMounted = false;
      listeners = listeners.filter((l) => l !== handleUpdate);
    };
  }, [loadBookmarks]);

  const toggleBookmark = useCallback(
    async (templateId: string): Promise<boolean> => {
      const userKey = user?.id || 'guest';
      const isCurrentlySaved = cachedBookmarkedIds.has(templateId);
      const nextSaved = !isCurrentlySaved;

      // Optimistic update
      const updated = new Set(cachedBookmarkedIds);
      if (isCurrentlySaved) {
        updated.delete(templateId);
      } else {
        updated.add(templateId);
      }
      cachedBookmarkedIds = updated;
      setBookmarkedIds(new Set(updated));
      notifyListeners();

      // Persistence
      try {
        const localKey = 'saved_template_' + userKey + '_' + templateId;
        if (nextSaved) {
          await AsyncStorage.setItem(localKey, 'true');
          if (user?.id) {
            await supabase
              .from('saved_templates')
              .upsert([{ user_id: user.id, template_id: templateId }], {
                onConflict: 'user_id,template_id',
              });
          }
        } else {
          await AsyncStorage.removeItem(localKey);
          if (user?.id) {
            await supabase
              .from('saved_templates')
              .delete()
              .eq('user_id', user.id)
              .eq('template_id', templateId);
          }
        }
        return nextSaved;
      } catch (err) {
        console.warn('Toggle bookmark sync error:', err);
        // Rollback on failure
        cachedBookmarkedIds = new Set(bookmarkedIds);
        setBookmarkedIds(new Set(bookmarkedIds));
        notifyListeners();
        throw err;
      }
    },
    [user?.id, bookmarkedIds]
  );

  const isBookmarked = useCallback(
    (templateId: string): boolean => {
      return bookmarkedIds.has(templateId);
    },
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    reloadBookmarks: loadBookmarks,
    loading,
    error,
  };
}

