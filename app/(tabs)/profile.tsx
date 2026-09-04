import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTemplates } from '@/hooks/useTemplates';
import { Colors, Fonts } from '@/constants/theme';
import UploadTemplateModal from '@/components/UploadTemplateModal';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { templates, refresh, refreshing } = useTemplates();

  const [activeTab, setActiveTab] = useState<'saved' | 'uploads'>('saved');
  const [savedTemplateIds, setSavedTemplateIds] = useState<string[]>([]);
  const [uploadedTemplateIds, setUploadedTemplateIds] = useState<string[]>([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const loadUserCollections = async () => {
    try {
      const userKey = user?.id || 'guest';
      const sIds = new Set<string>();
      const uIds = new Set<string>();

      // 1. Fetch from Supabase if logged in
      if (user?.id) {
        const { data: dbSaved, error: savedError } = await supabase
          .from('saved_templates')
          .select('template_id')
          .eq('user_id', user.id);
        if (savedError) {
          console.warn('Supabase saved_templates query error:', savedError.message);
        } else if (dbSaved) {
          dbSaved.forEach((row) => sIds.add(row.template_id));
        }

        const { data: dbUploads, error: uploadsError } = await supabase
          .from('templates')
          .select('id')
          .eq('creator_id', user.id);
        if (uploadsError) {
          console.warn('Supabase my_uploads templates query error:', uploadsError.message);
        } else if (dbUploads) {
          dbUploads.forEach((row) => uIds.add(row.id));
        }
      }

      // 2. Read user-scoped local storage
      const keys = await AsyncStorage.getAllKeys();
      const savedPrefix = 'saved_template_' + userKey + '_';
      const uploadPrefix = 'my_upload_' + userKey + '_';

      for (const key of keys) {
        if (key.startsWith(savedPrefix)) {
          const val = await AsyncStorage.getItem(key);
          if (val === 'true') sIds.add(key.replace(savedPrefix, ''));
        } else if (key.startsWith(uploadPrefix)) {
          const val = await AsyncStorage.getItem(key);
          if (val === 'true') uIds.add(key.replace(uploadPrefix, ''));
        }
      }

      setSavedTemplateIds(Array.from(sIds));
      setUploadedTemplateIds(Array.from(uIds));
    } catch (err) {
      console.warn('Failed to load user collections:', err);
    }
  };

  useEffect(() => {
    loadUserCollections();
  }, [user?.id]);

  const handleRefresh = async () => {
    await refresh();
    await loadUserCollections();
  };

  const handleTemplatePress = (id: string) => {
    router.push({
      pathname: '/detail',
      params: { id },
    });
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your studio account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSavedTemplateIds([]);
          setUploadedTemplateIds([]);
          await signOut();
        },
      },
    ]);
  };

  const savedTemplates = user ? templates.filter((t) => savedTemplateIds.includes(t.id)) : [];
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

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push('/modal')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Feather name="settings" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {user ? 'My Studio' : 'Guest Explorer'}
        </Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={user ? handleSignOut : () => router.push('/auth')}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Sign out' : 'Sign in'}
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
          /* Authenticated My Studio Card */
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
            <Text style={styles.profileRole}>{userEmail}</Text>

            {/* Action Buttons Row */}
            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={[styles.profileActionBtn, styles.profileCreateBtn]}
                onPress={() => setIsUploadModalVisible(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color={Colors.background} />
                <Text style={styles.profileCreateText}>Create Guide</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileActionBtn}
                onPress={handleShareProfile}
                activeOpacity={0.8}
              >
                <Feather name="share-2" size={13} color={Colors.textPrimary} />
                <Text style={styles.profileActionText}>Share Studio</Text>
              </TouchableOpacity>
            </View>

            {/* Studio Stats & Interactive Tab Switcher */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[
                  styles.statCard,
                  activeTab === 'saved' && styles.statCardActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('saved')}
              >
                <Text
                  style={[
                    styles.statNumber,
                    activeTab === 'saved' && styles.statNumberActive,
                  ]}
                >
                  {savedTemplates.length}
                </Text>
                <View style={styles.statLabelRow}>
                  <Ionicons
                    name="bookmark"
                    size={12}
                    color={activeTab === 'saved' ? Colors.primaryDark : Colors.textMuted}
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
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  activeTab === 'uploads' && styles.statCardActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setActiveTab('uploads')}
              >
                <Text
                  style={[
                    styles.statNumber,
                    activeTab === 'uploads' && styles.statNumberActive,
                  ]}
                >
                  {uploadedTemplates.length}
                </Text>
                <View style={styles.statLabelRow}>
                  <Ionicons
                    name="cloud-upload"
                    size={12}
                    color={activeTab === 'uploads' ? Colors.primaryDark : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.statLabel,
                      activeTab === 'uploads' && styles.statLabelActive,
                    ]}
                  >
                    My Uploads
                  </Text>
                </View>
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
            >
              <Feather name="log-in" size={16} color={Colors.background} style={{ marginRight: 8 }} />
              <Text style={styles.guestSignInText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dynamic Grid Display for Authenticated Users */}
        {user ? (
          displayedTemplates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'saved' ? 'bookmark-outline' : 'cloud-upload-outline'}
                size={44}
                color={Colors.primaryDark}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'saved' ? 'No Saved Poses Yet' : 'No Uploaded Poses Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'saved'
                  ? 'Tap the bookmark icon on any guide in the Home feed to save it to your studio collection.'
                  : 'Tap "+ Upload Pose" on Home to publish your custom composition guides!'}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {displayedTemplates.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({ pathname: '/detail', params: { id: item.id } })
                  }
                >
                  <Image
                    source={item.imageSource}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                  <View style={styles.cardScrim} />
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
          loadUserCollections();
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
    paddingHorizontal: 18,
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
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
  profileRole: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
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
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  statCardActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  statNumberActive: {
    color: Colors.primaryDark,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  statLabelActive: {
    color: Colors.primaryDark,
    fontFamily: Fonts.bold,
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  tabBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: COLUMN_WIDTH,
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
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.3)',
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
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textLight,
  },
  cardMeta: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.primarySoft,
    marginTop: 2,
  },
});
