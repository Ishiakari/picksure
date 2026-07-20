import { Tabs } from 'expo-router';
import React from 'react';

/**
 * Tab layout configured to hide the bottom navigation bar
 * allowing full-bleed display with the floating shutter button.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
