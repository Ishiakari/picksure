import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { FigmaImages } from '@/src/constants/assets';
import CameraOpacityControls from './CameraOpacityControls';

interface CameraBottomControlsProps {
  // Quick toggles
  showGrid: boolean;
  onToggleGrid: () => void;
  overlayMode: 'outline' | 'photo';
  onToggleOverlayMode: () => void;
  timerMode: 0 | 3 | 10;
  onToggleTimer: () => void;
  flash: 'off' | 'on' | 'auto';
  onToggleFlash: () => void;
  filterPreset: 'none' | 'warm' | 'noir';
  onToggleFilter: () => void;

  // Opacity
  opacityValue: number;
  onOpacityChange: (val: number) => void;
  showGhost: boolean;
  onToggleGhost: () => void;

  // Zoom
  zoomIndex: number;
  onSelectZoom: (idx: number) => void;

  // Shutter row
  lastPhotoUri?: string | null;
  onOpenGallery: () => void;
  onCapture: () => void;
  isCapturing: boolean;
  pulseAnim: Animated.Value;
  onFlipCamera: () => void;
}

const ZOOM_LABELS = ['1x', '1.5x', '2x', 'MAX'];

export default function CameraBottomControls({
  showGrid,
  onToggleGrid,
  overlayMode,
  onToggleOverlayMode,
  timerMode,
  onToggleTimer,
  flash,
  onToggleFlash,
  filterPreset,
  onToggleFilter,
  opacityValue,
  onOpacityChange,
  showGhost,
  onToggleGhost,
  zoomIndex,
  onSelectZoom,
  lastPhotoUri,
  onOpenGallery,
  onCapture,
  isCapturing,
  pulseAnim,
  onFlipCamera,
}: CameraBottomControlsProps) {
  return (
    <SafeAreaView style={styles.bottomHudContainer} edges={['bottom']}>
      {/* Quick Setting Toggles (Grid, Overlay Mode, Timer, Flash, Filter) */}
      <View style={styles.quickTogglesRow}>
        <TouchableOpacity
          style={[styles.quickToggleBtn, showGrid && styles.quickToggleBtnActive]}
          onPress={onToggleGrid}
          accessibilityLabel="Toggle grid"
        >
          <Feather
            name="grid"
            size={18}
            color={showGrid ? Colors.burgundy : Colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickToggleBtn, overlayMode === 'outline' && styles.quickToggleBtnActive]}
          onPress={onToggleOverlayMode}
          accessibilityLabel="Toggle outline or photo overlay"
        >
          <MaterialCommunityIcons
            name={overlayMode === 'outline' ? 'vector-square' : 'image-outline'}
            size={18}
            color={overlayMode === 'outline' ? Colors.burgundy : Colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickToggleBtn, timerMode > 0 && styles.quickToggleBtnActive]}
          onPress={onToggleTimer}
          accessibilityLabel="Toggle timer"
        >
          {timerMode === 0 ? (
            <Feather name="clock" size={18} color={Colors.textLight} />
          ) : (
            <Text style={[styles.timerText, timerMode > 0 && styles.timerTextActive]}>
              {timerMode}s
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickToggleBtn, flash !== 'off' && styles.quickToggleBtnActive]}
          onPress={onToggleFlash}
          accessibilityLabel="Toggle flash"
        >
          <Feather
            name={flash === 'off' ? 'zap-off' : 'zap'}
            size={18}
            color={flash !== 'off' ? Colors.burgundy : Colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickToggleBtn, filterPreset !== 'none' && styles.quickToggleBtnActive]}
          onPress={onToggleFilter}
          accessibilityLabel="Toggle filter"
        >
          <Feather
            name="sliders"
            size={18}
            color={filterPreset !== 'none' ? Colors.burgundy : Colors.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* Ghost Opacity Controls */}
      <CameraOpacityControls
        opacityValue={opacityValue}
        onOpacityChange={onOpacityChange}
        showGhost={showGhost}
        onToggleGhost={onToggleGhost}
        overlayMode={overlayMode}
      />

      {/* Focal Length / Zoom Selector Pill */}
      <View style={styles.zoomPillContainer}>
        {ZOOM_LABELS.map((label, idx) => {
          const isActive = zoomIndex === idx;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.zoomOptionBtn, isActive && styles.zoomOptionBtnActive]}
              onPress={() => onSelectZoom(idx)}
            >
              <Text style={[styles.zoomOptionText, isActive && styles.zoomOptionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Shutter Row (Gallery Thumbnail, Primary Shutter, Flip Camera) */}
      <View style={styles.shutterRow}>
        {/* Gallery Thumbnail */}
        <TouchableOpacity
          style={styles.galleryThumbBtn}
          onPress={onOpenGallery}
          accessibilityLabel="View recent photos"
        >
          {lastPhotoUri ? (
            <Image
              source={{ uri: lastPhotoUri }}
              style={styles.galleryThumbImg}
              contentFit="cover"
            />
          ) : (
            <Image
              source={FigmaImages.cameraThumb}
              style={styles.galleryThumbImg}
              contentFit="cover"
            />
          )}
        </TouchableOpacity>

        {/* Center Tactile Shutter Assembly */}
        <TouchableOpacity
          style={[styles.shutterContainer, isCapturing && { opacity: 0.6 }]}
          activeOpacity={0.88}
          onPress={onCapture}
          disabled={isCapturing}
          accessibilityLabel="Capture photo"
        >
          <Animated.View
            style={[
              styles.shutterOuterPulsingRing,
              { transform: [{ scale: isCapturing ? 1 : pulseAnim }] },
            ]}
          />
          <View style={styles.shutterOuterSolidRing}>
            <View
              style={[
                styles.shutterInnerButton,
                isCapturing && { backgroundColor: Colors.primarySoft },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Flip Camera */}
        <TouchableOpacity
          style={styles.flipCameraBtn}
          onPress={onFlipCamera}
          accessibilityLabel="Flip camera"
        >
          <Feather name="refresh-cw" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomHudContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  quickTogglesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 14,
  },
  quickToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(50, 48, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
  },
  quickToggleBtnActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  timerText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textLight,
  },
  timerTextActive: {
    color: Colors.burgundy,
  },
  zoomPillContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    borderRadius: 24,
    padding: 3,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
  },
  zoomOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  zoomOptionBtnActive: {
    backgroundColor: Colors.primarySoft,
  },
  zoomOptionText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: 'rgba(254, 249, 240, 0.75)',
  },
  zoomOptionTextActive: {
    color: Colors.textPrimary,
  },
  shutterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  galleryThumbBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(254, 249, 240, 0.6)',
    backgroundColor: Colors.surface,
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  shutterContainer: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shutterOuterPulsingRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.8,
  },
  shutterOuterSolidRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  flipCameraBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(50, 48, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.25)',
  },
});
