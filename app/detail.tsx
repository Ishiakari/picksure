import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Line as SvgLine, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTemplates, updateTemplateStatsInFeed } from '@/hooks/useTemplates';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors, Fonts } from '@/constants/theme';
import { PoseSilhouette } from '@/components/PoseSilhouette';

const { width } = Dimensions.get('window');

function parseCountString(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  if (str.endsWith('k')) {
    return Math.round(parseFloat(str.replace('k', '')) * 1000);
  }
  if (str.endsWith('m')) {
    return Math.round(parseFloat(str.replace('m', '')) * 1000000);
  }
  return parseInt(str, 10) || 0;
}

function formatCountNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates, loading } = useTemplates();
  const { user } = useAuth();
  const { isBookmarked: checkBookmarked, toggleBookmark } = useBookmarks();

  const template = templates.find((t) => t.id === id);
  const isBookmarked = template ? checkBookmarked(template.id) : false;

  const [savedCount, setSavedCount] = useState<number>(0);
  const [usedCount, setUsedCount] = useState<number>(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showSilhouette, setShowSilhouette] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (template) {
      const baseSaved = parseCountString(template.savedCount);
      const baseUsed = parseCountString(template.usedCount);
      const userKey = user?.id || 'guest';

      setSavedCount(baseSaved);
      setUsedCount(baseUsed);

      (async () => {
        try {
          const localUsedStr = await AsyncStorage.getItem(`used_count_val_${template.id}`);
          const localSavedStr = await AsyncStorage.getItem(`saved_count_val_${template.id}`);

          let currentSaved = localSavedStr !== null ? parseInt(localSavedStr, 10) : baseSaved;
          let currentUsed = localUsedStr !== null ? parseInt(localUsedStr, 10) : baseUsed;

          const { count: realSavedCount } = await supabase
            .from('saved_templates')
            .select('id', { count: 'exact', head: true })
            .eq('template_id', template.id);

          if (realSavedCount !== null && realSavedCount !== undefined && realSavedCount > 0) {
            currentSaved = realSavedCount;
          }

          if (isMounted) {
            setSavedCount(currentSaved);
            setUsedCount(currentUsed);
          }
        } catch (err) {
          console.warn('Error loading stats:', err);
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [template?.id, user?.id]);

  const handleToggleBookmark = async () => {
    if (!template) return;
    const nextSaved = !isBookmarked;
    const newCount = nextSaved ? savedCount + 1 : Math.max(0, savedCount - 1);
    setSavedCount(newCount);

    try {
      await toggleBookmark(template.id);
      await AsyncStorage.setItem(`saved_count_val_${template.id}`, String(newCount));
      updateTemplateStatsInFeed(template.id, newCount, usedCount);
    } catch (err) {
      console.warn('Bookmark sync error in detail:', err);
      setSavedCount(savedCount);
    }
  };

  const handleShare = async () => {
    if (!template) return;
    try {
      await Share.share({
        message: `Check out the "${template.title}" composition guide on PickSure!`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const handleLaunchCamera = async () => {
    if (!template) return;
    const nextUsed = usedCount + 1;
    setUsedCount(nextUsed);

    try {
      await AsyncStorage.setItem(`used_count_val_${template.id}`, String(nextUsed));
      try {
        await supabase.rpc('increment_template_usage', {
          target_template_id: template.id
        });
      } catch (_) {}
      updateTemplateStatsInFeed(template.id, savedCount, nextUsed);
    } catch (err) {
      console.warn('Used count error:', err);
    }


    router.push({
      pathname: '/camera',
      params: { id: template.id, templateId: template.id },
    });
  };


  if (!template) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Guide Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={Colors.primaryDark} />
              <Text style={{ fontFamily: Fonts.medium, marginTop: 12, color: Colors.textMuted }}>
                Loading composition guide...
              </Text>
            </>
          ) : (
            <>
              <Feather name="alert-circle" size={32} color={Colors.textMuted} />
              <Text style={{ fontFamily: Fonts.bold, fontSize: 16, marginTop: 12, color: Colors.textPrimary }}>
                Guide Not Found
              </Text>
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: Colors.primaryDark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
                onPress={() => router.back()}
              >
                <Text style={{ fontFamily: Fonts.bold, color: Colors.background }}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top Header Bar */}
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>Guide Detail</Text>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
              <Feather name="share-2" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerBtn,
                isBookmarked && styles.headerBtnBookmarked,
              ]}
              onPress={handleToggleBookmark}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? Colors.primaryDark : Colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category & Aspect Ratio Badges Row */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {template.category.toUpperCase()}
            </Text>
          </View>
          <View style={styles.ratioBadge}>
            <Text style={styles.ratioBadgeText}>
              {template.ratio || '1:1.618 RATIO'}
            </Text>
          </View>
        </View>

        {/* Title & Summary */}
        <Text style={styles.guideTitle}>{template.title}</Text>
        <Text style={styles.guideSubtitle}>{template.description}</Text>

        {/* Metrics Row (Matches Figma Frame 11:791) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{formatCountNumber(usedCount)}</Text>
            <Text style={styles.metricLabel}>Used</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{formatCountNumber(savedCount)}</Text>
            <Text style={styles.metricLabel}>Saved</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{template.difficulty}</Text>
            <Text style={styles.metricLabel}>Difficulty</Text>
          </View>
        </View>

        {/* Composition Wireframe & Silhouette Preview Canvas */}
        <View style={styles.canvasCard}>
          <View style={styles.canvasHeader}>
            <Text style={styles.canvasTitle}>COMPOSITION WIREFRAME</Text>
            <View style={styles.canvasControls}>
              <TouchableOpacity
                style={[
                  styles.canvasToggle,
                  showGrid && styles.canvasToggleActive,
                ]}
                onPress={() => setShowGrid(!showGrid)}
              >
                <Feather
                  name="grid"
                  size={14}
                  color={showGrid ? Colors.background : Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.canvasToggle,
                  showSilhouette && styles.canvasToggleActive,
                ]}
                onPress={() => setShowSilhouette(!showSilhouette)}
              >
                <Feather
                  name="user"
                  size={14}
                  color={showSilhouette ? Colors.background : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.canvasViewport}>
            <Image
              source={template.imageSource}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View style={styles.canvasScrim} />

            {/* Rule of Thirds Grid Lines */}
            {showGrid && (
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                style={StyleSheet.absoluteFillObject}
              >
                <SvgLine
                  x1="33.3"
                  y1="0"
                  x2="33.3"
                  y2="100"
                  stroke="rgba(254, 249, 240, 0.45)"
                  strokeWidth="0.6"
                  strokeDasharray="2, 2"
                />
                <SvgLine
                  x1="66.6"
                  y1="0"
                  x2="66.6"
                  y2="100"
                  stroke="rgba(254, 249, 240, 0.45)"
                  strokeWidth="0.6"
                  strokeDasharray="2, 2"
                />
                <SvgLine
                  x1="0"
                  y1="33.3"
                  x2="100"
                  y2="33.3"
                  stroke="rgba(254, 249, 240, 0.45)"
                  strokeWidth="0.6"
                  strokeDasharray="2, 2"
                />
                <SvgLine
                  x1="0"
                  y1="66.6"
                  x2="100"
                  y2="66.6"
                  stroke="rgba(254, 249, 240, 0.45)"
                  strokeWidth="0.6"
                  strokeDasharray="2, 2"
                />
              </Svg>
            )}

            {/* Dashed Ghost Silhouette */}
            {showSilhouette && (
              <View style={styles.silhouetteContainer}>
                <PoseSilhouette width={200} height={280} opacity={0.9} />
              </View>
            )}

            <View style={styles.canvasSyncBadge}>
              <Ionicons name="scan-outline" size={14} color={Colors.primarySoft} />
              <Text style={styles.canvasSyncBadgeText}>Live HUD Sync Ready</Text>
            </View>
          </View>
        </View>

        {/* Director's Composition Breakdown Tips */}
        <View style={styles.directorSection}>
          <View style={styles.directorHeaderRow}>
            <View style={styles.directorBadge}>
              <Feather name="compass" size={14} color={Colors.primaryDark} />
            </View>
            <Text style={styles.directorSectionTitle}>
              {"DIRECTOR'S SHOOTING NOTES"}
            </Text>
          </View>

          <View style={styles.tipsList}>
            {template.tips.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <View style={styles.tipNumberCircle}>
                  <Text style={styles.tipNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.tipTextContent}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom space for sticky CTA */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.bookmarkBottomBtn,
            isBookmarked && styles.bookmarkBottomBtnActive,
          ]}
          onPress={handleToggleBookmark}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? Colors.primaryDark : Colors.textPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryCtaButton}
          activeOpacity={0.88}
          onPress={handleLaunchCamera}
        >
          <Ionicons name="camera" size={20} color={Colors.background} />
          <Text style={styles.primaryCtaText}>Open Camera with Guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
  topSafeArea: {
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBtnBookmarked: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  headerTitleText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  ratioBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratioBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.burgundy,
    letterSpacing: 0.6,
  },
  guideTitle: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  guideSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricNumber: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  canvasCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  canvasTitle: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  canvasControls: {
    flexDirection: 'row',
    gap: 6,
  },
  canvasToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  canvasToggleActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  canvasViewport: {
    width: '100%',
    height: 320,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.4)',
  },
  silhouetteContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  canvasSyncBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(50, 48, 43, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  canvasSyncBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textLight,
  },
  directorSection: {
    marginBottom: 10,
  },
  directorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  directorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directorSectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  tipsList: {
    gap: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  tipNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  tipNumberText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.background,
  },
  tipTextContent: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookmarkBottomBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookmarkBottomBtnActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  primaryCtaButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryCtaText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.background,
  },
});
