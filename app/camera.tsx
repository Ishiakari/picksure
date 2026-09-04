import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Line as SvgLine } from 'react-native-svg';
import { useTemplates } from '@/hooks/useTemplates';
import { Colors, Fonts } from '@/constants/theme';
import { FigmaImages } from '@/src/constants/assets';
import { PoseSilhouette } from '@/components/PoseSilhouette';
import SessionGalleryModal from '@/components/SessionGalleryModal';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const params = useLocalSearchParams<{ templateId?: string; id?: string }>();
  const activeId = params.templateId || params.id;
  const { templates } = useTemplates();

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

  // Camera Permissions
  const [cameraPermission, setCameraPermission] = useState<{ granted: boolean } | null>(
    Platform.OS === 'web' ? { granted: true } : null
  );
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(
    Platform.OS === 'web' ? true : null
  );

  // Viewfinder Settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [zoomIndex, setZoomIndex] = useState(0); // 0: 1x, 1: 1.5x, 2: 2x, 3: MAX
  const [showGrid, setShowGrid] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [overlayMode, setOverlayMode] = useState<'outline' | 'photo'>('outline'); // C1: Outline vs Photo overlay mode
  const [opacityValue, setOpacityValue] = useState(50); // 0 - 100
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filterPreset, setFilterPreset] = useState<'none' | 'warm' | 'noir'>('none');

  // Gallery
  const [capturedPhotosList, setCapturedPhotosList] = useState<string[]>([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  // Pulse animation for tactile shutter ring & alignment toast slide
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const alignToastAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<any>(null);

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'web') {
        const requested = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(requested);
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(mediaStatus.status === 'granted');
      }
    } catch (err) {
      console.warn('Camera permissions warning:', err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const cameraStatus = await Camera.getCameraPermissionsAsync();
          if (cameraStatus.granted) {
            setCameraPermission(cameraStatus);
          } else {
            const requested = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(requested);
          }
          const mediaStatus = await MediaLibrary.requestPermissionsAsync();
          setMediaPermission(mediaStatus.status === 'granted');
        } else {
          setCameraPermission({ granted: true });
          setMediaPermission(true);
        }
      } catch (err) {
        console.warn('Camera permissions warning:', err);
        setCameraPermission({ granted: true });
        setMediaPermission(true);
      }
    })();

    // Shutter pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Alignment toast slide-in animation
    Animated.spring(alignToastAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    if (flash === 'off') setFlash('on');
    else if (flash === 'on') setFlash('auto');
    else setFlash('off');
  };

  const toggleTimer = () => {
    if (timerMode === 0) setTimerMode(3);
    else if (timerMode === 3) setTimerMode(10);
    else setTimerMode(0);
  };

  const toggleFilter = () => {
    if (filterPreset === 'none') setFilterPreset('warm');
    else if (filterPreset === 'warm') setFilterPreset('noir');
    else setFilterPreset('none');
  };

  const toggleOverlayMode = () => {
    setOverlayMode((prev) => (prev === 'outline' ? 'photo' : 'outline'));
  };

  const handleCycleTemplate = () => {
    if (templates.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const getZoomValue = () => {
    switch (zoomIndex) {
      case 0:
        return 0; // 1x
      case 1:
        return 0.08; // 1.5x
      case 2:
        return 0.16; // 2x
      case 3:
        return 0.8; // MAX
      default:
        return 0;
    }
  };

  const executeTakePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });

        if (photo?.uri) {
          setCapturedPhotosList((prev) => [photo.uri, ...prev]);
          if (mediaPermission && Platform.OS !== 'web') {
            await MediaLibrary.saveToLibraryAsync(photo.uri);
          }
        }
      } catch (err) {
        console.warn('Take picture error:', err);
      } finally {
        setIsCapturing(false);
      }
    } else if (Platform.OS === 'web') {
      // Mock capture on web
      setIsCapturing(true);
      setTimeout(() => {
        setIsCapturing(false);
      }, 300);
    }
  };

  const handleCapturePress = () => {
    if (isCapturing) return;

    if (timerMode > 0) {
      setCountdown(timerMode);
      let current = timerMode;
      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setCountdown(current);
        } else {
          clearInterval(interval);
          setCountdown(null);
          executeTakePicture();
        }
      }, 1000);
    } else {
      executeTakePicture();
    }
  };

  const adjustOpacity = (delta: number) => {
    setOpacityValue((prev) => Math.min(100, Math.max(10, prev + delta)));
  };

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
          PickSure requires camera access to guide your compositions and capture studio shots.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
          activeOpacity={0.85}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
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

      {/* Live Camera Feed Viewport */}
      <View style={StyleSheet.absoluteFillObject}>
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

        {/* Filter Warm / Noir Scrim */}
        {filterPreset === 'warm' && <View style={styles.warmFilterScrim} />}
        {filterPreset === 'noir' && <View style={styles.noirFilterScrim} />}

        {/* Permanent Top and Bottom Dark Scrims */}
        <View style={styles.topPermanentScrim} />
        <View style={styles.bottomPermanentScrim} />

        {/* C2: Composition Grid Overlay (Rule of Thirds in Brand Pastel Accent) */}
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

        {/* C1: Reference Photo OR Dashed Silhouette Ghost Vector Template */}
        {showGhost && template && (
          <>
            {overlayMode === 'photo' && template.imageSource && (
              <Image
                source={template.imageSource}
                style={[
                  StyleSheet.absoluteFillObject,
                  { opacity: (opacityValue / 100) * 0.5 },
                ]}
                contentFit="cover"
                pointerEvents="none"
              />
            )}
            {overlayMode === 'outline' && (
              <View style={styles.ghostContainer} pointerEvents="none">
                <PoseSilhouette
                  opacity={opacityValue / 100}
                  width={width * 0.78}
                  height={height * 0.58}
                />
              </View>
            )}
          </>
        )}
      </View>

      {/* Interactive Top App Header HUD */}
      <SafeAreaView style={styles.topHudContainer} edges={['top']}>
        <View style={styles.topHudRow}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.hudCircleBtn}
            onPress={() => router.back()}
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

          {/* C4: Layer counter button with standard stacked layers glyph */}
          <TouchableOpacity
            style={styles.templateSelectorBtn}
            onPress={handleCycleTemplate}
          >
            <MaterialCommunityIcons
              name="layers-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.templateCounterText}>
              {currentIndex + 1}/{templates.length || 1}
            </Text>
          </TouchableOpacity>
        </View>

        {/* C5: Alignment Toast Pill at top (slides in smoothly) */}
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

      {/* Countdown Overlay */}
      {countdown !== null && (
        <View style={styles.countdownWrapper} pointerEvents="none">
          <Text style={styles.countdownBigText}>{countdown}</Text>
        </View>
      )}

      {/* HUD Overlay Bottom Assembly */}
      <SafeAreaView style={styles.bottomHudContainer} edges={['bottom']}>
        {/* Quick Setting Toggles (Grid, Timer, Flash, Filter, C1: Overlay Mode Toggle) */}
        <View style={styles.quickTogglesRow}>
          <TouchableOpacity
            style={[
              styles.quickToggleBtn,
              showGrid && styles.quickToggleBtnActive,
            ]}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Feather
              name="grid"
              size={18}
              color={showGrid ? Colors.burgundy : Colors.textLight}
            />
          </TouchableOpacity>

          {/* C1: Overlay Mode (Outline / Photo toggle) */}
          <TouchableOpacity
            style={[
              styles.quickToggleBtn,
              overlayMode === 'outline' && styles.quickToggleBtnActive,
            ]}
            onPress={toggleOverlayMode}
          >
            <MaterialCommunityIcons
              name={overlayMode === 'outline' ? 'vector-square' : 'image-outline'}
              size={18}
              color={overlayMode === 'outline' ? Colors.burgundy : Colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickToggleBtn,
              timerMode > 0 && styles.quickToggleBtnActive,
            ]}
            onPress={toggleTimer}
          >
            {timerMode === 0 ? (
              <Feather name="clock" size={18} color={Colors.textLight} />
            ) : (
              <Text
                style={[
                  styles.timerText,
                  timerMode > 0 && styles.timerTextActive,
                ]}
              >
                {timerMode}s
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickToggleBtn,
              flash !== 'off' && styles.quickToggleBtnActive,
            ]}
            onPress={toggleFlash}
          >
            <Feather
              name={flash === 'off' ? 'zap-off' : 'zap'}
              size={18}
              color={flash !== 'off' ? Colors.burgundy : Colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickToggleBtn,
              filterPreset !== 'none' && styles.quickToggleBtnActive,
            ]}
            onPress={toggleFilter}
          >
            <Feather
              name="sliders"
              size={18}
              color={filterPreset !== 'none' ? Colors.burgundy : Colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* C3: Ghost Opacity Slider Row - Separated Stepper and Eye Toggle */}
        <View style={styles.opacityRow}>
          <Text style={styles.opacityLabelText}>
            {overlayMode === 'outline' ? 'Outline' : 'Photo'} Opacity: {opacityValue}%
          </Text>

          <View style={styles.opacityControls}>
            {/* Minus Button */}
            <TouchableOpacity
              style={styles.opacityStepBtn}
              onPress={() => adjustOpacity(-10)}
            >
              <Feather name="minus" size={14} color={Colors.textLight} />
            </TouchableOpacity>

            {/* Plus Button */}
            <TouchableOpacity
              style={styles.opacityStepBtn}
              onPress={() => adjustOpacity(10)}
            >
              <Feather name="plus" size={14} color={Colors.textLight} />
            </TouchableOpacity>

            {/* Separated Eye Toggle on Far Right */}
            <TouchableOpacity
              style={[styles.opacityStepBtn, !showGhost && styles.opacityStepBtnInactive]}
              onPress={() => setShowGhost(!showGhost)}
            >
              <Feather
                name={showGhost ? 'eye' : 'eye-off'}
                size={14}
                color={showGhost ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Focal Length / Zoom Selector Pill */}
        <View style={styles.zoomPillContainer}>
          {['1x', '1.5x', '2x', 'MAX'].map((label, idx) => {
            const isActive = zoomIndex === idx;
            return (
              <TouchableOpacity
                key={label}
                style={[
                  styles.zoomOptionBtn,
                  isActive && styles.zoomOptionBtnActive,
                ]}
                onPress={() => setZoomIndex(idx)}
              >
                <Text
                  style={[
                    styles.zoomOptionText,
                    isActive && styles.zoomOptionTextActive,
                  ]}
                >
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
            onPress={() => setIsGalleryVisible(true)}
          >
            {capturedPhotosList.length > 0 ? (
              <Image
                source={{ uri: capturedPhotosList[0] }}
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

          {/* Center Iconic Tactile Shutter Assembly (From Figma 11:1274) */}
          <TouchableOpacity
            style={styles.shutterContainer}
            activeOpacity={0.88}
            onPress={handleCapturePress}
            disabled={isCapturing}
          >
            <Animated.View
              style={[
                styles.shutterOuterPulsingRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.shutterOuterSolidRing}>
              <View style={styles.shutterInnerButton} />
            </View>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            style={styles.flipCameraBtn}
            onPress={toggleFacing}
          >
            <Feather name="refresh-cw" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Session Gallery Modal */}
      <SessionGalleryModal
        visible={isGalleryVisible}
        photos={capturedPhotosList}
        onClose={() => setIsGalleryVisible(false)}
        onClear={() => setCapturedPhotosList([])}
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
  warmFilterScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 160, 184, 0.15)',
  },
  noirFilterScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  ghostContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    paddingHorizontal: 12,
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
  alignmentToastWrapper: {
    alignItems: 'center',
    marginTop: 14,
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
  opacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.65)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.2)',
  },
  opacityLabelText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textLight,
  },
  opacityControls: {
    flexDirection: 'row',
    gap: 8,
  },
  opacityStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(231, 226, 217, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opacityStepBtnInactive: {
    backgroundColor: 'rgba(50, 48, 43, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.1)',
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
