import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export interface CameraPermissionState {
  granted: boolean;
  canAskAgain?: boolean;
}

export function useCameraPermissions() {
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionState | null>(
    Platform.OS === 'web' ? { granted: true, canAskAgain: true } : null
  );
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(
    Platform.OS === 'web' ? true : null
  );

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const requested = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(requested);
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(mediaStatus.status === 'granted');
        if (!requested.granted && !requested.canAskAgain) {
          Linking.openSettings();
        }
      }
    } catch (err) {
      console.warn('Camera permissions request error:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const cameraStatus = await Camera.getCameraPermissionsAsync();
          if (!isMounted) return;
          if (cameraStatus.granted) {
            setCameraPermission(cameraStatus);
          } else {
            const requested = await Camera.requestCameraPermissionsAsync();
            if (!isMounted) return;
            setCameraPermission(requested);
          }
          const mediaStatus = await MediaLibrary.requestPermissionsAsync();
          if (!isMounted) return;
          setMediaPermission(mediaStatus.status === 'granted');
        } else {
          setCameraPermission({ granted: true, canAskAgain: true });
          setMediaPermission(true);
        }
      } catch (err) {
        console.warn('Camera permissions check error:', err);
        if (isMounted) {
          setCameraPermission({ granted: true });
          setMediaPermission(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const isPermanentlyDenied =
    cameraPermission !== null &&
    cameraPermission.granted === false &&
    cameraPermission.canAskAgain === false;

  return {
    cameraPermission,
    mediaPermission,
    requestPermissions,
    isPermanentlyDenied,
    openSettings: Linking.openSettings,
  };
}
