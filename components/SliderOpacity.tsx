import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SliderOpacityProps {
  opacityValue: number;
  onOpacityChange: (value: number) => void;
}

export default function SliderOpacity({ opacityValue, onOpacityChange }: SliderOpacityProps) {
  const [trackWidth, setTrackWidth] = useState(130);
  const trackWidthRef = useRef(130);
  const startOpacity = useRef(opacityValue);

  // Keep startOpacity updated if opacityValue prop changes externally
  useEffect(() => {
    startOpacity.current = opacityValue;
  }, [opacityValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        let percentage = Math.round((touchX / trackWidthRef.current) * 100);
        percentage = Math.max(0, Math.min(100, percentage));
        onOpacityChange(percentage);
        startOpacity.current = percentage;
      },
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;
        const percentageChange = (dx / trackWidthRef.current) * 100;
        let nextOpacity = Math.round(startOpacity.current + percentageChange);
        nextOpacity = Math.max(0, Math.min(100, nextOpacity));
        onOpacityChange(nextOpacity);
      }
    })
  ).current;

  const onTrackLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setTrackWidth(width);
      trackWidthRef.current = width;
    }
  };

  return (
    <View style={styles.opacitySelectorContainer}>
      <Text style={styles.opacityLabel}>Opacity ({opacityValue}%)</Text>
      <View style={styles.sliderContainer}>
        <TouchableOpacity 
          style={styles.adjustButton} 
          onPress={() => onOpacityChange(Math.max(0, opacityValue - 5))}
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
          onPress={() => onOpacityChange(Math.min(100, opacityValue + 5))}
        >
          <Ionicons name="add" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
