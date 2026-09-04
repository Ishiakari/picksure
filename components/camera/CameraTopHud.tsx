import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { Template } from '@/src/data/templates';
import { CameraRatio } from '@/hooks/useCameraControls';

interface CameraTopHudProps {
  template?: Template | null;
  currentIndex: number;
  totalTemplates: number;
  onClose: () => void;
  onCycleTemplate: () => void;
  cameraRatio: CameraRatio;
  onToggleRatio: () => void;
  ratioToastMessage?: string | null;
  ratioToastAnim: Animated.Value;
  alignToastAnim: Animated.Value;
}

export default function CameraTopHud({
  template,
  currentIndex,
  totalTemplates,
  onClose,
  onCycleTemplate,
  cameraRatio,
  onToggleRatio,
  ratioToastMessage,
  ratioToastAnim,
  alignToastAnim,
}: CameraTopHudProps) {
  return (
    <SafeAreaView style={styles.topHudContainer} edges={['top']}>
      <View style={styles.topHudRow}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.hudCircleBtn}
          onPress={onClose}
          accessibilityLabel="Close camera"
        >
          <Feather name="x" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        {/* Center Metadata */}
        <View style={styles.topMetadata}>
          <Text style={styles.topCategoryText}>
            {template?.category ? template.category.toUpperCase() : 'PORTRAIT'}
          </Text>
          <Text style={styles.topGuideTitle} numberOfLines={1}>
            {template?.title || 'Pose Guide'}
          </Text>
        </View>

        {/* Right Header Buttons: Ratio Manual Selector & Layer Counter */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.ratioSelectorBtn}
            onPress={onToggleRatio}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="aspect-ratio" size={14} color={Colors.primary} />
            <Text style={styles.ratioSelectorText}>{cameraRatio}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateSelectorBtn}
            onPress={onCycleTemplate}
          >
            <MaterialCommunityIcons
              name="layers-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.templateCounterText}>
              {currentIndex + 1}/{totalTemplates || 1}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ratio Auto-Suggest Non-blocking Toast */}
      {ratioToastMessage && (
        <Animated.View
          style={[
            styles.ratioToastWrapper,
            {
              opacity: ratioToastAnim,
              transform: [
                {
                  translateY: ratioToastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.ratioToastPill}>
            <MaterialCommunityIcons name="auto-fix" size={13} color={Colors.primary} />
            <Text style={styles.ratioToastText}>{ratioToastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Alignment Toast Pill at top (slides in smoothly) */}
      <Animated.View
        style={[
          styles.alignmentToastWrapper,
          {
            opacity: alignToastAnim,
            transform: [
              {
                translateY: alignToastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.alignmentToastPill}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={14}
            color={Colors.textPrimary}
          />
          <Text style={styles.alignmentToastText}>ALIGN YOUR SHOT</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topHudContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  topHudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(50, 48, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
  },
  topMetadata: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  topCategoryText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  topGuideTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textLight,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratioSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
    gap: 4,
  },
  ratioSelectorText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textLight,
  },
  templateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
    gap: 6,
  },
  templateCounterText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textLight,
  },
  ratioToastWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  ratioToastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 28, 24, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(247, 160, 184, 0.4)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  ratioToastText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.primarySoft,
    letterSpacing: 0.2,
  },
  alignmentToastWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  alignmentToastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  alignmentToastText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 0.8,
  },
});
