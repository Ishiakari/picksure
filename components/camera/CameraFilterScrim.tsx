import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Line as SvgLine } from 'react-native-svg';
import { PoseSilhouette } from '@/components/PoseSilhouette';
import { Template } from '@/src/data/templates';

interface CameraFilterScrimProps {
  filterPreset: 'none' | 'warm' | 'noir';
  showGrid: boolean;
  showGhost: boolean;
  template?: Template | null;
  overlayMode: 'outline' | 'photo';
  opacityValue: number;
  viewportWidth: number;
  viewportHeight: number;
}

export default function CameraFilterScrim({
  filterPreset,
  showGrid,
  showGhost,
  template,
  overlayMode,
  opacityValue,
  viewportWidth,
  viewportHeight,
}: CameraFilterScrimProps) {
  return (
    <>
      {/* Filter Warm / Noir Scrim */}
      {filterPreset === 'warm' && <View style={styles.warmFilterScrim} pointerEvents="none" />}
      {filterPreset === 'noir' && <View style={styles.noirFilterScrim} pointerEvents="none" />}

      {/* Composition Grid Overlay (Rule of Thirds relative to active ratio frame) */}
      {showGrid && (
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <SvgLine
            x1="33.3"
            y1="0"
            x2="33.3"
            y2="100"
            stroke="rgba(255, 204, 213, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="2, 2"
          />
          <SvgLine
            x1="66.6"
            y1="0"
            x2="66.6"
            y2="100"
            stroke="rgba(255, 204, 213, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="2, 2"
          />
          <SvgLine
            x1="0"
            y1="33.3"
            x2="100"
            y2="33.3"
            stroke="rgba(255, 204, 213, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="2, 2"
          />
          <SvgLine
            x1="0"
            y1="66.6"
            x2="100"
            y2="66.6"
            stroke="rgba(255, 204, 213, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="2, 2"
          />
        </Svg>
      )}

      {/* Reference Photo OR Dashed Silhouette Ghost Vector Template at True Aspect Ratio */}
      {showGhost && template && (
        <>
          {overlayMode === 'photo' && template.imageSource && (
            <Image
              source={template.imageSource}
              style={[
                StyleSheet.absoluteFillObject,
                { opacity: (opacityValue / 100) * 0.55 },
              ]}
              contentFit="contain"
              pointerEvents="none"
            />
          )}
          {overlayMode === 'outline' && (
            <View style={styles.ghostContainer} pointerEvents="none">
              <PoseSilhouette
                opacity={opacityValue / 100}
                width={viewportWidth * 0.76}
                height={viewportHeight * 0.58}
              />
            </View>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  warmFilterScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 160, 184, 0.15)',
  },
  noirFilterScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  ghostContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
