import { Platform } from 'react-native';

/**
 * PickSure Brand Color Palette
 * Derived from the official brand color swatch:
 * - Rose Primary: #f7a0b8
 * - Soft Rose: #fbb6c4
 * - Warm Cream Surface: #fae9d7
 * - Light Vanilla Background: #faf5ec
 * - Deep Charcoal Accent: #2A1D24
 */
export const Colors = {
  // Brand Color Palette Tokens
  rosePrimary: '#f7a0b8',
  roseSoft: '#fbb6c4',
  creamSurface: '#fae9d7',
  creamLight: '#faf5ec',
  darkText: '#2A1D24',
  darkBackground: '#161114',
  darkCard: '#22191f',
  border: '#33242c',

  light: {
    text: '#2A1D24',
    background: '#faf5ec',
    card: '#fae9d7',
    tint: '#f7a0b8',
    icon: '#7a646e',
    tabIconDefault: '#a38f98',
    tabIconSelected: '#f7a0b8',
  },
  dark: {
    text: '#faf5ec',
    background: '#161114',
    card: '#22191f',
    tint: '#f7a0b8',
    icon: '#b89fa9',
    tabIconDefault: '#7a646e',
    tabIconSelected: '#fbb6c4',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
