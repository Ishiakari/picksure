import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Template } from '@/src/data/templates';
import { FILTER_CATEGORIES, FilterCategoryType } from '@/src/constants/categories';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';
import UploadTemplateModal from '@/components/UploadTemplateModal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 44) / 2;

const CATEGORIES = FILTER_CATEGORIES;

export default function HomeScreen() {
  const {
    templates,
    loading,
    refreshing,
    refresh,
    retry,
    loadingMore,
    loadMore,
    hasMore,
    error,
  } = useTemplates();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ category?: string; openSearch?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Handle category and openSearch params
  useEffect(() => {
    if (params.category) {
      const matched = FILTER_CATEGORIES.find(
        (cat) => cat.toLowerCase() === params.category?.toLowerCase()
      );
      if (matched) {
        setSelectedCategory(matched);
      }
    }
    if (params.openSearch === 'true') {
      setIsSearchActive(true);
    }
  }, [params.category, params.openSearch]);

  // Load saved bookmarks from AsyncStorage & Supabase
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const userKey = user?.id || 'guest';
        const sIds = new Set<string>();

        if (user?.id) {
          const { data, error } = await supabase
            .from('saved_templates')
            .select('template_id')
            .eq('user_id', user.id);
          if (!error && data) {
            data.forEach((row) => sIds.add(row.template_id));
          }
        }

        const keys = await AsyncStorage.getAllKeys();
        const prefix = `saved_template_${userKey}_`;
        for (const k of keys) {
          if (k.startsWith(prefix)) {
            const val = await AsyncStorage.getItem(k);
            if (val === 'true') sIds.add(k.replace(prefix, ''));
          }
        }

        if (isMounted) {
          setSavedIds(sIds);
        }
      } catch (err) {
        console.warn('Error initializing savedIds:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const toggleSave = async (id: string) => {
    const userKey = user?.id || 'guest';
    const isCurrentlySaved = savedIds.has(id);
    const nextSaved = !isCurrentlySaved;

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (nextSaved) {
        await AsyncStorage.setItem(`saved_template_${userKey}_${id}`, 'true');
        if (user?.id) {
          await supabase.from('saved_templates').upsert([
            { user_id: user.id, template_id: id }
          ], { onConflict: 'user_id,template_id' });
        }
      } else {
        await AsyncStorage.removeItem(`saved_template_${userKey}_${id}`);
        if (user?.id) {
          await supabase.from('saved_templates')
            .delete()
            .eq('user_id', user.id)
            .eq('template_id', id);
        }
      }
    } catch (err) {
      console.warn('Toggle save sync error:', err);
    }
  };

  const filteredTemplates = templates.filter((template) => {
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

  const featuredTemplate = filteredTemplates[0];
  const gridTemplates = selectedCategory === 'All' && !searchQuery ? filteredTemplates.slice(1) : filteredTemplates;

  const leftColTemplates: Template[] = [];
  const rightColTemplates: Template[] = [];

  gridTemplates.forEach((item, idx) => {
    if (idx % 2 === 0) leftColTemplates.push(item);
    else rightColTemplates.push(item);
  });

  const handleTemplatePress = (id: string) => {
    router.push({
      pathname: '/detail',
      params: { id },
    });
  };

  const handleLaunchCamera = (templateId?: string) => {
    router.push({
      pathname: '/camera',
      params: templateId ? { templateId } : undefined,
    });
  };

  const renderCard = (item: Template) => {
    const isSaved = savedIds.has(item.id);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => handleTemplatePress(item.id)}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={item.imageSource}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.cardImageScrim} />

          {/* Category Tag */}
          <View style={styles.cardCategoryTag}>
            <Text style={styles.cardCategoryText}>{item.category}</Text>
          </View>

          {/* Ratio Badge */}
          {item.ratio && (
            <View style={styles.cardRatioTag}>
              <Text style={styles.cardRatioText}>{item.ratio}</Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Meta & Save Action */}
          <View style={styles.cardFooter}>
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Feather name="clock" size={11} color={Colors.textMuted} />
                <Text style={styles.statText}>{item.time || '2 min'}</Text>
              </View>
              {parseInt(String(item.usedCount || '0').replace(/[^0-9]/g, ''), 10) > 0 && (
                <>
                  <Text style={styles.statDot}>·</Text>
                  <View style={styles.statItem}>
                    <Feather name="camera" size={11} color={Colors.textMuted} />
                    <Text style={styles.statText}>{item.usedCount}</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaved && styles.saveButtonActive]}
              onPress={() => toggleSave(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={isSaved ? Colors.primaryDark : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header Section */}
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates, styles..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchCloseBtn}
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
            >
              <Feather name="x" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerBrandCenter}>
              <Text style={styles.headerBrandTitle}>Picksure</Text>
            </View>

            <View style={styles.headerRightRow}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setIsSearchActive(true)}
              >
                <Feather name="search" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>

              {/* Primary + Create Guide Trigger */}
              <TouchableOpacity
                style={[styles.headerIconBtn, styles.headerCreateBtn]}
                onPress={() => setIsUploadModalVisible(true)}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={20} color={Colors.background} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => {
                  if (user) {
                    router.push('/(tabs)/profile');
                  } else {
                    router.push('/auth');
                  }
                }}
              >
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    source={{ uri: user.user_metadata.avatar_url }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : user ? (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {(user.email?.charAt(0) || 'U').toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.avatarFallback}>
                    <Feather name="user" size={18} color={Colors.textPrimary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Category Horizontal Filter Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Feed Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedScroll}
        scrollEventThrottle={16}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
          if (isCloseToBottom && hasMore && !loadingMore && !loading) {
            loadMore();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primaryDark}
            colors={[Colors.primaryDark]}
          />
        }
      >
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
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={retry}
            >
              <Feather name="refresh-cw" size={14} color={Colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State when no templates in DB or matching category */}
        {!loading && !error && filteredTemplates.length === 0 && (
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
                  onPress={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                >
                  <Feather name="rotate-ccw" size={14} color={Colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyActionBtnText}>Reset Filter</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.emptyActionBtn, styles.emptyActionBtnPrimary]}
                activeOpacity={0.85}
                onPress={() => {
                  if (user) {
                    setIsUploadModalVisible(true);
                  } else {
                    router.push('/auth');
                  }
                }}
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
              <TouchableOpacity
                onPress={() => handleTemplatePress(featuredTemplate.id)}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.heroCard}
              activeOpacity={0.92}
              onPress={() => handleTemplatePress(featuredTemplate.id)}
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
                <Text style={styles.heroTitle}>
                  {featuredTemplate.title}
                </Text>
                <Text style={styles.heroDesc} numberOfLines={2}>
                  {featuredTemplate.description}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Header */}
        {!loading && !error && filteredTemplates.length > 0 && (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'Curated Guides' : selectedCategory}
            </Text>
            <Text style={styles.templatesCountText}>
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'guide' : 'guides'}
            </Text>
          </View>
        )}

        {/* Masonry / Two-Column Grid */}
        {!loading && !error && gridTemplates.length > 0 && (
          <View style={styles.gridContainer}>
            <View style={styles.gridColumn}>
              {leftColTemplates.map((item) => renderCard(item))}
            </View>
            <View style={styles.gridColumn}>
              {rightColTemplates.map((item) => renderCard(item))}
            </View>
          </View>
        )}

        {/* Pro Tip of the Day Banner */}
        {!loading && !error && filteredTemplates.length > 0 && (
          <View style={styles.tipBanner}>
            <View style={styles.tipIconBadge}>
              <MaterialCommunityIcons
                name="creation"
                size={20}
                color={Colors.burgundy}
              />
            </View>
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipBadgeLabel}>PRO TIP OF THE DAY</Text>
              <Text style={styles.tipMessage}>
                Tap any composition card to sync its overlay lines straight to your live viewfinder!
              </Text>
            </View>
          </View>
        )}

        {/* Infinite Scroll Loading */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={Colors.primaryDark} />
            <Text style={styles.loadingMoreText}>Loading more guides...</Text>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Template Modal */}
      <UploadTemplateModal
        visible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onUploadSuccess={() => {
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerBrandCenter: {
    alignItems: 'center',
  },
  headerBrandTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCreateBtn: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.primaryDark,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  searchCloseBtn: {
    padding: 4,
  },
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
  feedScroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
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
  heroCategoryText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.primarySoft,
    letterSpacing: 1,
    marginBottom: 2,
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
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: COLUMN_WIDTH,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.15)',
  },
  cardCategoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(254, 249, 240, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardCategoryText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.textPrimary,
  },
  cardRatioTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardRatioText: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textLight,
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  cardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  statDot: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  saveButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  tipBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
  },
  tipIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipBadgeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.primaryDark,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tipMessage: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
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
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: 12,
    color: Colors.textPrimary,
  },
  emptyActionBtnTextPrimary: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.background,
  },
});
