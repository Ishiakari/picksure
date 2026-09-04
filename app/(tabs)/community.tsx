import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';
import { Template } from '@/src/data/templates';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface SuggestedCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  guideCount: number;
}

const SUGGESTED_CREATORS: SuggestedCreator[] = [
  {
    id: 'c1',
    name: 'Elena Rostova',
    handle: '@elena.visuals',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    guideCount: 14,
  },
  {
    id: 'c2',
    name: 'Marcus Chen',
    handle: '@marcus_street',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    guideCount: 22,
  },
  {
    id: 'c3',
    name: 'Aria Thorne',
    handle: '@aria.light',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    guideCount: 9,
  },
  {
    id: 'c4',
    name: 'Julian Vance',
    handle: '@julian.studio',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    guideCount: 18,
  },
];

export default function CommunityScreen() {
  const { user } = useAuth();
  const { templates, refreshing, refresh } = useTemplates();
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());

  const toggleFollow = (creatorId: string) => {
    setFollowedCreatorIds((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      return next;
    });
  };

  const handleTemplatePress = (id: string) => {
    router.push({
      pathname: '/detail',
      params: { id },
    });
  };

  const communityGuides = templates.slice(0, 8);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSubtitle}>Discover & follow visionaries</Text>
        </View>

        <TouchableOpacity
          style={styles.headerSearchBtn}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Feather name="search" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primaryDark}
            colors={[Colors.primaryDark]}
          />
        }
      >
        {/* Suggested Visionary Creators Row */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Creators</Text>
            <Text style={styles.sectionSublabel}>Curated photographers</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creatorsScroll}
          >
            {SUGGESTED_CREATORS.map((creator) => {
              const isFollowed = followedCreatorIds.has(creator.id);
              return (
                <View key={creator.id} style={styles.creatorCard}>
                  <Image
                    source={{ uri: creator.avatar }}
                    style={styles.creatorAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {creator.name}
                  </Text>
                  <Text style={styles.creatorHandle} numberOfLines={1}>
                    {creator.handle}
                  </Text>
                  <Text style={styles.creatorGuidesText}>
                    {creator.guideCount} Guides
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      isFollowed && styles.followBtnActive,
                    ]}
                    onPress={() => toggleFollow(creator.id)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.followBtnText,
                        isFollowed && styles.followBtnTextActive,
                      ]}
                    >
                      {isFollowed ? 'Following' : '+ Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Community Feed / Following Feed */}
        <View style={styles.feedSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Creator Feed</Text>
            <Text style={styles.sectionCount}>{communityGuides.length} Guides</Text>
          </View>

          {communityGuides.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="users" size={32} color={Colors.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>No Following Posts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Follow visionaries and creators above or explore curated guides to see their pose overlays appear here.
              </Text>

              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Feather name="compass" size={14} color={Colors.background} style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Explore Categories</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {communityGuides.map((item: Template) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.guideCard}
                  activeOpacity={0.92}
                  onPress={() => handleTemplatePress(item.id)}
                >
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={item.imageSource}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.cardScrim} />
                    
                    {/* Top-Left Category Tag */}
                    <View style={styles.cardCategoryTag}>
                      <Text style={styles.cardCategoryText}>{item.category}</Text>
                    </View>

                    {/* Top-Right Ratio Tag */}
                    {item.ratio && (
                      <View style={styles.cardRatioTag}>
                        <Text style={styles.cardRatioText}>{item.ratio}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.cardStats}>
                        <Feather name="clock" size={11} color={Colors.textMuted} />
                        <Text style={styles.cardStatText}>{item.time || '2 min'}</Text>
                      </View>
                      <View style={styles.authorBadge}>
                        <Feather name="user" size={10} color={Colors.primaryDark} />
                        <Text style={styles.authorBadgeText}>Creator</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerSearchBtn: {
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
    paddingTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  sectionSublabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  sectionCount: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  creatorsScroll: {
    gap: 12,
    paddingRight: 10,
  },
  creatorCard: {
    width: 130,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  creatorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  creatorName: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  creatorHandle: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  creatorGuidesText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.primaryDark,
    marginTop: 4,
    marginBottom: 8,
  },
  followBtn: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.background,
  },
  followBtnTextActive: {
    color: Colors.textSecondary,
  },
  feedSection: {
    marginBottom: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guideCard: {
    width: CARD_WIDTH,
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
  cardScrim: {
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
    fontSize: 8,
    color: Colors.textPrimary,
  },
  cardRatioTag: {
    position: 'absolute',
    top: 8,
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
    fontSize: 13,
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
  cardStatText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  authorBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.burgundy,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  emptyIconCircle: {
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
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.background,
  },
});
