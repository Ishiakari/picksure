import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Template } from '@/src/data/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { Colors } from '@/constants/theme';
import PickSureLogo from '@/components/PickSureLogo';
import AuthModal from '@/components/AuthModal';
import UploadTemplateModal from '@/components/UploadTemplateModal';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  'All', 
  'Cafe & Lifestyle', 
  'OOTD & Streetwear', 
  'Cottagecore & Nature', 
  'Editorial & Noir', 
  'Minimalist & Silhouette', 
  'Casual & Mirror Check', 
  'Couples & Friends'
];

export default function HomeScreen() {
  const { templates } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  // Filter templates based on category selection
  const filteredTemplates = templates.filter(template => {
    const templateCategory = template.category || '';
    const templateTitle = template.title || '';

    const matchesCategory = selectedCategory === 'All' || 
      templateCategory.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      
    const matchesSearch = templateTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          templateCategory.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesCategory && matchesSearch;
  });

  // Distribute templates into two columns to simulate masonry layout
  const leftColTemplates: Template[] = [];
  const rightColTemplates: Template[] = [];
  
  filteredTemplates.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColTemplates.push(item);
    } else {
      rightColTemplates.push(item);
    }
  });

  const handleTemplatePress = (id: string) => {
    router.push({
      pathname: '/detail',
      params: { id }
    });
  };

  const handleFloatingCameraPress = () => {
    // Open camera without any specific template
    router.push({
      pathname: '/camera',
    });
  };

  const renderCard = (item: Template) => {
    // Custom aspect ratios to simulate height variations
    let cardHeight = 220;
    if (item.id === 'cafe-01') cardHeight = 240;
    if (item.id === 'ootd-01') cardHeight = 220;
    if (item.id === 'street-01') cardHeight = 260;
    if (item.id === 'golden-01') cardHeight = 240;
    if (item.id === 'minimal-01') cardHeight = 180;
    if (item.id === 'editorial-01') cardHeight = 260;

    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.card, { height: cardHeight }]}
        activeOpacity={0.9}
        onPress={() => handleTemplatePress(item.id)}
      >
        <Image 
          source={item.imageSource} 
          style={styles.cardImage} 
          contentFit="cover"
          transition={200}
        />
        <View style={styles.cardGradientOverlay} />
        
        {/* Category Tag */}
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
        </View>

        {/* Text Details at the Bottom */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.difficulty} · {item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBackground} />
      
      {/* Header Section */}
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search templates..."
              placeholderTextColor="#99818c"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={20} color={Colors.creamLight} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.brandContainer}>
              <PickSureLogo size={42} showText={false} color={Colors.rosePrimary} />
              <View style={styles.brandTitleContainer}>
                <Text style={styles.headerTitle}>PICKSURE</Text>
                <Text style={styles.headerSubtitle}>Pick your vibe. Be sure of your shot.</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearchActive(true)}>
                <Ionicons name="search-outline" size={22} color={Colors.creamLight} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => setIsAuthModalVisible(true)}>
                <Ionicons name="person-outline" size={22} color={Colors.creamLight} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Category Horizontal Filter */}
      <View style={{ height: 50, marginBottom: 8 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Masonry / Grid Templates Feed Feed */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedScroll}
      >
        <View style={styles.gridContainer}>
          {/* Left Column */}
          <View style={styles.gridColumn}>
            {leftColTemplates.map(item => renderCard(item))}
          </View>
          
          {/* Right Column */}
          <View style={styles.gridColumn}>
            {rightColTemplates.map(item => renderCard(item))}
          </View>
        </View>
        
        {/* Spacer for floating action button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Shutter Button */}
      <TouchableOpacity 
        style={styles.floatingButton} 
        activeOpacity={0.8}
        onPress={handleFloatingCameraPress}
      >
        <Ionicons name="camera" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Google Authentication & User Profile Modal */}
      <AuthModal 
        visible={isAuthModalVisible} 
        onClose={() => setIsAuthModalVisible(false)} 
        onOpenUploadModal={() => setIsUploadModalVisible(true)}
      />

      {/* Upload Custom Pose Template Modal */}
      <UploadTemplateModal 
        visible={isUploadModalVisible} 
        onClose={() => setIsUploadModalVisible(false)} 
        onUploadSuccess={() => {
          // Templates list will update automatically
        }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.creamLight,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.roseSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 4,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.rosePrimary,
  },
  searchInput: {
    flex: 1,
    color: Colors.creamLight,
    fontSize: 15,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.darkCard,
  },
  categoryPillActive: {
    backgroundColor: Colors.rosePrimary,
    borderColor: Colors.rosePrimary,
  },
  categoryText: {
    color: '#b89fa9',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: Colors.darkText,
    fontWeight: '800',
  },
  feedScroll: {
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: COLUMN_WIDTH,
    gap: 16,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.darkCard,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 17, 20, 0.35)',
  },
  tagContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.rosePrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: Colors.darkText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    color: Colors.creamLight,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardMeta: {
    color: Colors.roseSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.rosePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.rosePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});;

