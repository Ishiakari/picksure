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
import { TEMPLATES, Template } from '@/src/data/templates';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const CATEGORIES = ['All', 'Portrait', 'OOTD', 'Street', 'Golden Hour', 'Minimal', 'Editorial'];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Filter templates based on category selection
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'All' || 
      (selectedCategory === 'Portrait' && (template.category === 'Cafe Vibes' || template.category === 'Editorial')) ||
      template.category.toLowerCase().includes(selectedCategory.toLowerCase());
      
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.category.toLowerCase().includes(searchQuery.toLowerCase());
                          
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
    // Custom aspect ratios to simulate Figma's height variations
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
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header Section */}
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search templates..."
              placeholderTextColor="#7a7a7a"
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
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.headerTitle}>PICKSURE</Text>
              <Text style={styles.headerSubtitle}>Pick your vibe. Be sure of your shot.</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearchActive(true)}>
                <Ionicons name="search-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="person-outline" size={24} color="#FFF" />
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

      {/* Masonry / Grid Templates Feed */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7a7a7a',
    marginTop: 4,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 4,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
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
    borderColor: '#262626',
    backgroundColor: '#181818',
  },
  categoryPillActive: {
    backgroundColor: '#FF5C35',
    borderColor: '#FF5C35',
  },
  categoryText: {
    color: '#a3a3a3',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#FFF',
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
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  tagContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF5C35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFF',
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
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardMeta: {
    color: '#8c8c8c',
    fontSize: 11,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF5C35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5C35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

