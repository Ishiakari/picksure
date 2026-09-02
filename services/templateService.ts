// services/templateService.ts
import { TEMPLATES, Template } from '@/src/data/templates';
import { supabase } from '@/lib/supabase';

export interface PaginatedTemplatesResult {
  templates: Template[];
  hasMore: boolean;
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

      if (error || !data) {
        return { 
          templates: page === 0 ? TEMPLATES : [], 
          hasMore: false 
        };
      }
      
      const remoteTemplates: Template[] = data.map(item => {
        let tipsArray: string[] = [];

        // Prefer native tips array (JSONB or Postgres TEXT[])
        if (Array.isArray(item.tips) && item.tips.length > 0) {
          tipsArray = item.tips;
        } else if (typeof item.tips === 'string' && item.tips.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(item.tips);
            if (Array.isArray(parsed)) tipsArray = parsed;
          } catch {
            tipsArray = [];
          }
        }

        let cleanDesc = item.description || '';

        // Fallback backward-compatibility check for legacy text blobs
        if (tipsArray.length === 0 && cleanDesc.includes("DIRECTOR'S GUIDE:")) {
          const parts = cleanDesc.split("DIRECTOR'S GUIDE:");
          cleanDesc = parts[0].trim();
          tipsArray = parts[1]
            .split('\n')
            .map((t: string) => t.replace(/^[•\-\*]\s*/, '').trim())
            .filter((t: string) => t.length > 0);
        }

        // Final fallback if no tips found
        if (tipsArray.length === 0) {
          tipsArray = cleanDesc.length > 0 ? [cleanDesc] : ['Align pose overlay with subject.'];
        }

        return {
          id: item.id,
          title: item.title || 'Untitled Pose',
          category: item.category || 'Cafe & Lifestyle',
          description: cleanDesc,
          imageSource: { uri: item.image_url },
          difficulty: (item.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
          time: item.time || item.time_setup || '2 min',
          tips: tipsArray,
          usedCount: item.used_count !== undefined && item.used_count !== null ? String(item.used_count) : '0',
          savedCount: item.saved_count !== undefined && item.saved_count !== null ? String(item.saved_count) : '0',
          creator_id: item.creator_id,
        };
      });

      // Combine local default templates with remote templates on page 0
      const combined = page === 0 ? [...remoteTemplates, ...TEMPLATES] : remoteTemplates;
      const hasMore = data.length === limit;

      return { templates: combined, hasMore };
    } catch (err) {
      console.error("Error in templateService.getTemplates:", err);
      return { templates: page === 0 ? TEMPLATES : [], hasMore: false };
    }
  }
};
