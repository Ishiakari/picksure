import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line as SvgLine } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTemplates, updateTemplateStatsInFeed } from '@/hooks/useTemplates';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

function parseCountString(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  if (str.endsWith('k')) {
    return Math.round(parseFloat(str.replace('k', '')) * 1000);
  }
  if (str.endsWith('m')) {
    return Math.round(parseFloat(str.replace('m', '')) * 1000000);
  }
  return parseInt(str, 10) || 0;
}

function formatCountNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates } = useTemplates();
  const { user } = useAuth();
  
  const template = templates.find(t => t.id === id);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [usedCount, setUsedCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    if (template) {
      const baseSaved = parseCountString(template.savedCount);
      const baseUsed = parseCountString(template.usedCount);
      const userKey = user?.id || 'guest';
      
      (async () => {
        try {
          // Read local count overrides first for instant rendering
          const localUsedStr = await AsyncStorage.getItem(`used_count_val_${template.id}`);
          const localSavedStr = await AsyncStorage.getItem(`saved_count_val_${template.id}`);

          let currentSaved = localSavedStr !== null ? parseInt(localSavedStr, 10) : baseSaved;
          let currentUsed = localUsedStr !== null ? parseInt(localUsedStr, 10) : baseUsed;

          // 1. Fetch exact total saved count from Supabase saved_templates table
          const { count: realSavedCount } = await supabase
            .from('saved_templates')
            .select('id', { count: 'exact', head: true })
            .eq('template_id', template.id);

          if (realSavedCount !== null && realSavedCount !== undefined && realSavedCount > 0) {
            currentSaved = realSavedCount;
          }

          // 2. Fetch used_count and saved_count fallback from Supabase templates table
          const { data: tmplData } = await supabase
            .from('templates')
            .select('saved_count, used_count')
            .eq('id', template.id)
            .maybeSingle();

          if (tmplData) {
            if (tmplData.used_count !== undefined && tmplData.used_count !== null && tmplData.used_count > 0) {
              currentUsed = tmplData.used_count;
            }
            if ((realSavedCount === null || realSavedCount === 0) && tmplData.saved_count) {
              currentSaved = tmplData.saved_count;
            }
          }

          if (isMounted) {
            setSavedCount(currentSaved);
            setUsedCount(currentUsed);
          }

          // 3. Check if user previously saved this template locally or in Supabase saved_templates table
          const val = await AsyncStorage.getItem(`saved_template_${userKey}_${template.id}`);
          if (val === 'true') {
            if (isMounted) setIsBookmarked(true);
          } else if (user?.id) {
            const { data } = await supabase.from('saved_templates')
              .select('id')
              .eq('user_id', user.id)
              .eq('template_id', template.id);
            if (data && data.length > 0) {
              if (isMounted) setIsBookmarked(true);
              await AsyncStorage.setItem(`saved_template_${userKey}_${template.id}`, 'true');
            }
          }
        } catch (err) {
          console.warn("Live counters fetch warning:", err);
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [template?.id, user?.id]);

  if (!template) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Template not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggleBookmark = async () => {
    if (!template) return;

    const userKey = user?.id || 'guest';
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    const newCount = nextState ? savedCount + 1 : Math.max(0, savedCount - 1);
    setSavedCount(newCount);

    try {
      // Persist local numeric count and state
      await AsyncStorage.setItem(`saved_count_val_${template.id}`, String(newCount));

      if (nextState) {
        await AsyncStorage.setItem(`saved_template_${userKey}_${template.id}`, 'true');
      } else {
        await AsyncStorage.removeItem(`saved_template_${userKey}_${template.id}`);
      }

      // Sync with Supabase saved_templates table (DB triggers handle atomic saved_count sync on templates)
      if (user?.id) {
        if (nextState) {
          const { error: sErr } = await supabase.from('saved_templates').upsert([
            { user_id: user.id, template_id: template.id }
          ], { onConflict: 'user_id,template_id' });
          if (sErr) console.warn("saved_templates upsert warning:", sErr.message);
        } else {
          const { error: sErr } = await supabase.from('saved_templates')
            .delete()
            .eq('user_id', user.id)
            .eq('template_id', template.id);
          if (sErr) console.warn("saved_templates delete warning:", sErr.message);
        }
      }

      // Synchronize changes with active in-memory feed cache
      updateTemplateStatsInFeed(template.id, newCount, usedCount);
    } catch (err) {
      console.warn("Bookmark sync error:", err);
    }
  };

  const handleUseFrame = async () => {
    const nextUsed = usedCount + 1;
    setUsedCount(nextUsed);

    try {
      // Persist local numeric count
      await AsyncStorage.setItem(`used_count_val_${template.id}`, String(nextUsed));

      // Atomic increment at database level via RPC function
      const { data: rpcCount, error: rpcErr } = await supabase.rpc('increment_template_usage', {
        target_template_id: template.id
      });

      if (rpcErr) {
        console.warn("increment_template_usage RPC warning:", rpcErr.message);
      } else if (rpcCount !== null && rpcCount !== undefined) {
        setUsedCount(Number(rpcCount));
      }

      // Synchronize changes with active feed cache
      updateTemplateStatsInFeed(template.id, savedCount, nextUsed);
    } catch (err) {
      console.warn("Used count update error:", err);
    }

    // Launch camera with overlay
    router.push({
      pathname: '/camera',
      params: { id: template.id }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image Container */}
        <View style={styles.heroContainer}>
          <Image 
            source={template.imageSource} 
            style={styles.heroImage} 
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.heroOverlay} />
          
          {/* Header Controls (Overlayed on image) */}
          <SafeAreaView style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.creamLight} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={handleToggleBookmark}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={isBookmarked ? Colors.rosePrimary : Colors.creamLight} 
              />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Category Floating Tag */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{template.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.title}>{template.title}</Text>
          
          {/* Difficulty & Time */}
          <Text style={styles.subtitle}>
            {template.difficulty}  ·  ~{template.time} setup
          </Text>

          {template.description ? (
            <Text style={styles.description}>{template.description}</Text>
          ) : null}

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color={Colors.rosePrimary} />
              <Text style={styles.statNumber}>{formatCountNumber(usedCount)}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            
            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={20} color={Colors.rosePrimary} />
              <Text style={styles.statNumber}>{formatCountNumber(savedCount)}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            
            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="ribbon-outline" size={20} color={Colors.rosePrimary} />
              <Text style={styles.statNumber}>{template.difficulty}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>

          {/* Director's Guide Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={18} color={Colors.rosePrimary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>DIRECTOR'S GUIDE</Text>
          </View>
          
          <View style={styles.tipsList}>
            {template.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Overlay Preview */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OVERLAY PREVIEW</Text>
          </View>

          <View style={styles.previewContainer}>
            {/* The SVG grid + wireframe photo preview */}
            <View style={styles.svgWrapper}>
              <Image 
                source={template.imageSource}
                style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
                {/* 3x3 Grid Lines */}
                <SvgLine x1="33.3" y1="0" x2="33.3" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <SvgLine x1="66.6" y1="0" x2="66.6" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <SvgLine x1="0" y1="33.3" x2="100" y2="33.3" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <SvgLine x1="0" y1="66.6" x2="100" y2="66.6" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </Svg>
            </View>
          </View>
        </View>

        {/* Space for fixed CTA button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action CTA Button */}
      <View style={styles.bottomDock}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleUseFrame}>
          <Ionicons name="camera" size={20} color={Colors.darkText} style={{ marginRight: 8 }} />
          <Text style={styles.ctaButtonText}>Use This Frame</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.creamLight,
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.rosePrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: Colors.darkText,
    fontWeight: '800',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    width: width,
    height: width * 1.1,
    position: 'relative',
    backgroundColor: Colors.darkCard,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  headerControls: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(25, 25, 25, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: Colors.rosePrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryTagText: {
    color: Colors.darkText,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  content: {
    padding: 20,
    marginTop: -10,
    backgroundColor: Colors.darkBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    color: Colors.creamLight,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.roseSoft,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  description: {
    color: '#D0C4C9',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.creamLight,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    color: Colors.roseSoft,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.roseSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  tipsList: {
    gap: 10,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.rosePrimary,
    marginTop: 7,
    marginRight: 10,
  },
  tipText: {
    color: Colors.creamLight,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  svgWrapper: {
    flex: 1,
    position: 'relative',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(25, 25, 25, 0.92)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.rosePrimary,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.rosePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: Colors.darkText,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
