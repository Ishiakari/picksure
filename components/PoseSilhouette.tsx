import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';

interface PoseSilhouetteProps {
  color?: string;
  accentColor?: string;
  opacity?: number;
  width?: number;
  height?: number;
}

export const PoseSilhouette: React.FC<PoseSilhouetteProps> = ({
  color = '#FEF9F0',
  accentColor = '#F7A0B8',
  opacity = 0.85,
  width = 310,
  height = 520,
}) => {
  return (
    <View style={[styles.container, { opacity }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 311 521" fill="none">
        {/* Head outline - dashed */}
        <Path
          d="M110.68 130.019C110.68 154.687 130.707 174.714 155.375 174.714C180.043 174.714 200.071 154.687 200.071 130.019C200.071 105.351 180.043 85.3236 155.375 85.3236C130.707 85.3236 110.68 105.351 110.68 130.019V130.019"
          stroke={color}
          strokeOpacity={0.9}
          strokeWidth={2}
          strokeDasharray="4.06 4.06"
        />

        {/* Eye level / facial crosshairs */}
        <Path
          d="M145.217 130.019H165.533"
          stroke={color}
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />
        <Path
          d="M155.375 119.861V140.177"
          stroke={color}
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />

        {/* Left shoulder and body curve - dashed */}
        <Path
          d="M129.98 170.651C109.664 183.856 89.3483 198.077 76.1429 221.441C63.9533 242.772 65.9849 272.231 68.0165 307.784L79.1903 409.364C82.2377 455.075 96.4589 478.438 116.775 480.47"
          stroke={color}
          strokeOpacity={0.75}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6.08 6.08"
        />

        {/* Right shoulder and body curve - dashed */}
        <Path
          d="M180.77 170.651C201.086 183.856 221.402 198.077 234.608 221.441C246.797 242.772 244.766 272.231 242.734 307.784L231.56 409.364C228.513 455.075 214.292 478.438 193.976 480.47"
          stroke={color}
          strokeOpacity={0.75}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6.08 6.08"
        />

        {/* Spine alignment axis - dashed pink */}
        <Path
          d="M155.375 180.809V465.233"
          stroke={accentColor}
          strokeOpacity={0.9}
          strokeWidth={1.8}
          strokeDasharray="3.04 5.07"
        />

        {/* Waist reference curve */}
        <Path
          d="M104.585 297.626C138.445 305.752 172.305 305.752 206.165 297.626"
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeDasharray="4.06 4.06"
        />

        {/* Left hand / pocket pose anchor circle */}
        <Path
          d="M94.4274 323.021C94.4274 325.824 96.7033 328.1 99.5064 328.1C102.31 328.1 104.585 325.824 104.585 323.021C104.585 320.218 102.31 317.942 99.5064 317.942C96.7033 317.942 94.4274 320.218 94.4274 323.021V323.021"
          stroke={accentColor}
          strokeOpacity={0.9}
          strokeWidth={2}
        />

        {/* Right hand / pocket pose anchor circle */}
        <Path
          d="M206.165 323.021C206.165 325.824 208.441 328.1 211.244 328.1C214.047 328.1 216.323 325.824 216.323 323.021C216.323 320.218 214.047 317.942 211.244 317.942C208.441 317.942 206.165 320.218 206.165 323.021V323.021"
          stroke={accentColor}
          strokeOpacity={0.9}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
