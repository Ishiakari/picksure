import { TEMPLATES, Template } from '@/src/data/templates';

/**
 * Service to manage template data fetching.
 * Currently defaults to local static templates.
 * Easily expandable to fetch from Supabase/Cloud backend.
 */
export const templateService = {
  /**
   * Fetch all available templates
   */
  async getTemplates(): Promise<Template[]> {
    // When Supabase is configured:
    // const { data, error } = await supabase.from('templates').select('*');
    // return data || TEMPLATES;
    return Promise.resolve(TEMPLATES);
  },

  /**
   * Fetch a single template by ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }
};
