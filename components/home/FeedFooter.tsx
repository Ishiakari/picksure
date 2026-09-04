import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface FeedFooterProps {
  hasGuides: boolean;
  loadingMore: boolean;
}

export default function FeedFooter({ hasGuides, loadingMore }: FeedFooterProps) {
  return (
    <>
      {/* Pro Tip of the Day Banner */}
      {hasGuides && (
        <View style={styles.tipBanner}>
          <View style={styles.tipIconBadge}>
            <MaterialCommunityIcons name="creation" size={20} color={Colors.burgundy} />
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
      <View style={styles.bottomSpacer} />
    </>
  );
}

const styles = StyleSheet.create({
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
  bottomSpacer: {
    height: 100,
  },
});
