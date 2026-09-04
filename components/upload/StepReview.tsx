import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface StepReviewProps {
  selectedImageUri: string | null;
  category: string;
  aspectRatio: string;
  title: string;
  description: string;
}

export default function StepReview({
  selectedImageUri,
  category,
  aspectRatio,
  title,
  description,
}: StepReviewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Here is how your custom guide will appear to curators on the PickSure feed.
      </Text>

      <View style={styles.previewCardContainer}>
        <View style={styles.mockFeedCard}>
          <View style={styles.mockImageContainer}>
            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.mockImage} contentFit="cover" />
            )}
            <View style={styles.mockCardScrim} />

            {/* Top-Left Category Badge */}
            <View style={styles.mockCategoryBadge}>
              <Text style={styles.mockCategoryText}>{category}</Text>
            </View>

            {/* Top-Right Ratio Badge */}
            <View style={styles.mockRatioBadge}>
              <Text style={styles.mockRatioText}>{aspectRatio}</Text>
            </View>
          </View>

          <View style={styles.mockCardBody}>
            <Text style={styles.mockCardTitle} numberOfLines={1}>
              {title || 'Untitled Pose'}
            </Text>
            <Text style={styles.mockCardDesc} numberOfLines={2}>
              {description || 'Effortless composition guide with real-time HUD alignment.'}
            </Text>

            <View style={styles.mockCardFooter}>
              <View style={styles.mockStats}>
                <View style={styles.mockStatItem}>
                  <Feather name="clock" size={11} color={Colors.textMuted} />
                  <Text style={styles.mockStatText}>2 min</Text>
                </View>
              </View>

              <View style={styles.mockBookmark}>
                <Ionicons name="bookmark-outline" size={14} color={Colors.textSecondary} />
              </View>
            </View>
          </View>
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
  previewCardContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  mockFeedCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mockImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
  },
  mockImage: {
    width: '100%',
    height: '100%',
  },
  mockCardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.12)',
  },
  mockCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(254, 249, 240, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockCategoryText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.textPrimary,
  },
  mockRatioBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockRatioText: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textLight,
  },
  mockCardBody: {
    padding: 10,
  },
  mockCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  mockCardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
    marginBottom: 8,
  },
  mockCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  mockStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mockStatText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  mockBookmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
