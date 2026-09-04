import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useTemplates } from '@/hooks/useTemplates';
import { Colors, Fonts } from '@/constants/theme';
import { FigmaImages } from '@/src/constants/assets';
import SessionGalleryModal from '@/components/SessionGalleryModal';

import { useCameraPermissions } from '@/hooks/useCameraPermissions';
import { useCameraControls } from '@/hooks/useCameraControls';
import CameraTopHud from '@/components/camera/CameraTopHud';
import CameraBottomControls from '@/components/camera/CameraBottomControls';
import CameraFilterScrim from '@/components/camera/CameraFilterScrim';

export default function CameraScreen() {
  const params = useLocalSearchParams<{ templateId?: string; id?: string }>();
  const activeId = params.templateId || params.id;
  const { templates } = useTemplates();
  const cameraRef = useRef<CameraView>(null);

  // Active guide index sync
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = templates.findIndex((t) => t.id === activeId);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    if (activeId && templates.length > 0) {
      const idx = templates.findIndex((t) => t.id === activeId);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [activeId, templates]);

  const template = templates[currentIndex] || templates[0];

  // Camera permissions
  const {
    cameraPermission,
    mediaPermission,
    requestPermissions,
    isPermanentlyDenied,
    openSettings,
  } = useCameraPermissions();

  // Camera controls & capture logic
  const {
    cameraRatio,
    toggleCameraRatio,
    viewportDimensions,
    ratioToastMessage,
    ratioToastAnim,
    alignToastAnim,
    pulseAnim,
    facing,
    toggleFacing,
    flash,
    toggleFlash,
    zoomIndex,
    setZoomIndex,
    getZoomValue,
    showGrid,
    setShowGrid,
    showGhost,
    setShowGhost,
    overlayMode,
    toggleOverlayMode,
    opacityValue,
    setOpacityValue,
    filterPreset,
    toggleFilter,
    timerMode,
    toggleTimer,
    countdown,
    isCapturing,
    capturePhoto,
    capturedPhotosList,
    clearCapturedPhotos,
  } = useCameraControls({
    cameraRef,
    mediaPermission,
    activeTemplateRatio: template?.ratio,
    activeTemplateId: template?.id,
  });

  // Session gallery modal visibility
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  const handleCycleTemplate = () => {
    if (templates.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  // Permission states
  if (cameraPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (cameraPermission.granted === false) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Feather name="camera-off" size={48} color={Colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={styles.permissionTitle}>Camera Access Denied</Text>
        <Text style={styles.permissionSubtitle}>
          {isPermanentlyDenied
            ? 'Camera access is disabled in your device settings. Please open Settings to enable camera access for PickSure.'
            : 'PickSure requires camera access to guide your compositions and capture studio shots.'}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={isPermanentlyDenied ? openSettings : requestPermissions}
          activeOpacity={0.85}
        >
          <Text style={styles.permissionButtonText}>
            {isPermanentlyDenied ? 'Open Device Settings' : 'Grant Camera Access'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionBackBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Viewport Frame Container with Letterbox Background */}
      <View style={styles.viewportLetterboxContainer}>
        <View
          style={[
            styles.viewportFrame,
            {
              width: viewportDimensions.width,
              height: viewportDimensions.height,
            },
          ]}
        >
          {/* Live Camera Feed Viewport */}
          {isWeb ? (
            <Image
              source={FigmaImages.cameraSimulation}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              flash={flash}
              zoom={getZoomValue()}
            />
          )}

          {/* Filter Scrims, Rule-of-Thirds Grid, and Reference Overlay */}
          <CameraFilterScrim
            filterPreset={filterPreset}
            showGrid={showGrid}
            showGhost={showGhost}
            template={template}
            overlayMode={overlayMode}
            opacityValue={opacityValue}
            viewportWidth={viewportDimensions.width}
            viewportHeight={viewportDimensions.height}
          />
        </View>
      </View>

      {/* Permanent Top and Bottom Dark Scrims */}
      <View style={styles.topPermanentScrim} pointerEvents="none" />
      <View style={styles.bottomPermanentScrim} pointerEvents="none" />

      {/* Interactive Top App Header HUD */}
      <CameraTopHud
        template={template}
        currentIndex={currentIndex}
        totalTemplates={templates.length}
        onClose={() => router.back()}
        onCycleTemplate={handleCycleTemplate}
        cameraRatio={cameraRatio}
        onToggleRatio={toggleCameraRatio}
        ratioToastMessage={ratioToastMessage}
        ratioToastAnim={ratioToastAnim}
        alignToastAnim={alignToastAnim}
      />

      {/* Countdown Overlay */}
      {countdown !== null && (
        <View style={styles.countdownWrapper} pointerEvents="none">
          <Text style={styles.countdownBigText}>{countdown}</Text>
        </View>
      )}

      {/* Interactive Bottom Controls */}
      <CameraBottomControls
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        overlayMode={overlayMode}
        onToggleOverlayMode={toggleOverlayMode}
        timerMode={timerMode}
        onToggleTimer={toggleTimer}
        flash={flash}
        onToggleFlash={toggleFlash}
        filterPreset={filterPreset}
        onToggleFilter={toggleFilter}
        opacityValue={opacityValue}
        onOpacityChange={setOpacityValue}
        showGhost={showGhost}
        onToggleGhost={() => setShowGhost(!showGhost)}
        zoomIndex={zoomIndex}
        onSelectZoom={setZoomIndex}
        lastPhotoUri={capturedPhotosList[0]}
        onOpenGallery={() => setIsGalleryVisible(true)}
        onCapture={capturePhoto}
        isCapturing={isCapturing}
        pulseAnim={pulseAnim}
        onFlipCamera={toggleFacing}
      />

      {/* Session Gallery Modal */}
      <SessionGalleryModal
        visible={isGalleryVisible}
        photos={capturedPhotosList}
        onClose={() => setIsGalleryVisible(false)}
        onClear={clearCapturedPhotos}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1C16',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#1D1C16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: 'rgba(254, 249, 240, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.background,
  },
  permissionBackBtn: {
    paddingVertical: 8,
  },
  permissionBackBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  topPermanentScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(29, 28, 22, 0.65)',
  },
  bottomPermanentScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(29, 28, 22, 0.85)',
  },
  viewportLetterboxContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0C0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewportFrame: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#161411',
  },
  countdownWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  countdownBigText: {
    fontFamily: Fonts.bold,
    fontSize: 100,
    color: Colors.primary,
  },
});
