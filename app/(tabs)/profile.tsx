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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/src/data/templates';
import { Colors } from '@/constants/theme';
import AuthModal from '@/components/AuthModal';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { templates, refresh, refreshing } = useTemplates();

  const [activeTab, setActiveTab] = useState<'saved' | 'uploads'>('saved');
  const [savedTemplateIds, setSavedTemplateIds] = useState<string[]>([]);
  const [uploadedTemplateIds, setUploadedTemplateIds] = useState<string[]>([]);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Load user-scoped saved & uploaded template IDs
  const loadCollections = async () => {
    try {
      setLoadingSaved(true);
      const userKey = user?.id || 'guest';
      
      const sIds = new Set<string>();
      const uIds = new Set<string>();

      // 1. Fetch remote saved & uploaded templates from Supabase if logged in
      if (user?.id) {
        const { data: dbSaved } = await supabase.from('saved_templates')
          .select('template_id')
          .eq('user_id', user.id);
        if (dbSaved) {
          dbSaved.forEach(row => sIds.add(row.template_id));
        }

        const { data: dbUploads } = await supabase.from('templates')
          .select('id')
          .eq('creator_id', user.id);
        if (dbUploads) {
          dbUploads.forEach(row => uIds.add(row.id));
        }
      }

      // 2. Read user-scoped local keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const savedPrefix = `saved_template_${userKey}_`;
      const uploadPrefix = `my_upload_${userKey}_`;

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
      console.warn("Failed to load user collections:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [user?.id]);

  const handleRefresh = async () => {
    await refresh();
    await loadCollections();
  };

  // User-scoped template filters
  const savedTemplates = user ? templates.filter(t => savedTemplateIds.includes(t.id)) : [];
  const uploadedTemplates = user ? templates.filter(t => 
    uploadedTemplateIds.includes(t.id) || 
    (t as any).creator_id === user.id
  ) : [];

  const displayedTemplates = activeTab === 'saved' ? savedTemplates : uploadedTemplates;

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of PickSure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
          } 
        }
      ]
    );
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'PickSure User';
  const userAvatar = user?.user_metadata?.avatar_url || null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.creamLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Collection</Text>
        {user ? (
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.rosePrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.rosePrimary}
            colors={[Colors.rosePrimary]}
          />
        }
      >
        {/* Profile Card Section */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.editAvatarBadge}
                onPress={() => setIsAuthModalVisible(true)}
              >
                <Ionicons name="camera" size={14} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>

            {/* User Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{savedTemplates.length}</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{uploadedTemplates.length}</Text>
                <Text style={styles.statLabel}>Uploaded</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>Creator</Text>
                <Text style={styles.statLabel}>Badge</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconContainer}>
              <Ionicons name="person-circle-outline" size={64} color={Colors.rosePrimary} />
            </View>
            <Text style={styles.guestTitle}>Sign in to PickSure</Text>
            <Text style={styles.guestSubtitle}>
              Save your favorite pose templates, upload custom overlays, and sync across your devices.
            </Text>
            <TouchableOpacity 
              style={styles.primaryAuthButton}
              onPress={() => setIsAuthModalVisible(true)}
            >
              <Text style={styles.primaryAuthButtonText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Collection Tab Selector */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity 
            style={[styles.segmentPill, activeTab === 'saved' && styles.segmentPillActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons 
              name="bookmark" 
              size={16} 
              color={activeTab === 'saved' ? Colors.darkText : Colors.roseSoft} 
            />
            <Text style={[styles.segmentText, activeTab === 'saved' && styles.segmentTextActive]}>
              Saved ({savedTemplates.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentPill, activeTab === 'uploads' && styles.segmentPillActive]}
            onPress={() => setActiveTab('uploads')}
          >
            <Ionicons 
              name="cloud-upload" 
              size={16} 
              color={activeTab === 'uploads' ? Colors.darkText : Colors.roseSoft} 
            />
            <Text style={[styles.segmentText, activeTab === 'uploads' && styles.segmentTextActive]}>
              My Uploads ({uploadedTemplates.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Templates Grid View */}
        {displayedTemplates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'saved' ? "bookmark-outline" : "cloud-upload-outline"} 
              size={48} 
              color={Colors.roseSoft} 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'saved' ? 'No Saved Poses Yet' : 'No Uploaded Poses Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'saved' 
                ? 'Tap the bookmark icon on any pose template to add it to your collection.'
                : 'Tap "+ Upload Pose" on the Home screen to publish your custom pose overlays!'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displayedTemplates.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/detail', params: { id: item.id } })}
              >
                <Image 
                  source={item.imageSource} 
                  style={styles.cardImage} 
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
                <View style={styles.cardGradientOverlay} />
                <View style={styles.tagContainer}>
                  <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.difficulty} · {item.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Auth Modal */}
      <AuthModal 
        visible={isAuthModalVisible} 
        onClose={() => setIsAuthModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    color: Colors.creamLight,
    fontSize: 17,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.rosePrimary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.rosePrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: Colors.darkText,
    fontSize: 32,
    fontWeight: '900',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.rosePrimary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.darkCard,
  },
  profileName: {
    color: Colors.creamLight,
    fontSize: 20,
    fontWeight: '800',
  },
  profileEmail: {
    color: Colors.roseSoft,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.rosePrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.roseSoft,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  guestCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  guestIconContainer: {
    marginBottom: 12,
  },
  guestTitle: {
    color: Colors.creamLight,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  guestSubtitle: {
    color: Colors.roseSoft,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  primaryAuthButton: {
    backgroundColor: Colors.rosePrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryAuthButtonText: {
    color: Colors.darkText,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  segmentPillActive: {
    backgroundColor: Colors.rosePrimary,
  },
  segmentText: {
    color: Colors.roseSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: Colors.darkText,
    fontWeight: '900',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.creamLight,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: Colors.roseSoft,
    fontSize: 13,
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
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.darkCard,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tagContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(25, 25, 25, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    color: Colors.rosePrimary,
    fontSize: 9,
    fontWeight: '900',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  cardTitle: {
    color: Colors.creamLight,
    fontSize: 13,
    fontWeight: '800',
  },
  cardMeta: {
    color: Colors.roseSoft,
    fontSize: 11,
    marginTop: 2,
  },
});
