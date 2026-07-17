import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform
} from 'react-native';
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

type OpacityMode = 'Faint' | 'Medium' | 'Solid';

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = TEMPLATES.find(t => t.id === id) || TEMPLATES[0];

  if (!template) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <Text style={styles.errorText}>No templates available. Please add a template to the database first.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => router.replace('/')}>
          <Text style={styles.permissionButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
  const [opacityMode, setOpacityMode] = useState<OpacityMode>('Medium');
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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

  const getOverlayOpacity = () => {
    switch (opacityMode) {
      case 'Faint': return 0.25;
      case 'Medium': return 0.55;
      case 'Solid': return 0.85;
      default: return 0.55;
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      setIsCapturing(true);
      // Simulate capture
      setTimeout(() => {
        setCapturedPhoto(template.imageSource);
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
        {showReferenceImage && (
          <Image 
            source={template.imageSource}
            style={[StyleSheet.absoluteFill, { opacity: getOverlayOpacity() }]}
            contentFit="cover"
            pointerEvents="none"
          />
        )}

        {/* Rule of Thirds Grid Overlay */}
        {showGrid && (
          <View style={styles.gridOverlay}>
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
        <Animated.View style={[styles.alignIndicator, { opacity: flashAnim }]}>
          <View style={styles.dot} />
          <Text style={styles.alignText}>Align your shot</Text>
        </Animated.View>

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
          <TouchableOpacity style={styles.widgetButton}>
            <Ionicons name="time-outline" size={20} color="#FFF" />
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
          <Text style={styles.categoryName}>{template.category.toUpperCase()}</Text>
          <Text style={styles.templateTitle}>{template.title}</Text>
        </View>

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
      </View>

      {/* Main Camera Viewfinder Container */}
      <View style={[styles.cameraContainer, { height: CAMERA_HEIGHT }]}>
        {isWeb ? (
          <View style={StyleSheet.absoluteFill}>
            <Image 
              source={template.imageSource} 
              style={[StyleSheet.absoluteFill, { opacity: 0.45 }]} 
              contentFit="cover"
            />
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
        {/* Opacity Control Slider (Faint, Medium, Solid) */}
        <View style={styles.opacitySelectorContainer}>
          <Text style={styles.opacityLabel}>Overlay</Text>
          <View style={styles.opacityRow}>
            {(['Faint', 'Medium', 'Solid'] as OpacityMode[]).map(mode => {
              const isActive = opacityMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.opacityPill, isActive && styles.opacityPillActive]}
                  onPress={() => setOpacityMode(mode)}
                >
                  <Text style={[styles.opacityPillText, isActive && styles.opacityPillTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
            onPress={takePhoto}
            disabled={isCapturing}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Last Photo Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {capturedPhoto ? (
              <Image 
                source={capturedPhoto} 
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder} />
            )}
          </View>
        </View>
      </View>
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
  opacityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  opacityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
  },
  opacityPillActive: {
    backgroundColor: '#1c1c1c',
    borderColor: '#FF5C35',
  },
  opacityPillText: {
    color: '#5c5c5c',
    fontSize: 12,
    fontWeight: '700',
  },
  opacityPillTextActive: {
    color: '#FFF',
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
});
