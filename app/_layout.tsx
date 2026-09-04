import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Mali-Regular': require('@/assets/fonts/Mali-Regular.ttf'),
    'Mali-Medium': require('@/assets/fonts/Mali-Medium.ttf'),
    'Mali-SemiBold': require('@/assets/fonts/Mali-SemiBold.ttf'),
    'Mali-Bold': require('@/assets/fonts/Mali-Bold.ttf'),
    'Mali-ExtraLight': require('@/assets/fonts/Mali-ExtraLight.ttf'),
    'Mali-Light': require('@/assets/fonts/Mali-Light.ttf'),
    'Mali-Italic': require('@/assets/fonts/Mali-Italic.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="detail" options={{ headerShown: false }} />
            <Stack.Screen name="camera" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

