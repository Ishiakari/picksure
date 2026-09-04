import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CATEGORIES, CategoryType } from '@/src/constants/categories';
import { useTheme } from '@/context/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';
import { TEMPLATES } from '@/src/data/templates';
import PickSureLogo from '@/components/PickSureLogo';

const { width } = Dimensions.get('window');

interface CategoryMeta {
  category: CategoryType;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: any;
}

const CATEGORY_DETAILS: Record<CategoryType, CategoryMeta> = {
  'Cafe & Lifestyle': {
    category: 'Cafe & Lifestyle',
    subtitle: 'Sun-dappled coffee shops, table props & candid natural light',
    icon: 'cafe-outline',
    image: require('../../assets/images/previews/cafe-portrait.jpg'),
  },
  'OOTD & Streetwear': {
    category: 'OOTD & Streetwear',
    subtitle: 'Low-angle motion walks, sneaker checks & architecture framing',
    icon: 'walk-outline',
    image: require('../../assets/images/previews/cafe-portrait.jpg'),
  },
  'Cottagecore & Nature': {
    category: 'Cottagecore & Nature',
    subtitle: 'Sunlit meadows, forest paths & dreamy fairytale back-profiles',
    icon: 'leaf-outline',
    image: require('../../assets/images/previews/meadow.jpg'),
  },
  'Editorial & Noir': {
    category: 'Editorial & Noir',
    subtitle: 'High-contrast studio shadow play, geometric angles & dramatic mood',
    icon: 'contrast-outline',
    image: require('../../assets/images/previews/study.jpg'),
  },
  'Minimalist & Silhouette': {
    category: 'Minimalist & Silhouette',
    subtitle: 'Golden hour doorways, clean negative space & sculptural outlines',
    icon: 'shapes-outline',
    image: require('../../assets/images/previews/meadow.jpg'),
  },
  'Casual & Mirror Check': {
    category: 'Casual & Mirror Check',
    subtitle: 'Effortless elevator flash reflections & everyday wardrobe styling',
    icon: 'sparkles-outline',
    image: require('../../assets/images/previews/cafe-portrait.jpg'),
  },
  'Couples & Friends': {
    category: 'Couples & Friends',
    subtitle: 'Golden hour duo interactions, candid laughter & connection poses',
    icon: 'people-outline',
    image: require('../../assets/images/previews/meadow.jpg'),
  },
};

export default function ExploreScreen() {
  const { isDark, toggleTheme, themeColors } = useTheme();

  const handleCategoryPress = (category: CategoryType) => {
    router.navigate({
      pathname: '/(tabs)',
      params: { category },
    });
  };

  const getTemplateCount = (category: CategoryType) => {
    return TEMPLATES.filter((t) => t.category === category).length;
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? Colors.darkBackground : Colors.creamLight },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PickSureLogo size={24} color={Colors.rosePrimary} />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Explore Vibes
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.themeToggle,
            {
              backgroundColor: isDark ? Colors.darkCard : Colors.creamSurface,
              borderColor: isDark ? Colors.border : '#e8d8c8',
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={18}
            color={Colors.rosePrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Intro Subtitle */}
        <View style={styles.introSection}>
          <Text style={[styles.subheading, { color: isDark ? '#c5b5be' : '#6b5860' }]}>
            Browse curated photography categories to find composition overlays, director guides, and pose references.
          </Text>
        </View>

        {/* Category Cards */}
        <View style={styles.cardsContainer}>
          {CATEGORIES.map((categoryKey) => {
            const meta = CATEGORY_DETAILS[categoryKey];
            const count = getTemplateCount(categoryKey);

            return (
              <TouchableOpacity
                key={categoryKey}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? Colors.darkCard : Colors.creamSurface,
                    borderColor: isDark ? Colors.border : '#eddccf',
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => handleCategoryPress(categoryKey)}
              >
                {/* Visual Image Banner with Gradient overlay */}
                <View style={styles.imageWrapper}>
                  <Image
                    source={meta.image}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.imageOverlay} />
                  
                  {/* Category Pill Tag on Image */}
                  <View style={styles.pillTag}>
                    <Ionicons name={meta.icon} size={13} color="#ffffff" style={styles.pillIcon} />
                    <Text style={styles.pillTagText}>{meta.category.toUpperCase()}</Text>
                  </View>

                  {/* Pose Count Badge */}
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {count} {count === 1 ? 'Pose' : 'Poses'}
                    </Text>
                  </View>
                </View>

                {/* Card Content Footer */}
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                      {meta.category}
                    </Text>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={22}
                      color={Colors.rosePrimary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardDescription,
                      { color: isDark ? '#b8a6af' : '#736169' },
                    ]}
                    numberOfLines={2}
                  >
                    {meta.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  introSection: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#33242c',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 17, 20, 0.38)',
  },
  pillTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 160, 184, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  pillIcon: {
    marginRight: 2,
  },
  pillTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  countBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
