import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface PickSureLogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
  textColor?: string;
}

/**
 * Official PickSure Vector Logo Component
 * Replicates the camera viewfinder frame with center checkmark & ticks.
 */
export default function PickSureLogo({ 
  size = 44, 
  showText = true, 
  color = Colors.rosePrimary, 
  textColor = Colors.creamLight 
}: PickSureLogoProps) {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Frame Ticks (Top, Bottom, Left, Right) */}
        <Path d="M50 4 L54 12 L46 12 Z" fill={color} />
        <Path d="M50 96 L54 88 L46 88 Z" fill={color} />
        <Path d="M4 50 L12 46 L12 54 Z" fill={color} />
        <Path d="M96 50 L88 46 L88 54 Z" fill={color} />

        {/* Viewfinder Outer Frame */}
        <Rect 
          x="14" 
          y="14" 
          width="72" 
          height="72" 
          fill="none" 
          stroke={color} 
          strokeWidth="5" 
        />

        {/* Top-left & Bottom-right Accent Dots */}
        <Rect x="23" y="23" width="4" height="4" fill={color} rx="1" />
        <Rect x="73" y="73" width="4" height="4" fill={color} rx="1" />

        {/* Center Checkmark Icon */}
        <Path 
          d="M28 50 L44 64 L72 32" 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      </Svg>

      {showText && (
        <Text style={[styles.brandText, { color: textColor }]}>PICKSURE</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
});
