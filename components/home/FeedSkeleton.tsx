import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 32 - 12) / 2; // screen padding 16 each side, 12 gap

export default function FeedSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.container}>
      {/* Trending Hero Placeholder */}
      <View style={styles.heroSection}>
        <View style={styles.heroTitleRow}>
          <Animated.View style={[styles.skeletonBlock, styles.sectionTitleSkeleton, { opacity: shimmerAnim }]} />
        </View>
        <Animated.View style={[styles.skeletonBlock, styles.heroCardSkeleton, { opacity: shimmerAnim }]}>
          <View style={styles.heroContentPlaceholder}>
            <View style={styles.heroPillPlaceholder} />
            <View style={styles.heroTextPlaceholder} />
          </View>
        </Animated.View>
      </View>

      {/* Curated Guides Section Title */}
      <View style={styles.gridHeaderRow}>
        <Animated.View style={[styles.skeletonBlock, styles.sectionTitleSkeleton, { opacity: shimmerAnim, width: 130 }]} />
      </View>

      {/* 2-Column Grid Skeletons */}
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((key, index) => (
          <View
            key={key}
            style={[
              styles.cardWrapper,
              {
                paddingRight: index % 2 === 0 ? 6 : 0,
                paddingLeft: index % 2 === 0 ? 0 : 6,
              },
            ]}
          >
            <View style={styles.cardSkeleton}>
              <Animated.View style={[styles.skeletonBlock, styles.imageSkeleton, { opacity: shimmerAnim }]} />
              <View style={styles.cardBodySkeleton}>
                <Animated.View style={[styles.skeletonBlock, styles.titleSkeleton, { opacity: shimmerAnim }]} />
                <Animated.View style={[styles.skeletonBlock, styles.descSkeleton, { opacity: shimmerAnim }]} />
                <View style={styles.cardFooterSkeleton}>
                  <Animated.View style={[styles.skeletonBlock, styles.statSkeleton, { opacity: shimmerAnim }]} />
                  <Animated.View style={[styles.skeletonBlock, styles.circleSkeleton, { opacity: shimmerAnim }]} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonBlock: {
    backgroundColor: Colors.border,
    borderRadius: 8,
  },
  heroSection: {
    marginBottom: 20,
  },
  heroTitleRow: {
    marginBottom: 10,
  },
  sectionTitleSkeleton: {
    width: 140,
    height: 18,
    borderRadius: 6,
  },
  heroCardSkeleton: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroContentPlaceholder: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  heroPillPlaceholder: {
    width: 70,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  heroTextPlaceholder: {
    width: '60%',
    height: 16,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  gridHeaderRow: {
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    width: '50%',
    marginBottom: 14,
  },
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageSkeleton: {
    width: '100%',
    height: 140,
    borderRadius: 0,
  },
  cardBodySkeleton: {
    padding: 10,
  },
  titleSkeleton: {
    width: '80%',
    height: 13,
    marginBottom: 6,
  },
  descSkeleton: {
    width: '55%',
    height: 10,
    marginBottom: 12,
  },
  cardFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  statSkeleton: {
    width: 45,
    height: 10,
    borderRadius: 4,
  },
  circleSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
