import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  themeColors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    rosePrimary: string;
    roseSoft: string;
    headerBackground: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setThemeMode: () => {},
  themeColors: {
    background: Colors.darkBackground,
    card: Colors.darkCard,
    text: Colors.creamLight,
    subtext: Colors.roseSoft,
    border: Colors.border,
    rosePrimary: Colors.rosePrimary,
    roseSoft: Colors.roseSoft,
    headerBackground: Colors.darkBackground,
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Load persisted theme preference
    AsyncStorage.getItem('app_theme_mode').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeModeState(savedTheme);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('app_theme_mode', mode);
    } catch (err) {
      console.warn("Failed to persist theme mode:", err);
    }
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const isDark = themeMode === 'dark';

  const themeColors = isDark
    ? {
        background: '#161114',
        card: '#22191f',
        text: '#faf5ec',
        subtext: '#fbb6c4',
        border: '#33242c',
        rosePrimary: '#f7a0b8',
        roseSoft: '#fbb6c4',
        headerBackground: '#161114',
      }
    : {
        background: '#FAF5EC',
        card: '#FAE9D7',
        text: '#2A1D24',
        subtext: '#8A6D7B',
        border: '#E8D5C4',
        rosePrimary: '#E87A9A',
        roseSoft: '#F299B2',
        headerBackground: '#FAF5EC',
      };

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, toggleTheme, setThemeMode, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
