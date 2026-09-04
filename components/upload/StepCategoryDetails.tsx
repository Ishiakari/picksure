import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { CATEGORIES, CategoryType } from '@/src/constants/categories';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const DIFFICULTIES: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

interface StepCategoryDetailsProps {
  title: string;
  onChangeTitle: (t: string) => void;
  category: CategoryType;
  onChangeCategory: (c: CategoryType) => void;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (d: DifficultyLevel) => void;
}

export default function StepCategoryDetails({
  title,
  onChangeTitle,
  category,
  onChangeCategory,
  difficulty,
  onChangeDifficulty,
}: StepCategoryDetailsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Give your composition guide a title and assign it to a curated lifestyle category.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>GUIDE TITLE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Vintage Sunset Stance"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={onChangeTitle}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <View style={styles.categoryChipsGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => onChangeCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>DIFFICULTY LEVEL</Text>
        <View style={styles.difficultyContainer}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[styles.difficultyButton, difficulty === diff && styles.activeDifficultyButton]}
              onPress={() => onChangeDifficulty(diff)}
            >
              <Text style={[styles.difficultyText, difficulty === diff && styles.activeDifficultyText]}>
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryChipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.background,
    fontFamily: Fonts.bold,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  activeDifficultyButton: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  difficultyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeDifficultyText: {
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
});
