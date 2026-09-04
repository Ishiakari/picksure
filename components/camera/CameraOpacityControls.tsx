import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import SliderOpacity from '@/components/SliderOpacity';
import { Colors, Fonts } from '@/constants/theme';

interface CameraOpacityControlsProps {
  opacityValue: number;
  onOpacityChange: (value: number) => void;
  showGhost: boolean;
  onToggleGhost: () => void;
  overlayMode: 'outline' | 'photo';
}

export default function CameraOpacityControls({
  opacityValue,
  onOpacityChange,
  showGhost,
  onToggleGhost,
  overlayMode,
}: CameraOpacityControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.modeLabel}>
          {overlayMode === 'outline' ? 'Outline Guide' : 'Photo Reference'}
        </Text>
        <TouchableOpacity
          style={[styles.ghostToggleBtn, !showGhost && styles.ghostToggleBtnInactive]}
          onPress={onToggleGhost}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={showGhost ? 'Hide overlay guide' : 'Show overlay guide'}
        >
          <Feather
            name={showGhost ? 'eye' : 'eye-off'}
            size={16}
            color={showGhost ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <SliderOpacity
        opacityValue={opacityValue}
        onOpacityChange={onOpacityChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(50, 48, 43, 0.65)',
    borderRadius: 16,
    paddingTop: 10,
    paddingBottom: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  modeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textLight,
    letterSpacing: 0.5,
  },
  ghostToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(231, 226, 217, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostToggleBtnInactive: {
    backgroundColor: 'rgba(50, 48, 43, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.1)',
  },
});
