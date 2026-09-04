import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { Template } from '@/src/data/templates';

interface TemplateFeedCardProps {
  item: Template;
  index: number;
  isSaved: boolean;
  onPress: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export default React.memo(function TemplateFeedCard({
  item,
  index,
  isSaved,
  onPress,
  onToggleSave,
}: TemplateFeedCardProps) {
  const isLeftColumn = index % 2 === 0;

  return (
    <View
      style={{
        flex: 1,
        paddingRight: isLeftColumn ? 6 : 0,
        paddingLeft: isLeftColumn ? 0 : 6,
        paddingBottom: 14,
      }}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => onPress(item.id)}
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
              onPress={() => onToggleSave(item.id)}
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
    </View>
  );
});

const styles = StyleSheet.create({
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
});
