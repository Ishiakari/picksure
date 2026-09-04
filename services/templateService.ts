// services/templateService.ts
import { Template } from '@/src/data/templates';
import { CategoryType } from '@/src/constants/categories';
import { supabase } from '@/lib/supabase';

export interface PaginatedTemplatesResult {
  templates: Template[];
  hasMore: boolean;
}

export interface ParsedTipsResult {
  tips: string[];
  cleanDescription: string;
}

export function parseTips(
  rawTips: unknown,
  rawDescription?: string | null
): ParsedTipsResult {
  let tipsArray: string[] = [];

  if (Array.isArray(rawTips) && rawTips.length > 0) {
    tipsArray = rawTips
      .map((t) => (t !== null && t !== undefined ? String(t).trim() : ''))
      .filter((t) => t.length > 0);
  } else if (typeof rawTips === 'string') {
    const trimmed = rawTips.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          tipsArray = parsed
            .map((t) => (t !== null && t !== undefined ? String(t).trim() : ''))
            .filter((t) => t.length > 0);
        }
      } catch {
        tipsArray = [];
      }
    } else if (trimmed.includes('\n')) {
      tipsArray = trimmed
        .split('\n')
        .map((t) => t.replace(/^[•\-\*]\s*/, '').trim())
        .filter((t) => t.length > 0);
    } else if (trimmed.length > 0) {
      tipsArray = [trimmed];
    }
  }

  let cleanDesc = (rawDescription || '').trim();

  // Backward-compatibility check for legacy text blobs
  if (tipsArray.length === 0 && cleanDesc.includes("DIRECTOR'S GUIDE:")) {
    const parts = cleanDesc.split("DIRECTOR'S GUIDE:");
    cleanDesc = parts[0].trim();
    if (parts[1]) {
      tipsArray = parts[1]
        .split('\n')
        .map((t: string) => t.replace(/^[•\-\*]\s*/, '').trim())
        .filter((t: string) => t.length > 0);
    }
  }

  if (tipsArray.length === 0 && cleanDesc.length > 0) {
    tipsArray = [cleanDesc];
  }

  return {
    tips: tipsArray,
    cleanDescription: cleanDesc,
  };
}

export const templateService = {
  async getTemplates(page = 0, limit = 10): Promise<PaginatedTemplatesResult> {
    try {
      const from = page * limit;
      const to = (page + 1) * limit - 1;

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase getTemplates error:", error.message);
        throw error;
      }

      if (!data) {
        return {
          templates: [],
          hasMore: false,
        };
      }

      const remoteTemplates: Template[] = data.map((item) => {
        const { tips: tipsArray, cleanDescription: cleanDesc } = parseTips(item.tips, item.description);

        return {
          id: item.id,
          title: item.title || 'Untitled Pose',
          category: (item.category as CategoryType) || 'Cafe & Lifestyle',
          description: cleanDesc,
          imageSource: { uri: item.image_url },
          difficulty: (item.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
          time: item.time || item.time_setup || '2 min',
          ratio: item.ratio || undefined,
          tips: tipsArray,
          usedCount: item.used_count !== undefined && item.used_count !== null ? String(item.used_count) : '0',
          savedCount: item.saved_count !== undefined && item.saved_count !== null ? String(item.saved_count) : '0',
          creator_id: item.creator_id || undefined,
        };
      });

      const hasMore = data.length === limit;
      return { templates: remoteTemplates, hasMore };
    } catch (err) {
      console.error("Error in templateService.getTemplates:", err);
      throw err;
    }
  },

  async getCategoryCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('category');

      if (error || !data) return {};

      const counts: Record<string, number> = {};
      data.forEach((row) => {
        if (row.category) {
          counts[row.category] = (counts[row.category] || 0) + 1;
        }
      });
      return counts;
    } catch (err) {
      console.warn("Error in getCategoryCounts:", err);
      return {};
    }
  },
};

