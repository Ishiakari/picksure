// services/templateService.ts
import { TEMPLATES, Template } from '@/src/data/templates';
import { supabase } from '@/lib/supabase';

export const templateService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error || !data) return TEMPLATES;
      
      const remoteTemplates: Template[] = data.map(item => {
        let tipsArray: string[] = [];
        let cleanDesc = item.description || '';

        // If description contains DIRECTOR'S GUIDE, parse tips out of it
        if (cleanDesc.includes("DIRECTOR'S GUIDE:")) {
          const parts = cleanDesc.split("DIRECTOR'S GUIDE:");
          cleanDesc = parts[0].trim();
          tipsArray = parts[1]
            .split('\n')
            .map((t: string) => t.replace(/^[•\-\*]\s*/, '').trim())
            .filter((t: string) => t.length > 0);
        }

        // Fallbacks
        if (tipsArray.length === 0) {
          if (Array.isArray(item.tips) && item.tips.length > 0) {
            tipsArray = item.tips;
          } else if (cleanDesc.length > 0) {
            tipsArray = [cleanDesc];
          } else {
            tipsArray = ['Align pose overlay with subject.'];
          }
        }

        return {
          id: item.id,
          title: item.title || 'Untitled Pose',
          category: item.category || 'Cafe & Lifestyle',
          description: cleanDesc,
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
