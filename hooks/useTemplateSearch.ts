import { useState, useEffect, useMemo } from 'react';
import { Template } from '@/src/data/templates';
import { FILTER_CATEGORIES, FilterCategoryType } from '@/src/constants/categories';

interface UseTemplateSearchOptions {
  templates: Template[];
  paramCategory?: string;
  paramOpenSearch?: string;
}

export function useTemplateSearch({
  templates,
  paramCategory,
  paramOpenSearch,
}: UseTemplateSearchOptions) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sync route params
  useEffect(() => {
    if (paramCategory) {
      const matched = FILTER_CATEGORIES.find(
        (cat) => cat.toLowerCase() === paramCategory.toLowerCase()
      );
      if (matched) {
        setSelectedCategory(matched);
      }
    }
    if (paramOpenSearch === 'true') {
      setIsSearchActive(true);
    }
  }, [paramCategory, paramOpenSearch]);

  // Search and Category filtering
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const templateCategory = template.category || '';
      const matchesCategory =
        selectedCategory === 'All' ||
        templateCategory.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        templateCategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const featuredTemplate = filteredTemplates[0];

  const gridTemplates = useMemo(() => {
    return selectedCategory === 'All' && !searchQuery
      ? filteredTemplates.slice(1)
      : filteredTemplates;
  }, [selectedCategory, searchQuery, filteredTemplates]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isSearchActive,
    setIsSearchActive,
    filteredTemplates,
    featuredTemplate,
    gridTemplates,
    resetFilters,
  };
}
