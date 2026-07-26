// services/templateService.ts
import { TEMPLATES, Template } from '@/src/data/templates';
import { supabase } from '@/lib/supabase';

export const templateService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error || !data) return TEMPLATES;
      
      const remoteTemplates: Template[] = data.map(item => {
        let tipsArray = ['Align pose overlay with subject.'];
        if (Array.isArray(item.tips) && item.tips.length > 0) {
          tipsArray = item.tips;
        } else if (typeof item.tips === 'string' && item.tips.trim().length > 0) {
          tipsArray = item.tips.split('\n').filter((t: string) => t.trim().length > 0);
        } else if (item.description && item.description.trim().length > 0) {
          tipsArray = [item.description];
        }

        return {
          id: item.id,
          title: item.title || 'Untitled Pose',
          category: item.category || 'Cafe & Lifestyle',
          description: item.description || '',
          imageSource: { uri: item.image_url },
          difficulty: (item.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
          time: item.time || '2 min',
          tips: tipsArray,
          usedCount: item.used_count !== undefined && item.used_count !== null ? String(item.used_count) : '0',
          savedCount: item.saved_count !== undefined && item.saved_count !== null ? String(item.saved_count) : '0'
        };
      });

      // Combine local default templates with user uploaded templates
      return [...remoteTemplates, ...TEMPLATES];
    } catch (err) {
      console.error("Error in templateService.getTemplates:", err);
      return TEMPLATES;
    }
  }
};
