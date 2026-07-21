// services/templateService.ts
import { TEMPLATES, Template } from '@/src/data/templates';
import { supabase } from '@/lib/supabase';

export const templateService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase.from('templates').select('*');
      if (error || !data) return TEMPLATES;
      
      const remoteTemplates: Template[] = data.map(item => ({
        id: item.id,
        title: item.title || 'Untitled Pose',
        category: item.category || 'Cafe & Lifestyle',
        description: item.description || '',
        imageSource: { uri: item.image_url },
        difficulty: item.difficulty || 'Beginner',
        time: item.time || '2 min',
        tips: ['Align pose overlay with subject.'],
        usedCount: '0',
        savedCount: '0'
      }));

      // Combine local default templates with user uploaded templates
      return [...remoteTemplates, ...TEMPLATES];
    } catch (err) {
      console.error("Error in templateService.getTemplates:", err);
      return TEMPLATES;
    }
  }
};
