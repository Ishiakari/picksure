import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line as SvgLine, Circle as SvgCircle, Rect as SvgRect } from 'react-native-svg';
import { useTemplates } from '@/hooks/useTemplates';

const { width } = Dimensions.get('window');

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates } = useTemplates();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const template = templates.find(t => t.id === id);

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

  const handleUseFrame = () => {
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
          />
          <View style={styles.heroOverlay} />
          
          {/* Header Controls (Overlayed on image) */}
          <SafeAreaView style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => setIsBookmarked(!isBookmarked)}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={isBookmarked ? "#FF5C35" : "#FFF"} 
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

          <Text style={styles.description}>{template.description}</Text>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color="#FF5C35" />
              <Text style={styles.statValue}>{template.usedCount}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={20} color="#FF5C35" />
              <Text style={styles.statValue}>{template.savedCount}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="ribbon-outline" size={20} color="#FF5C35" />
              <Text style={styles.statValue}>{template.difficulty}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>

          {/* Director's Guide */}
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={20} color="#FF5C35" />
            <Text style={styles.sectionTitle}>DIRECTOR'S GUIDE</Text>
          </View>
          
          <View style={styles.tipsList}>
            {template.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
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

      {/* Floating Call to Action */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity 
          style={styles.ctaButton} 
          activeOpacity={0.8}
          onPress={handleUseFrame}
        >
          <Ionicons name="camera" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>Use This Frame</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF5C35',
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  heroContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 18, 18, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FF5C35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#a3a3a3',
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#c4c4c4',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '400',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#262626',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#7a7a7a',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#262626',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  tipsList: {
    marginBottom: 30,
    gap: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    backgroundColor: '#FF5C35',
    borderRadius: 2,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    color: '#d4d4d4',
    fontSize: 14,
    lineHeight: 20,
  },
  previewContainer: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 16,
    aspectRatio: 3 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  svgWrapper: {
    width: '100%',
    height: '100%',
    aspectRatio: 3 / 4,
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF5C35',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
