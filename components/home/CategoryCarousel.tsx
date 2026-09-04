import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { FILTER_CATEGORIES, FilterCategoryType } from '@/src/constants/categories';

interface CategoryCarouselProps {
  selectedCategory: FilterCategoryType;
  onSelectCategory: (category: FilterCategoryType) => void;
}

export default function CategoryCarousel({
  selectedCategory,
  onSelectCategory,
}: CategoryCarouselProps) {
  return (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryContainer: {
    height: 46,
    marginBottom: 6,
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.background,
  },
});
