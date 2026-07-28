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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Accelerometer } from 'expo-sensors';
import { useTemplates } from '@/hooks/useTemplates';
import { Colors } from '@/constants/theme';
import SliderOpacity from '@/components/SliderOpacity';
import SessionGalleryModal from '@/components/SessionGalleryModal';

const { width } = Dimensions.get('window');
const VIEWFINDER_WIDTH = width - 16;
const CAMERA_HEIGHT = VIEWFINDER_WIDTH * (4 / 3);

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates } = useTemplates();
  const template = id ? templates.find(t => t.id === id) : null;

  // Safe Permissions State
  const [cameraPermission, setCameraPermission] = useState<{ granted: boolean } | null>(
    Platform.OS === 'web' ? { granted: true } : null
  );
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(
    Platform.OS === 'web' ? true : null
  );

  // Camera Settings State
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [zoom, setZoom] = useState<number>(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showReferenceImage, setShowReferenceImage] = useState(true);
  const [isOutlineMode, setIsOutlineMode] = useState<boolean>(false);
  const [showLeveler, setShowLeveler] = useState<boolean>(true);
  const [opacityValue, setOpacityValue] = useState<number>(55);
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotosList, setCapturedPhotosList] = useState<string[]>([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  // Sensor Leveler State
  const [rollAngle, setRollAngle] = useState<number>(0);
  const [isLevel, setIsLevel] = useState<boolean>(false);

  // Animated value for flashing dot
  const flashAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<any>(null);

  // Request permissions & setup Accelerometer
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
        console.warn("Permissions checking failed:", err);
        setCameraPermission({ granted: true });
        setMediaPermission(true);
      }
    })();

    // Accelerometer listener for Horizon Level Indicator
    let subscription: any = null;
    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(data => {
        const angle = Math.atan2(data.x, Math.sqrt(data.y * data.y + data.z * data.z)) * (180 / Math.PI);
        setRollAngle(angle);
        setIsLevel(Math.abs(angle) <= 2.5);
      });
    }

    // Blinking dot animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const requestCameraPermissionDirectly = async () => {
    try {
      if (Platform.OS !== 'web') {
        const requested = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(requested);
      } else {
        setCameraPermission({ granted: true });
      }
    } catch (err) {
      console.warn("Camera permission request failed:", err);
      setCameraPermission({ granted: true });
    }
  };

  if (cameraPermission === null || mediaPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.rosePrimary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>PickSure needs camera permissions to display the viewfinder.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermissionDirectly}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const toggleTimer = () => {
    if (timerMode === 0) setTimerMode(3);
    else if (timerMode === 3) setTimerMode(10);
    else setTimerMode(0);
  };

  const handleZoomPress = (level: number) => {
    setZoom(level);
  };

  const getOverlayOpacity = () => {
    return (opacityValue / 100) * 0.85;
  };

  const executeTakePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });

        if (photo?.uri) {
          setCapturedPhoto(photo);
          setCapturedPhotosList(prev => [photo.uri, ...prev]);
          
          if (mediaPermission) {
            await MediaLibrary.saveToLibraryAsync(photo.uri);
          }
        }
      } catch (error) {
        console.error("Failed to capture image:", error);
      } finally {
        setIsCapturing(false);
      }
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

  const renderOverlays = () => {
    return (
      <>
        {/* Translucent Reference Image Overlay */}
        {showReferenceImage && template && (
          <Image 
            source={template.imageSource}
            style={[
              StyleSheet.absoluteFill, 
              { opacity: getOverlayOpacity() },
              isOutlineMode && styles.outlineImageStyle
            ]}
            contentFit="cover"
            pointerEvents="none"
            cachePolicy="memory-disk"
          />
        )}

        {/* Rule of Thirds Grid Overlay */}
        {showGrid && (
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={[styles.gridLineHorizontal, { top: '33.3%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '66.6%' }]} />
            <View style={[styles.gridLineVertical, { left: '33.3%' }]} />
            <View style={[styles.gridLineVertical, { left: '66.6%' }]} />
          </View>
        )}

        {/* Horizon Level Indicator */}
        {showLeveler && (
          <View style={styles.levelerWrapper} pointerEvents="none">
            {isLevel && (
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadgePill}>
                  <Text style={styles.levelBadgeText}>LEVEL ✓</Text>
                </View>
              </View>
            )}
            <View 
              style={[
                styles.levelerLine,
                { transform: [{ rotate: `${-rollAngle}deg` }] },
                isLevel && styles.levelerLinePerfect
              ]}
            />
          </View>
        )}

        {/* Visual Frame Guidelines / Corners */}
        <View style={[styles.cornerMarker, styles.topLeftCorner]} />
        <View style={[styles.cornerMarker, styles.topRightCorner]} />
        <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
        <View style={[styles.cornerMarker, styles.bottomRightCorner]} />

        {/* Align Your Shot Indicator */}
        {template && (
          <Animated.View style={[styles.alignIndicator, { opacity: flashAnim }]}>
            <View style={styles.dot} />
            <Text style={styles.alignText}>Align your shot</Text>
          </Animated.View>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Camera Parameter Widgets (Grid, Timer, Flash, Filter) Floating inside Viewfinder */}
        <View style={styles.widgetBarInside}>
          <TouchableOpacity 
            style={[styles.widgetButton, showGrid && styles.widgetButtonActive]}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Ionicons name="grid" size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.widgetButton, timerMode > 0 && styles.widgetButtonActive]}
            onPress={toggleTimer}
          >
            {timerMode === 0 ? (
               <Ionicons name="time-outline" size={20} color="#FFF" />
            ) : (
               <Text style={styles.timerWidgetText}>{timerMode}s</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.flashPillButton, flash === 'on' && styles.widgetButtonActive]}
            onPress={toggleFlash}
          >
            <Ionicons name={flash === 'on' ? "flash" : "flash-outline"} size={18} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.flashPillText}>{flash === 'on' ? 'AUTO\n+ FLASH' : 'AUTO\nFLASH'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.widgetButton, isOutlineMode && styles.widgetButtonActive]}
            onPress={() => setIsOutlineMode(!isOutlineMode)}
          >
            <Ionicons name="funnel-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.categoryName}>{template ? template.category.toUpperCase() : 'FREE MODE'}</Text>
          <Text style={styles.templateTitle}>{template ? template.title : 'Take a photo'}</Text>
        </View>

        {template ? (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowReferenceImage(!showReferenceImage)}
          >
            <Ionicons 
              name="layers-outline" 
              size={22} 
              color={showReferenceImage ? Colors.rosePrimary : "#FFF"} 
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Main Rounded Camera Viewfinder Container */}
      <View style={[styles.cameraContainer, { height: CAMERA_HEIGHT }]}>
        {isWeb ? (
          <View style={StyleSheet.absoluteFill}>
            {template && (
              <Image 
                source={template.imageSource} 
                style={[StyleSheet.absoluteFill, { opacity: 0.45 }]} 
                contentFit="cover"
              />
            )}
            <View style={styles.webCameraMockBanner}>
              <Ionicons name="videocam-outline" size={16} color={Colors.rosePrimary} style={{ marginRight: 6 }} />
              <Text style={styles.webCameraMockText}>Web Viewfinder Simulator</Text>
            </View>
            {renderOverlays()}
          </View>
        ) : (
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFill} 
            facing={facing}
            flash={flash}
            zoom={zoom}
          >
            {renderOverlays()}
          </CameraView>
        )}
      </View>
      
      {/* Controls & Dock Section */}
      <View style={styles.bottomControls}>
        {/* Opacity Slider Track */}
        {template && showReferenceImage && (
          <SliderOpacity 
            opacityValue={opacityValue} 
            onOpacityChange={setOpacityValue} 
          />
        )}

        {/* Capsule Zoom Selector Bar */}
        <View style={styles.zoomCapsuleBar}>
          <TouchableOpacity 
            style={[styles.zoomCapsulePill, zoom === 0 && styles.zoomCapsulePillActive]} 
            onPress={() => handleZoomPress(0)}
          >
            <Text style={[styles.zoomCapsuleText, zoom === 0 && styles.zoomCapsuleTextActive]}>1x</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.zoomCapsulePill, zoom === 0.08 && styles.zoomCapsulePillActive]} 
            onPress={() => handleZoomPress(0.08)}
          >
            <Text style={[styles.zoomCapsuleText, zoom === 0.08 && styles.zoomCapsuleTextActive]}>1.5x</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.zoomCapsulePill, zoom === 0.15 && styles.zoomCapsulePillActive]} 
            onPress={() => handleZoomPress(0.15)}
          >
            <Text style={[styles.zoomCapsuleText, zoom === 0.15 && styles.zoomCapsuleTextActive]}>2x</Text>
          </TouchableOpacity>
        </View>

        {/* Shutter Dock Row */}
        <View style={styles.shutterRow}>
          {/* Gallery Thumbnail */}
          <TouchableOpacity 
            style={styles.circleDockButton}
            onPress={() => setIsGalleryVisible(true)}
          >
            {capturedPhotosList.length > 0 ? (
              <Image 
                source={{ uri: capturedPhotosList[0] }} 
                style={styles.galleryImage} 
                contentFit="cover"
              />
            ) : (
              <Ionicons name="images-outline" size={24} color="#FFF" />
            )}
            {capturedPhotosList.length > 0 && (
              <View style={styles.galleryBadge}>
                <Text style={styles.galleryBadgeText}>{capturedPhotosList.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Shutter Button with Rose Pink Ring Glow */}
          <TouchableOpacity 
            style={[styles.shutterOuterRing, isCapturing && styles.shutterOuterDisabled]} 
            activeOpacity={0.8}
            onPress={handleCapturePress}
            disabled={isCapturing}
          >
            <View style={styles.shutterInnerCircle} />
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity style={styles.circleDockButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
            <Ionicons name="sparkles" size={10} color={Colors.rosePrimary} style={styles.sparkleIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Session Gallery Modal */}
      <SessionGalleryModal 
        visible={isGalleryVisible}
        photos={capturedPhotosList}
        onClose={() => setIsGalleryVisible(false)}
        onClear={() => setCapturedPhotosList([])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: Colors.rosePrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: Colors.darkText,
    fontWeight: '800',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 35, 35, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  categoryName: {
    color: Colors.rosePrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  templateTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  cameraContainer: {
    width: VIEWFINDER_WIDTH,
    alignSelf: 'center',
    borderRadius: 28,
    backgroundColor: '#111',
    overflow: 'hidden',
    position: 'relative',
  },
  webCameraMockBanner: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  webCameraMockText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  outlineImageStyle: {
    tintColor: Colors.rosePrimary,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelerLine: {
    width: '55%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 1,
  },
  levelerLinePerfect: {
    backgroundColor: '#4EED97',
    height: 3.5,
    shadowColor: '#4EED97',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  levelBadgeContainer: {
    position: 'absolute',
    top: '42%',
    alignItems: 'center',
  },
  levelBadgePill: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  levelBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cornerMarker: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  topLeftCorner: {
    top: 16,
    left: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  topRightCorner: {
    top: 16,
    right: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  bottomLeftCorner: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  bottomRightCorner: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  alignIndicator: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.rosePrimary,
  },
  alignText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  countdownText: {
    fontSize: 96,
    fontWeight: '900',
    color: Colors.rosePrimary,
  },
  widgetBarInside: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  widgetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(25, 25, 25, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  flashPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 25, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  flashPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  widgetButtonActive: {
    backgroundColor: Colors.rosePrimary,
    borderColor: Colors.rosePrimary,
  },
  timerWidgetText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  bottomControls: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  zoomCapsuleBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 20,
    padding: 3,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomCapsulePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomCapsulePillActive: {
    backgroundColor: Colors.rosePrimary,
  },
  zoomCapsuleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
  },
  zoomCapsuleTextActive: {
    color: Colors.darkText,
    fontWeight: '900',
  },
  shutterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  circleDockButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    bottom: 6,
    right: 10,
  },
  shutterOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.rosePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: Colors.rosePrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  shutterOuterDisabled: {
    opacity: 0.5,
  },
  shutterInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  galleryImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.rosePrimary,
  },
  galleryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.rosePrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  galleryBadgeText: {
    color: Colors.darkText,
    fontSize: 10,
    fontWeight: '900',
  },
});
