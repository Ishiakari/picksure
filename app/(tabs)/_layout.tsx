import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
      tabBar={({ state, descriptors, navigation }) => {
        return (
          <SafeAreaView edges={['bottom']} style={styles.tabBarWrapper}>
            <View style={styles.tabBarInner}>
              {/* Tab: Home */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: state.routes[0].key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    navigation.navigate(state.routes[0].name);
                  }
                }}
              >
                <Feather
                  name="home"
                  size={20}
                  color={state.index === 0 ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    state.index === 0 && styles.tabLabelActive,
                  ]}
                >
                  Home
                </Text>
              </TouchableOpacity>

              {/* Tab: Search */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                  navigation.navigate('explore');
                }}
              >
                <Feather
                  name="search"
                  size={20}
                  color={state.routes[state.index]?.name === 'explore' ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    state.routes[state.index]?.name === 'explore' && styles.tabLabelActive,
                  ]}
                >
                  Search
                </Text>
              </TouchableOpacity>

              {/* Center Iconic Camera Action Button */}
              <View style={styles.centerCameraWrapper}>
                <TouchableOpacity
                  style={styles.centerCameraBtn}
                  activeOpacity={0.88}
                  onPress={() => router.push('/camera')}
                >
                  <View style={styles.centerCameraRing}>
                    <Ionicons name="camera" size={24} color={Colors.background} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Tab: Community */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                  navigation.navigate('community');
                }}
              >
                <Feather
                  name="users"
                  size={20}
                  color={state.routes[state.index]?.name === 'community' ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    state.routes[state.index]?.name === 'community' && styles.tabLabelActive,
                  ]}
                >
                  Community
                </Text>
              </TouchableOpacity>

              {/* Tab: Profile */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                  navigation.navigate('profile');
                }}
              >
                <Feather
                  name="user"
                  size={20}
                  color={state.routes[state.index]?.name === 'profile' ? Colors.primaryDark : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    state.routes[state.index]?.name === 'profile' && styles.tabLabelActive,
                  ]}
                >
                  Profile
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Search' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    display: 'none',
  },
  tabBarWrapper: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 58,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primaryDark,
    fontFamily: Fonts.bold,
  },
  centerCameraWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerCameraBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerCameraRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
