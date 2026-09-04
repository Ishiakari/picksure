export const CATEGORIES = [
  'Cafe & Lifestyle',
  'OOTD & Streetwear',
  'Cottagecore & Nature',
  'Editorial & Noir',
  'Minimalist & Silhouette',
  'Casual & Mirror Check',
  'Couples & Friends',
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

export type FilterCategoryType = 'All' | CategoryType;

export const FILTER_CATEGORIES: FilterCategoryType[] = ['All', ...CATEGORIES];
