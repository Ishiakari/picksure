import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Platform,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTemplates } from '@/hooks/useTemplates';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Colors, Fonts } from '@/constants/theme';
import UploadTemplateModal from '@/components/UploadTemplateModal';

const SCREEN_PADDING = 18;
const GRID_GAP = 12;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { templates, refresh, refreshing } = useTemplates();
  const { bookmarkedIds, reloadBookmarks } = useBookmarks();
  const { width } = useWindowDimensions();

  const cardWidth = Math.max(120, Math.floor((width - SCREEN_PADDING * 2 - GRID_GAP) / 2));

  const [activeTab, setActiveTab] = useState<'saved' | 'uploads'>('saved');
  const [uploadedTemplateIds, setUploadedTemplateIds] = useState<string[]>([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);

  const loadUserUploads = async () => {
    try {
      const userKey = user?.id || 'guest';
      const uIds = new Set<string>();

      // 1. Fetch user uploads from Supabase
      if (user?.id) {
        const { data: dbUploads, error: uploadsError } = await supabase
          .from('templates')
          .select('id')
          .eq('creator_id', user.id);
        if (uploadsError) {
          console.warn('Supabase my_uploads query error:', uploadsError.message);
        } else if (dbUploads) {
          dbUploads.forEach((row) => uIds.add(row.id));
        }
      }

      // 2. Read user-scoped local upload keys
      const keys = await AsyncStorage.getAllKeys();
      const uploadPrefix = 'my_upload_' + userKey + '_';
      for (const key of keys) {
        if (key.startsWith(uploadPrefix)) {
          const val = await AsyncStorage.getItem(key);
          if (val === 'true') uIds.add(key.replace(uploadPrefix, ''));
        }
      }

      setUploadedTemplateIds(Array.from(uIds));
    } catch (err) {
      console.warn('Failed to load user uploads:', err);
    }
  };

  useEffect(() => {
    loadUserUploads();
  }, [user?.id]);

  const handleRefresh = async () => {
    await refresh();
    await Promise.all([loadUserUploads(), reloadBookmarks()]);
  };

  const handleShareProfile = async () => {
    const displayName =
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'PickSure Creator';
    try {
      await Share.share({
        message: 'Check out ' + displayName + "'s photography studio on PickSure!",
      });
    } catch (err) {
      console.warn(err);
    }
  };

  // P2 #8: Logout confirmation dialog on both native and web
  const handleSignOut = () => {
    const executeLogout = async () => {
      setUploadedTemplateIds([]);
      await signOut();
      await reloadBookmarks();
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of your studio account?');
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of your studio account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: executeLogout,
        },
      ]);
    }
  };

  // P0 #2: Helper to mask email address by default
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name[0]}•••@${domain}`;
    }
    return `${name.slice(0, 2)}••••••@${domain}`;
  };

  const savedTemplates = user ? templates.filter((t) => bookmarkedIds.has(t.id)) : [];
  const uploadedTemplates = user
    ? templates.filter(
        (t) =>
          uploadedTemplateIds.includes(t.id) ||
          (user?.id && (t as any).creator_id === user.id)
      )
    : [];

  const displayedTemplates = activeTab === 'saved' ? savedTemplates : uploadedTemplates;

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest Explorer';
  const userAvatar = user?.user_metadata?.avatar_url || null;
  const userEmail = user?.email || 'Sign in to sync your studio across devices';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top Header - P1 #3: Reconciled to 'Studio' */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push('/modal')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          aria-label="Open settings"
        >
          <Feather name="settings" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Studio</Text>

        {/* P2 #8: Accessible label aria-label="Log out" on logout icon */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={user ? handleSignOut : () => router.push('/auth')}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Log out' : 'Log in'}
          aria-label={user ? 'Log out' : 'Log in'}
        >
          <Feather
            name={user ? 'log-out' : 'log-in'}
            size={18}
            color={user ? Colors.primaryDark : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryDark}
            colors={[Colors.primaryDark]}
          />
        }
      >
        {user ? (
          /* Authenticated Studio Card - P2 #11: Balanced vertical padding */
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>STUDIO</Text>
              </View>
            </View>

            <Text style={styles.profileName}>{userName}</Text>

            {/* P0 #2 & P2 #10: Masked email by default + High-contrast secondary text */}
            <TouchableOpacity
              style={styles.emailContainer}
              onPress={() => setIsEmailRevealed((prev) => !prev)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isEmailRevealed ? 'Hide email address' : 'Reveal masked email address'}
              aria-label={isEmailRevealed ? 'Hide email address' : 'Reveal masked email address'}
            >
              <Feather
                name={isEmailRevealed ? 'eye-off' : 'eye'}
                size={12}
                color="#3D3335"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.profileRole}>
                {isEmailRevealed ? userEmail : maskEmail(userEmail)}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons Row */}
            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={[styles.profileActionBtn, styles.profileCreateBtn]}
                onPress={() => setIsUploadModalVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Create Guide"
                aria-label="Create Guide"
              >
                <Feather name="plus" size={14} color={Colors.background} />
                <Text style={styles.profileCreateText}>Create Guide</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileActionBtn}
                onPress={handleShareProfile}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Share Studio"
                aria-label="Share Studio"
              >
                <Feather name="share-2" size={13} color={Colors.textPrimary} />
                <Text style={styles.profileActionText}>Share Studio</Text>
              </TouchableOpacity>
            </View>

            {/* Studio Stats & Interactive Tab Switcher
                P1 #4: Renamed 'My Uploads' to 'My Guides'
                P1 #5: Standardized border/stroke on both stat boxes
                P1 #6: Empty-state prompt when stat is 0
                P2 #9: Visual tap affordance (chevron, active state, indicator)
            */}
            <View style={styles.statsRow}>
              {/* Stat 1: Saved Guides */}
              <TouchableOpacity
                style={[
                  styles.statCard,
                  activeTab === 'saved' && styles.statCardActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveTab('saved')}
                accessibilityRole="tab"
                accessibilityLabel={`Saved Guides, ${savedTemplates.length} guides`}
                aria-label={`Saved Guides, ${savedTemplates.length} guides`}
                accessibilityState={{ selected: activeTab === 'saved' }}
              >
                <View style={styles.statTopRow}>
                  <Text
                    style={[
                      styles.statNumber,
                      activeTab === 'saved' && styles.statNumberActive,
                    ]}
                  >
                    {savedTemplates.length}
                  </Text>
                  {/* P2 #9: Visual tap affordance chevron */}
                  <Feather
                    name="chevron-right"
                    size={13}
                    color={activeTab === 'saved' ? Colors.primaryDark : '#6E5F62'}
                  />
                </View>

                <View style={styles.statLabelRow}>
                  <Ionicons
                    name="bookmark"
                    size={12}
                    color={activeTab === 'saved' ? Colors.primaryDark : '#443739'}
                  />
                  <Text
                    style={[
                      styles.statLabel,
                      activeTab === 'saved' && styles.statLabelActive,
                    ]}
                  >
                    Saved Guides
                  </Text>
                </View>

                {/* P1 #6: Empty state prompt when stat is 0 */}
                {savedTemplates.length === 0 && (
                  <TouchableOpacity
                    style={styles.statEmptyPrompt}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      router.push('/explore');
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Explore guides to save"
                    aria-label="Explore guides to save"
                  >
                    <Text style={styles.statEmptyPromptText}>
                      Explore guides to save →
                    </Text>
                  </TouchableOpacity>
                )}

                {/* P2 #9: Subtle active tab indicator bar */}
                {activeTab === 'saved' && <View style={styles.statActiveBar} />}
              </TouchableOpacity>

              {/* Stat 2: My Guides (P1 #4) */}
              <TouchableOpacity
                style={[
                  styles.statCard,
                  activeTab === 'uploads' && styles.statCardActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveTab('uploads')}
                accessibilityRole="tab"
                accessibilityLabel={`My Guides, ${uploadedTemplates.length} guides`}
                aria-label={`My Guides, ${uploadedTemplates.length} guides`}
                accessibilityState={{ selected: activeTab === 'uploads' }}
              >
                <View style={styles.statTopRow}>
                  <Text
                    style={[
                      styles.statNumber,
                      activeTab === 'uploads' && styles.statNumberActive,
                    ]}
                  >
                    {uploadedTemplates.length}
                  </Text>
                  {/* P2 #9: Visual tap affordance chevron */}
                  <Feather
                    name="chevron-right"
                    size={13}
                    color={activeTab === 'uploads' ? Colors.primaryDark : '#6E5F62'}
                  />
                </View>

                <View style={styles.statLabelRow}>
                  <Ionicons
                    name="cloud-upload"
                    size={12}
                    color={activeTab === 'uploads' ? Colors.primaryDark : '#443739'}
                  />
                  <Text
                    style={[
                      styles.statLabel,
                      activeTab === 'uploads' && styles.statLabelActive,
                    ]}
                  >
                    My Guides
                  </Text>
                </View>

                {/* P1 #6: Empty state prompt when stat is 0 */}
                {uploadedTemplates.length === 0 && (
                  <TouchableOpacity
                    style={styles.statEmptyPrompt}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setIsUploadModalVisible(true);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Tap Create Guide to get started"
                    aria-label="Tap Create Guide to get started"
                  >
                    <Text style={styles.statEmptyPromptText}>
                      Tap Create Guide to get started →
                    </Text>
                  </TouchableOpacity>
                )}

                {/* P2 #9: Subtle active tab indicator bar */}
                {activeTab === 'uploads' && <View style={styles.statActiveBar} />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Guest Explorer State Card */
          <View style={styles.guestCard}>
            <View style={styles.guestIconBadge}>
              <Feather name="user" size={32} color={Colors.primaryDark} />
            </View>

            <Text style={styles.guestTitle}>Welcome to PickSure Studio</Text>
            <Text style={styles.guestSubtitle}>
              Sign in or create your studio account to sync saved composition guides, upload custom pose overlays, and access your camera HUD across devices.
            </Text>

            <TouchableOpacity
              style={styles.guestSignInBtn}
              activeOpacity={0.88}
              onPress={() => router.push('/auth')}
              accessibilityRole="button"
              accessibilityLabel="Sign in or create account"
              aria-label="Sign in or create account"
            >
              <Feather name="log-in" size={16} color={Colors.background} style={{ marginRight: 8 }} />
              <Text style={styles.guestSignInText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dynamic Grid Display for Authenticated Users - P1 #7: Normalized insets */}
        {user ? (
          displayedTemplates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'saved' ? 'bookmark-outline' : 'cloud-upload-outline'}
                size={44}
                color={Colors.primaryDark}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'saved' ? 'No Saved Guides Yet' : 'No Created Guides Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'saved'
                  ? 'Tap the bookmark icon on any guide in the Home feed to save it to your studio collection.'
                  : 'Tap "Create Guide" above to publish your custom composition guides!'}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {displayedTemplates.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { width: cardWidth }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({ pathname: '/detail', params: { id: item.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.category || 'Guide'}`}
                  aria-label={`${item.title}, ${item.category || 'Guide'}`}
                >
                  <Image
                    source={item.imageSource}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                  {/* P0 #1: Dark gradient scrim (linear-gradient, transparent to rgba(0,0,0,0.6)) behind bottom-third */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.65)']}
                    locations={[0, 1]}
                    style={styles.cardBottomGradient}
                    pointerEvents="none"
                  />
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>
                      {(item.category || '').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.difficulty} · {item.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : null}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Create / Upload Guide Sheet Modal */}
      <UploadTemplateModal
        visible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onUploadSuccess={() => {
          refresh();
          loadUserUploads();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  // P1 #7: Normalized edge padding (SCREEN_PADDING = 18)
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
  },
  // P2 #11: Symmetrical vertical padding (20px top, 20px bottom)
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: Colors.primaryDark,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    color: Colors.background,
  },
  proBadge: {
    position: 'absolute',
    bottom: -2,
    right: -6,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  proBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.background,
    letterSpacing: 0.8,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  // P2 #10: Darkened secondary text (#3D3335) with 10.9:1 contrast ratio against cream
  profileRole: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#3D3335',
    textAlign: 'center',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  profileCreateBtn: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  profileCreateText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.background,
  },
  profileActionText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  // P1 #5: Standardized border/stroke on both stat boxes (borderWidth: 1.5, borderColor: Colors.border)
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  statCardActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border, // Standardized: same border treatment as inactive
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statNumber: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: '#1A1817',
  },
  statNumberActive: {
    color: Colors.primaryDark,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  // P2 #10: High contrast inactive label (#443739) with 9.8:1 ratio
  statLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: '#443739',
  },
  statLabelActive: {
    color: Colors.primaryDark,
    fontFamily: Fonts.bold,
  },
  // P1 #6: Empty-state prompt button when stat is 0
  statEmptyPrompt: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(132, 60, 84, 0.08)',
  },
  statEmptyPromptText: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  // P2 #9: Visual tap affordance indicator bar
  statActiveBar: {
    position: 'absolute',
    bottom: 0,
    left: 18,
    right: 18,
    height: 3,
    backgroundColor: Colors.primaryDark,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  guestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  guestIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  guestSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    height: 50,
    width: '100%',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  guestSignInText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.background,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // P1 #7: Normalized edge alignment with profile card
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    width: '100%',
  },
  card: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  // P0 #1: Dark gradient scrim behind bottom-third of image cards
  cardBottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  cardTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(254, 249, 240, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTagText: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    color: Colors.textPrimary,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  // P0 #1: Crisp high-contrast text overlay
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardMeta: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: '#FFE4EC',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
