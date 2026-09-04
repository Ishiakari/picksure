import { Platform } from 'react-native';

/**
 * PickSure Brand Color Palette (Extracted from Figma Design)
 * - Primary Background: #FEF9F0 (Warm Cream / Light Ivory)
 * - Card & Surface: #F2EDE4 (Cream Surface)
 * - Card Border: #E7E2D9 (Subtle Cream Border)
 * - Primary Brand Dark / Text: #1D1C16 (Deep Studio Charcoal)
 * - Muted Plum Text: #524346 & #857376 (Editorial Subtitles)
 * - Accent Rose Primary: #F7A0B8 (Signature Rose Pink)
 * - Soft Rose Pill: #FFB9C8
 * - Studio Burgundy / Deep Accent: #8E485E & #753449
 * - HUD Dark Scrim: #32302B (Translucent rgba(50, 48, 43, ...))
 * - Pure White: #FFFFFF
 */
export const Colors = {
  // Brand Design System Tokens
  primary: '#F7A0B8',
  primarySoft: '#FFB9C8',
  primaryDark: '#843C54',
  plum: '#843C54',
  burgundy: '#843C54',
  burgundyLight: '#753449',

  background: '#FAF7F2',
  surface: '#F3EFEA',
  surfaceAlt: '#FFFFFF',
  border: '#E7E2D9',
  borderLight: '#EBE6DF',

  textPrimary: '#1A1817',
  textSecondary: '#524346',
  textMuted: '#857376',
  textLight: '#FAF7F2',
  textWhite: '#FFFFFF',

  hudBackground: 'rgba(50, 48, 43, 0.75)',
  hudSurface: 'rgba(50, 48, 43, 0.60)',
  hudButton: 'rgba(50, 48, 43, 0.50)',
  hudBorder: 'rgba(231, 226, 217, 0.25)',
  hudAccent: '#F7A0B8',

  badgeGreenBg: '#E8F5E9',
  badgeGreenText: '#2E7D32',

  // Backwards compatibility aliases
  rosePrimary: '#F7A0B8',
  roseSoft: '#FFB9C8',
  creamSurface: '#F3EFEA',
  creamLight: '#FAF7F2',
  darkText: '#1A1817',
  darkBackground: '#1A1817',
  darkCard: '#F3EFEA',

  light: {
    text: '#1A1817',
    subtext: '#524346',
    background: '#FAF7F2',
    card: '#F3EFEA',
    border: '#E7E2D9',
    tint: '#843C54',
    icon: '#524346',
    tabIconDefault: '#857376',
    tabIconSelected: '#843C54',
  },
  dark: {
    text: '#FAF7F2',
    subtext: '#857376',
    background: '#1A1817',
    card: '#2A2722',
    border: '#3A362F',
    tint: '#F7A0B8',
    icon: '#E7E2D9',
    tabIconDefault: '#857376',
    tabIconSelected: '#F7A0B8',
  },
};



export const Fonts = {
  regular: 'Mali-Regular',
  medium: 'Mali-Medium',
  semiBold: 'Mali-SemiBold',
  bold: 'Mali-Bold',
  extraLight: 'Mali-ExtraLight',
  light: 'Mali-Light',
  italic: 'Mali-Italic',
};

