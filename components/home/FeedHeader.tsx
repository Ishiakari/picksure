import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { Template } from '@/src/data/templates';
import { FilterCategoryType } from '@/src/constants/categories';

interface FeedHeaderProps {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  filteredCount: number;
  selectedCategory: FilterCategoryType;
  searchQuery: string;
  featuredTemplate?: Template;
  onPressFeatured: (id: string) => void;
  onResetFilters: () => void;
  onOpenUpload: () => void;
  isLoggedIn: boolean;
  onGoToAuth: () => void;
}

export default function FeedHeader({
  loading,
  refreshing,
  error,
  onRetry,
  filteredCount,
  selectedCategory,
  searchQuery,
  featuredTemplate,
  onPressFeatured,
  onResetFilters,
  onOpenUpload,
  isLoggedIn,
  onGoToAuth,
}: FeedHeaderProps) {
  return (
    <>
      {/* Loading Initial State */}
      {loading && !refreshing && (
        <View style={styles.initialLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.initialLoadingText}>Fetching curated studio guides...</Text>
        </View>
      )}

      {/* Error State with Retry Button */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconBadge}>
            <Feather name="alert-circle" size={26} color={Colors.primaryDark} />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Guides</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={onRetry}>
            <Feather name="refresh-cw" size={14} color={Colors.background} style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State when no templates in DB or matching category */}
      {!loading && !error && filteredCount === 0 && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <Feather name="image" size={32} color={Colors.primaryDark} />
          </View>
          <Text style={styles.emptyTitle}>
            {selectedCategory !== 'All' || searchQuery
              ? 'No matching guides found'
              : 'No studio guides yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory !== 'All' || searchQuery
              ? 'Try adjusting your category filter or search terms.'
              : 'Be the first creator to upload a camera composition overlay guide!'}
          </Text>

          <View style={styles.emptyActionsRow}>
            {selectedCategory !== 'All' || searchQuery ? (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={onResetFilters}
              >
                <Feather name="rotate-ccw" size={14} color={Colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Reset Filter</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.emptyActionBtn, styles.emptyActionBtnPrimary]}
              activeOpacity={0.85}
              onPress={isLoggedIn ? onOpenUpload : onGoToAuth}
            >
              <Feather name="plus-circle" size={14} color={Colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.emptyActionBtnTextPrimary}>Upload First Guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Trending Guide Hero Banner */}
      {!loading && !error && featuredTemplate && selectedCategory === 'All' && !searchQuery && (
        <View style={styles.heroSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Trending Guide</Text>
            <TouchableOpacity onPress={() => onPressFeatured(featuredTemplate.id)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.92}
            onPress={() => onPressFeatured(featuredTemplate.id)}
          >
            <Image
              source={featuredTemplate.imageSource}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.heroGradientOverlay} />

            {/* Badges on Top: Category (Top-Left), Meta Badge (Top-Right) */}
            <View style={styles.heroBadgesRow}>
              <View style={styles.heroCategoryBadge}>
                <Text style={styles.heroCategoryBadgeText}>
                  {featuredTemplate.category.toUpperCase()}
                </Text>
              </View>

              <View style={styles.editorBadge}>
                <Text style={styles.editorBadgeText}>{"EDITOR'S PICK"}</Text>
              </View>
            </View>

            {/* Hero Bottom Info */}
            <View style={styles.heroBottomInfo}>
              <Text style={styles.heroTitle}>{featuredTemplate.title}</Text>
              <Text style={styles.heroDesc} numberOfLines={2}>
                {featuredTemplate.description}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Header */}
      {!loading && !error && filteredCount > 0 && (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Curated Guides' : selectedCategory}
          </Text>
          <Text style={styles.templatesCountText}>
            {filteredCount} {filteredCount === 1 ? 'guide' : 'guides'}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  initialLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  initialLoadingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  errorContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(132, 60, 84, 0.2)',
    padding: 24,
    alignItems: 'center',
    marginVertical: 20,
  },
  errorIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(132, 60, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  errorMessage: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.background,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyActionBtnPrimary: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  emptyActionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  emptyActionBtnTextPrimary: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.background,
  },
  heroSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  templatesCountText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 280,
    position: 'relative',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.45)',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  heroCategoryBadge: {
    backgroundColor: 'rgba(254, 249, 240, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroCategoryBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textPrimary,
    letterSpacing: 0.8,
  },
  editorBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editorBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.burgundy,
    letterSpacing: 0.6,
  },
  heroBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textLight,
    marginBottom: 4,
  },
  heroDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(254, 249, 240, 0.85)',
    marginBottom: 4,
    lineHeight: 16,
  },
});
