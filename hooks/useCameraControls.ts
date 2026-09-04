import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions, Animated, Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CameraRatio = '4:3' | '1:1' | '16:9' | 'Full';

export const DEFAULT_RATIOS: CameraRatio[] = ['4:3', '1:1', '16:9', 'Full'];

import { calculateCropRectangle, CropRectangle } from '@/utils/cropMath';

export { calculateCropRectangle, CropRectangle };

// Helper to crop captured image to match the active cameraRatio framing
export async function cropPhotoToActiveRatio(
  photoUri: string,
  photoW: number,
  photoH: number,
  ratio: CameraRatio
): Promise<string> {
  if (ratio === 'Full' || !photoW || !photoH) {
    return photoUri;
  }

  const crop = calculateCropRectangle(photoW, photoH, ratio);
  if (crop.width === photoW && crop.height === photoH && crop.originX === 0 && crop.originY === 0) {
    return photoUri;
  }

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          crop: {
            originX: crop.originX,
            originY: crop.originY,
            width: crop.width,
            height: crop.height,
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
export function getViewportDimensions(
  selectedRatio: CameraRatio,
  screenW: number = SCREEN_WIDTH,
  screenH: number = SCREEN_HEIGHT
) {
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
    frameW = screenW;
    frameH = screenH;
  }

  return { width: frameW, height: frameH };
}

// Convert template ratio metadata string (e.g. '3:4 RATIO', '4:5 RATIO', '1:1 RATIO', '9:16 RATIO') to closest camera ratio
export function mapTemplateRatioToCameraRatio(ratioStr?: string): CameraRatio {
  if (!ratioStr) return '4:3';
  const clean = ratioStr.toUpperCase();
  if (clean.includes('1:1')) return '1:1';
  if (clean.includes('3:4') || clean.includes('4:3') || clean.includes('4:5')) return '4:3';
  if (clean.includes('9:16') || clean.includes('16:9') || clean.includes('1.618')) return '16:9';
  return '4:3';
}

interface UseCameraControlsOptions {
  cameraRef: React.RefObject<CameraView | null>;
  mediaPermission: boolean | null;
  activeTemplateRatio?: string;
  activeTemplateId?: string;
}

export function useCameraControls({
  cameraRef,
  mediaPermission,
  activeTemplateRatio,
  activeTemplateId,
}: UseCameraControlsOptions) {
  // Ratios & Viewport
  const [availableRatios] = useState<CameraRatio[]>(DEFAULT_RATIOS);
  const [cameraRatio, setCameraRatio] = useState<CameraRatio>('4:3');
  const [ratioToastMessage, setRatioToastMessage] = useState<string | null>(null);

  // Settings
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [zoomIndex, setZoomIndex] = useState(0); // 0: 1x, 1: 1.5x, 2: 2x, 3: MAX
  const [showGrid, setShowGrid] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [overlayMode, setOverlayMode] = useState<'outline' | 'photo'>('outline');
  const [opacityValue, setOpacityValue] = useState(50); // 0 - 100
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filterPreset, setFilterPreset] = useState<'none' | 'warm' | 'noir'>('none');

  // Gallery
  const [capturedPhotosList, setCapturedPhotosList] = useState<string[]>([]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const alignToastAnim = useRef(new Animated.Value(0)).current;
  const ratioToastAnim = useRef(new Animated.Value(0)).current;

  // Auto-suggest and set matching ratio when active guide loads or changes
  useEffect(() => {
    if (activeTemplateRatio) {
      const suggestedRatio = mapTemplateRatioToCameraRatio(activeTemplateRatio);
      setCameraRatio(suggestedRatio);

      const cleanRatioName = activeTemplateRatio.replace(/RATIO/i, '').trim();
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
  }, [activeTemplateId, activeTemplateRatio]);

  // Pulse & Alignment Animations
  useEffect(() => {
    const pulseLoop = Animated.loop(
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
    );
    pulseLoop.start();

    Animated.spring(alignToastAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setTimerMode((current) => {
      if (current === 0) return 3;
      if (current === 3) return 10;
      return 0;
    });
  }, []);

  const toggleFilter = useCallback(() => {
    setFilterPreset((current) => {
      if (current === 'none') return 'warm';
      if (current === 'warm') return 'noir';
      return 'none';
    });
  }, []);

  const toggleOverlayMode = useCallback(() => {
    setOverlayMode((prev) => (prev === 'outline' ? 'photo' : 'outline'));
  }, []);

  const toggleCameraRatio = useCallback(() => {
    setCameraRatio((current) => {
      const idx = availableRatios.indexOf(current);
      const nextIdx = (idx + 1) % availableRatios.length;
      return availableRatios[nextIdx];
    });
  }, [availableRatios]);

  const adjustOpacity = useCallback((delta: number) => {
    setOpacityValue((prev) => Math.min(100, Math.max(0, prev + delta)));
  }, []);

  const getZoomValue = useCallback(() => {
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
  }, [zoomIndex]);

  const executeTakePicture = useCallback(async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.92,
          skipProcessing: false,
        });

        if (photo?.uri) {
          const finalPhotoUri = await cropPhotoToActiveRatio(
            photo.uri,
            photo.width || SCREEN_WIDTH,
            photo.height || SCREEN_HEIGHT,
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
      setIsCapturing(true);
      setTimeout(() => {
        setIsCapturing(false);
      }, 300);
    }
  }, [cameraRef, isCapturing, cameraRatio, mediaPermission]);

  const capturePhoto = useCallback(() => {
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
  }, [isCapturing, timerMode, executeTakePicture]);

  const clearCapturedPhotos = useCallback(() => {
    setCapturedPhotosList([]);
  }, []);

  const viewportDimensions = getViewportDimensions(cameraRatio);

  return {
    // Ratios & Viewport
    cameraRatio,
    setCameraRatio,
    availableRatios,
    toggleCameraRatio,
    viewportDimensions,
    ratioToastMessage,
    ratioToastAnim,

    // Settings
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
    adjustOpacity,
    filterPreset,
    toggleFilter,

    // Capture & Timer
    timerMode,
    toggleTimer,
    countdown,
    isCapturing,
    capturePhoto,
    capturedPhotosList,
    clearCapturedPhotos,

    // Animations
    pulseAnim,
    alignToastAnim,
  };
}
