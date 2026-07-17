import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  ScrollView,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line as SvgLine, Circle as SvgCircle, Rect as SvgRect } from 'react-native-svg';
import { Image } from 'expo-image';
import { TEMPLATES } from '@/src/data/templates';

const { width } = Dimensions.get('window');
// Standard 3:4 aspect ratio camera container height
const CAMERA_HEIGHT = width * 1.333;

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = id ? TEMPLATES.find(t => t.id === id) : null;

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
  const [showGrid, setShowGrid] = useState(true);
  const [showReferenceImage, setShowReferenceImage] = useState(true);
  const [opacityValue, setOpacityValue] = useState<number>(55);
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotosList, setCapturedPhotosList] = useState<string[]>([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  // Dynamic slider tracking variables
  const [trackWidth, setTrackWidth] = useState(130);
  const trackWidthRef = useRef(130);
  const startOpacity = useRef(55);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        let percentage = Math.round((touchX / trackWidthRef.current) * 100);
        percentage = Math.max(0, Math.min(100, percentage));
        setOpacityValue(percentage);
        startOpacity.current = percentage;
      },
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;
        const percentageChange = (dx / trackWidthRef.current) * 100;
        let nextOpacity = Math.round(startOpacity.current + percentageChange);
        nextOpacity = Math.max(0, Math.min(100, nextOpacity));
        setOpacityValue(nextOpacity);
      }
    })
  ).current;

  // Animated value for flashing dot
  const flashAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<any>(null);

  // Request permissions
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          // Check/Request Camera permissions safely
          const cameraStatus = await Camera.getCameraPermissionsAsync();
          if (cameraStatus.granted) {
            setCameraPermission(cameraStatus);
          } else {
            const requested = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(requested);
          }

          // Check/Request Media permissions safely
          const mediaStatus = await MediaLibrary.requestPermissionsAsync();
          setMediaPermission(mediaStatus.status === 'granted');
        } else {
          setCameraPermission({ granted: true });
          setMediaPermission(true);
        }
      } catch (err) {
        console.warn("Permissions checking failed:", err);
        // Fallback to granted so developer can see the screens without crashing
        setCameraPermission({ granted: true });
        setMediaPermission(true);
      }
    })();

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
    // Camera permissions are still loading
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FF5C35" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    // Camera permissions are not granted yet
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
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  const toggleTimer = () => {
    setTimerMode(prev => prev === 0 ? 3 : prev === 3 ? 10 : 0);
  };

  const getOverlayOpacity = () => {
    return opacityValue / 100;
  };

  const onTrackLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setTrackWidth(width);
      trackWidthRef.current = width;
    }
  };

  const handleShutterPress = () => {
    if (timerMode > 0) {
      let remaining = timerMode;
      setCountdown(remaining);
      const interval = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(null);
          executeCapture();
        }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const executeCapture = async () => {
    if (Platform.OS === 'web') {
      setIsCapturing(true);
      // Simulate capture
      setTimeout(() => {
        const mockImg = template?.imageSource || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500';
        setCapturedPhoto(mockImg);
        setCapturedPhotosList(prev => [mockImg, ...prev]);
        setIsCapturing(false);
      }, 600);
      return;
    }

    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const options = { quality: 1.0, skipProcessing: false };
        const photo = await cameraRef.current.takePictureAsync(options);
        
        if (photo?.uri) {
          setCapturedPhoto(photo.uri);
          setCapturedPhotosList(prev => [photo.uri, ...prev]);
          
          // Save to device library
          if (mediaPermission) {
            await MediaLibrary.saveToLibraryAsync(photo.uri);
          } else {
            console.warn("Media Library permissions not granted. Image only stored locally.");
          }
        }
      } catch (error) {
        console.error("Failed to capture image:", error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const renderOverlays = () => {
    return (
      <>
        {/* Translucent Reference Image Overlay */}
        {showReferenceImage && template && (
          <Image 
            source={template.imageSource}
            style={[StyleSheet.absoluteFill, { opacity: getOverlayOpacity() }]}
            contentFit="cover"
            pointerEvents="none"
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

        {/* Camera Parameter Widgets (Grid, Flash, Timer) */}
        <View style={styles.widgetBar}>
          <TouchableOpacity 
            style={[styles.widgetButton, showGrid && styles.widgetButtonActive]}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Ionicons name="grid" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.widgetButton, flash === 'on' && styles.widgetButtonActive]}
            onPress={toggleFlash}
          >
            <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={20} color="#FFF" />
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
          <Ionicons name="close" size={26} color="#FFF" />
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
              size={24} 
              color={showReferenceImage ? "#FF5C35" : "#FFF"} 
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Main Camera Viewfinder Container */}
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
              <Ionicons name="videocam-outline" size={16} color="#FF5C35" style={{ marginRight: 6 }} />
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
          >
            {renderOverlays()}
          </CameraView>
        )}
      </View>
      
      {/* Control Panel Below Camera Viewport */}
      <View style={styles.controlsPanel}>
        {/* Opacity Control Slider (Custom fine-grained control) */}
        {template && (
          <View style={styles.opacitySelectorContainer}>
            <Text style={styles.opacityLabel}>Opacity ({opacityValue}%)</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={() => setOpacityValue(prev => Math.max(0, prev - 5))}
              >
                <Ionicons name="remove" size={16} color="#FFF" />
              </TouchableOpacity>
              
              <View 
                style={styles.sliderTrack}
                onLayout={onTrackLayout}
                {...panResponder.panHandlers}
              >
                <View style={[styles.sliderFill, { width: `${opacityValue}%` }]} pointerEvents="none" />
                <View style={[styles.sliderKnob, { left: `${opacityValue}%` }]} pointerEvents="none" />
              </View>

              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={() => setOpacityValue(prev => Math.min(100, prev + 5))}
              >
                <Ionicons name="add" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shutter Button Row */}
        <View style={styles.shutterRow}>
          {/* Flip Camera */}
          <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={26} color="#FFF" />
          </TouchableOpacity>

          {/* Large Shutter Circle */}
          <TouchableOpacity 
            style={styles.shutterOuter} 
            activeOpacity={0.8}
            onPress={handleShutterPress}
            disabled={isCapturing || countdown !== null}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Last Photo Thumbnail */}
          <TouchableOpacity 
            style={styles.thumbnailContainer}
            activeOpacity={0.8}
            onPress={() => setIsGalleryVisible(true)}
          >
            {capturedPhoto ? (
              <Image 
                source={capturedPhoto} 
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="images-outline" size={20} color="#7a7a7a" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Gallery Modal Overlay */}
      {isGalleryVisible && (
        <View style={styles.galleryModal}>
          <SafeAreaView style={styles.gallerySafeArea}>
            {/* Header */}
            <View style={styles.galleryHeader}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => setIsGalleryVisible(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.galleryTitle}>Session Gallery</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Photos List */}
            {capturedPhotosList.length === 0 ? (
              <View style={styles.emptyGalleryContainer}>
                <Ionicons name="images-outline" size={48} color="#444" />
                <Text style={styles.emptyGalleryText}>No photos captured in this session yet.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.galleryGrid}>
                {capturedPhotosList.map((uri, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.galleryCard}
                    activeOpacity={0.8}
                    onPress={() => setSelectedGalleryPhoto(uri)}
                  >
                    <Image source={uri} style={styles.galleryImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      )}

      {/* Full Screen Photo Viewer */}
      {selectedGalleryPhoto && (
        <View style={styles.fullScreenViewer}>
          <SafeAreaView style={styles.fullScreenSafeArea}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => setSelectedGalleryPhoto(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.galleryTitle}>Photo Preview</Text>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.fullScreenImageContainer}>
              <Image source={selectedGalleryPhoto} style={styles.fullScreenImage} contentFit="contain" />
            </View>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCameraMockBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    zIndex: 10,
  },
  webCameraMockText: {
    color: '#FF5C35',
    fontSize: 11,
    fontWeight: '800',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#FF5C35',
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
    color: '#FF5C35',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  templateTitle: {
    fontSize: 14,
    color: '#a3a3a3',
    fontWeight: '600',
    marginTop: 2,
  },
  cameraContainer: {
    width: '100%',
    backgroundColor: '#121212',
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  poseOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Add margin to make sure overlay fits inside standard safe areas
    margin: 20,
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  topLeftCorner: {
    top: 16,
    left: 16,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  topRightCorner: {
    top: 16,
    right: 16,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bottomLeftCorner: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bottomRightCorner: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  alignIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF5C35',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5C35',
    marginRight: 6,
  },
  alignText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  widgetBar: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 12,
  },
  widgetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  widgetButtonActive: {
    backgroundColor: '#FF5C35',
    borderColor: '#FF5C35',
  },
  controlsPanel: {
    backgroundColor: '#000',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opacitySelectorContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  opacityLabel: {
    color: '#7a7a7a',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 16,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#262626',
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#FF5C35',
    borderRadius: 3,
  },
  sliderKnob: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF5C35',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  shutterRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },
  flipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  thumbnailContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#161616',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#161616',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  timerWidgetText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  galleryModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 1000,
  },
  gallerySafeArea: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  galleryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyGalleryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyGalleryText: {
    color: '#7a7a7a',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  galleryCard: {
    width: (width - 24) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenViewer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1100,
  },
  fullScreenSafeArea: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
