import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CATEGORIES, CategoryType } from '@/src/constants/categories';
import { Colors, Fonts } from '@/constants/theme';
import { useTemplates } from '@/hooks/useTemplates';
import { templateService } from '@/services/templateService';
import { FigmaImages } from '@/src/constants/assets';

interface CategoryMeta {
  category: CategoryType;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  image: any;
}

const CATEGORY_DETAILS: Record<CategoryType, CategoryMeta> = {
  'Cafe & Lifestyle': {
    category: 'Cafe & Lifestyle',
    subtitle: 'Sun-dappled coffee shops, table props & candid natural light',
    icon: 'coffee',
    image: FigmaImages.lifestyleCafe,
  },
  'OOTD & Streetwear': {
    category: 'OOTD & Streetwear',
    subtitle: 'Low-angle motion walks, sneaker checks & architecture framing',
    icon: 'user',
    image: FigmaImages.heroFeatured,
  },
  'Cottagecore & Nature': {
    category: 'Cottagecore & Nature',
    subtitle: 'Sunlit meadows, forest paths & dreamy atmospheric leading lines',
    icon: 'sun',
    image: FigmaImages.natureMisty,
  },
  'Editorial & Noir': {
    category: 'Editorial & Noir',
    subtitle: 'High-contrast studio shadow play, geometric angles & dramatic mood',
    icon: 'moon',
    image: FigmaImages.urbanMinimalist,
  },
  'Minimalist & Silhouette': {
    category: 'Minimalist & Silhouette',
    subtitle: 'Golden hour doorways, clean negative space & sculptural outlines',
    icon: 'crop',
    image: FigmaImages.urbanMinimalist,
  },
  'Casual & Mirror Check': {
    category: 'Casual & Mirror Check',
    subtitle: 'Effortless elevator flash reflections & everyday wardrobe styling',
    icon: 'smartphone',
    image: FigmaImages.heroFeatured,
  },
  'Couples & Friends': {
    category: 'Couples & Friends',
    subtitle: 'Golden hour duo interactions, candid laughter & connection poses',
    icon: 'users',
    image: FigmaImages.natureMisty,
  },
};

export default function ExploreScreen() {
  const { templates, loading, error, retry } = useTemplates();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    templateService.getCategoryCounts().then((counts) => {
      if (isMounted) {
        setCategoryCounts(counts);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [templates]);

  const handleCategoryPress = (category: CategoryType) => {
    router.navigate({
      pathname: '/(tabs)',
      params: { category },
    });
  };

  const handleSearchPress = () => {
    router.navigate({
      pathname: '/(tabs)',
      params: { openSearch: 'true' },
    });
  };

  const getTemplateCount = (category: CategoryType) => {
    if (categoryCounts[category] !== undefined) {
      return categoryCounts[category];
    }
    return templates.filter((t) => t.category === category).length;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Categories</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Search templates"
        >
          <Feather name="search" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.introSubtitle}>
          Browse curated composition categories to find composition overlays, director guides, and pose references.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Unable to load categories: {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retry}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Cards List */}
        <View style={styles.cardsContainer}>
          {CATEGORIES.map((categoryKey) => {
            const meta = CATEGORY_DETAILS[categoryKey];
            const count = getTemplateCount(categoryKey);

            return (
              <TouchableOpacity
                key={categoryKey}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => handleCategoryPress(categoryKey)}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={meta.image}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                  <View style={styles.imageScrim} />

                  {/* Category Pill Tag */}
                  <View style={styles.pillTag}>
                    <Feather
                      name={meta.icon}
                      size={12}
                      color={Colors.burgundy}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.pillTagText}>
                      {meta.category.toUpperCase()}
                    </Text>
                  </View>

                  {/* Pose Count Badge */}
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {count} {count === 1 ? 'Guide' : 'Guides'}
                    </Text>
                  </View>
                </View>

                {/* Footer Body */}
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{meta.category}</Text>
                    <Feather
                      name="arrow-right"
                      size={16}
                      color={Colors.primaryDark}
                    />
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {meta.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textPrimary,
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  introSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(132, 60, 84, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.primaryDark,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.background,
  },
  cardsContainer: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 130,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.25)',
  },
  pillTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillTagText: {
    fontFamily: Fonts.bold,
    color: Colors.burgundy,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontFamily: Fonts.bold,
    color: Colors.textLight,
    fontSize: 10,
  },
  cardBody: {
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
