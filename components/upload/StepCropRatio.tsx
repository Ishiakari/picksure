import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Fonts } from '@/constants/theme';
import { TemplateAspectRatio } from '@/utils/detectBestRatio';

interface StepCropRatioProps {
  selectedImageUri: string | null;
  aspectRatio: TemplateAspectRatio;
  onSelectAspectRatio: (ratio: TemplateAspectRatio) => void;
}

const SUPPORTED_RATIOS: TemplateAspectRatio[] = [
  '3:4 RATIO',
  '4:5 RATIO',
  '1:1 RATIO',
  '9:16 RATIO',
];

export default function StepCropRatio({
  selectedImageUri,
  aspectRatio,
  onSelectAspectRatio,
}: StepCropRatioProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Frame the subject aspect ratio and enable real-time ghost overlay trace.
      </Text>

      <View style={styles.outlinePreviewWrapper}>
        {selectedImageUri && (
          <Image source={{ uri: selectedImageUri }} style={styles.outlineImage} contentFit="cover" />
        )}
        <View style={styles.outlineOverlayMask}>
          <View style={styles.outlineFrameBorder} />
          <View style={styles.outlineBadge}>
            <Ionicons name="scan-outline" size={13} color={Colors.primarySoft} />
            <Text style={styles.outlineBadgeText}>Ghost Frame Enabled</Text>
          </View>
        </View>
      </View>

      {/* Aspect Ratio Selector */}
      <Text style={styles.fieldLabel}>ASPECT RATIO</Text>
      <View style={styles.aspectRatioRow}>
        {SUPPORTED_RATIOS.map((ratio) => (
          <TouchableOpacity
            key={ratio}
            style={[styles.ratioPill, aspectRatio === ratio && styles.ratioPillActive]}
            onPress={() => onSelectAspectRatio(ratio)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.ratioPillText,
                aspectRatio === ratio && styles.ratioPillTextActive,
              ]}
            >
              {ratio}
            </Text>
          </TouchableOpacity>
        ))}
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
  outlinePreviewWrapper: {
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
    marginBottom: 20,
  },
  outlineImage: {
    width: '100%',
    height: '100%',
  },
  outlineOverlayMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineFrameBorder: {
    width: '80%',
    height: '75%',
    borderWidth: 2,
    borderColor: 'rgba(247, 160, 184, 0.75)',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  outlineBadge: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  outlineBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.primarySoft,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  aspectRatioRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratioPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratioPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  ratioPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratioPillTextActive: {
    color: Colors.background,
  },
});
