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

import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

export type CameraRatio = '4:3' | '1:1' | '16:9' | 'Full';

const DEFAULT_RATIOS: CameraRatio[] = ['4:3', '1:1', '16:9', 'Full'];

// Helper to crop captured image to match the active cameraRatio framing
async function cropPhotoToActiveRatio(photoUri: string, photoW: number, photoH: number, ratio: CameraRatio): Promise<string> {
  if (ratio === 'Full' || !photoW || !photoH) {
    return photoUri;
  }

  let targetRatio = 4 / 3; // default portrait height/width or width/height
  if (ratio === '1:1') {
    targetRatio = 1;
  } else if (ratio === '4:3') {
    targetRatio = 3 / 4; // portrait 3:4 width/height
  } else if (ratio === '16:9') {
    targetRatio = 9 / 16; // portrait 9:16 width/height
  }

  const isPortrait = photoH >= photoW;
  let cropWidth = photoW;
  let cropHeight = photoH;

  if (isPortrait) {
    const currentRatio = photoW / photoH;
    if (currentRatio > targetRatio) {
      // Image is wider than target ratio: crop sides
      cropWidth = Math.round(photoH * targetRatio);
      cropHeight = photoH;
    } else {
      // Image is taller than target ratio: crop top/bottom
      cropWidth = photoW;
      cropHeight = Math.round(photoW / targetRatio);
    }
  } else {
    // Landscape photo handling
    const landTargetRatio = 1 / targetRatio;
    const currentRatio = photoW / photoH;
    if (currentRatio > landTargetRatio) {
      cropWidth = Math.round(photoH * landTargetRatio);
      cropHeight = photoH;
    } else {
      cropWidth = photoW;
      cropHeight = Math.round(photoW / landTargetRatio);
    }
  }

  const originX = Math.max(0, Math.round((photoW - cropWidth) / 2));
  const originY = Math.max(0, Math.round((photoH - cropHeight) / 2));

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          crop: {
            originX,
            originY,
            width: Math.min(cropWidth, photoW - originX),
            height: Math.min(cropHeight, photoH - originY),
          },
        },
      ],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (err) {
    console.warn('ImageManipulator crop fallback:', err);
    return photoUri;
  }
}

// Helper to calculate frame dimensions based on screen width/height and selected ratio
function getViewportDimensions(selectedRatio: CameraRatio, screenW: number, screenH: number) {
  let frameW = screenW;
  let frameH = screenH;

  if (selectedRatio === '1:1') {
    frameW = screenW;
    frameH = screenW;
  } else if (selectedRatio === '4:3') {
    frameW = screenW;
    frameH = screenW * (4 / 3);
  } else if (selectedRatio === '16:9') {
    frameW = screenW;
    frameH = screenW * (16 / 9);
    if (frameH > screenH) {
      frameH = screenH;
      frameW = screenH * (9 / 16);
    }
  } else {
    // Full
    frameW = screenW;
    frameH = screenH;
  }

  return { width: frameW, height: frameH };
}

// Convert template ratio metadata string (e.g. '3:4 RATIO', '4:5 RATIO', '1:1 RATIO', '9:16 RATIO') to closest camera ratio
function mapTemplateRatioToCameraRatio(ratioStr?: string): CameraRatio {
  if (!ratioStr) return '4:3';
  const clean = ratioStr.toUpperCase();
  if (clean.includes('1:1')) return '1:1';
  if (clean.includes('3:4') || clean.includes('4:3') || clean.includes('4:5')) return '4:3';
  if (clean.includes('9:16') || clean.includes('16:9') || clean.includes('1.618')) return '16:9';
  return '4:3';
}

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

  // Dynamic Camera Capture Ratios
  const [availableRatios, setAvailableRatios] = useState<CameraRatio[]>(DEFAULT_RATIOS);
  const [cameraRatio, setCameraRatio] = useState<CameraRatio>('4:3');
  const [ratioToastMessage, setRatioToastMessage] = useState<string | null>(null);

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

  // Pulse animation for tactile shutter ring, alignment toast, and ratio toast
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const alignToastAnim = useRef(new Animated.Value(0)).current;
  const ratioToastAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<any>(null);

  // Auto-suggest and set matching ratio when active guide loads / changes
  useEffect(() => {
    if (template?.ratio) {
      const suggestedRatio = mapTemplateRatioToCameraRatio(template.ratio);
      setCameraRatio(suggestedRatio);
      
      const cleanRatioName = template.ratio.replace(/RATIO/i, '').trim();
      setRatioToastMessage(`Camera set to ${suggestedRatio} to match guide (${cleanRatioName})`);

      Animated.sequence([
        Animated.timing(ratioToastAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(2800),
        Animated.timing(ratioToastAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRatioToastMessage(null);
      });
    }
  }, [template?.id, template?.ratio]);

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

  const toggleCameraRatio = () => {
    setCameraRatio((current) => {
      const idx = availableRatios.indexOf(current);
      const nextIdx = (idx + 1) % availableRatios.length;
      return availableRatios[nextIdx];
    });
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
          quality: 0.92,
          skipProcessing: false,
        });

        if (photo?.uri) {
          // Crop photo to match the exact active cameraRatio frame
          const finalPhotoUri = await cropPhotoToActiveRatio(
            photo.uri,
            photo.width || width,
            photo.height || height,
            cameraRatio
          );

          setCapturedPhotosList((prev) => [finalPhotoUri, ...prev]);
          if (mediaPermission && Platform.OS !== 'web') {
            await MediaLibrary.saveToLibraryAsync(finalPhotoUri);
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
  const frameDim = getViewportDimensions(cameraRatio, width, height);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Viewport Frame Container with Letterbox Background */}
      <View style={styles.viewportLetterboxContainer}>
        <View
          style={[
            styles.viewportFrame,
            {
              width: frameDim.width,
              height: frameDim.height,
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

          {/* Filter Warm / Noir Scrim */}
          {filterPreset === 'warm' && <View style={styles.warmFilterScrim} />}
          {filterPreset === 'noir' && <View style={styles.noirFilterScrim} />}

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
                    width={frameDim.width * 0.76}
                    height={frameDim.height * 0.58}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* Permanent Top and Bottom Dark Scrims */}
      <View style={styles.topPermanentScrim} pointerEvents="none" />
      <View style={styles.bottomPermanentScrim} pointerEvents="none" />

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

          {/* Right Header Buttons: Ratio Manual Selector & Layer Counter */}
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.ratioSelectorBtn}
              onPress={toggleCameraRatio}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="aspect-ratio" size={14} color={Colors.primary} />
              <Text style={styles.ratioSelectorText}>{cameraRatio}</Text>
            </TouchableOpacity>

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
