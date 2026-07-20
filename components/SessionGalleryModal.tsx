import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

interface SessionGalleryModalProps {
  visible: boolean;
  photos: string[];
  onClose: () => void;
}

export default function SessionGalleryModal({ visible, photos, onClose }: SessionGalleryModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <>
      {/* Gallery List Modal Overlay */}
      <View style={styles.galleryModal}>
        <SafeAreaView style={styles.gallerySafeArea}>
          {/* Header */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={onClose}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>Session Gallery</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Photos List */}
          {photos.length === 0 ? (
            <View style={styles.emptyGalleryContainer}>
              <Ionicons name="images-outline" size={48} color="#444" />
              <Text style={styles.emptyGalleryText}>No photos captured in this session yet.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.galleryGrid}>
              {photos.map((uri, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.galleryCard}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPhoto(uri)}
                >
                  <Image source={uri} style={styles.galleryImage} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>

      {/* Full Screen Photo Viewer */}
      {selectedPhoto && (
        <View style={styles.fullScreenViewer}>
          <SafeAreaView style={styles.fullScreenSafeArea}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.galleryTitle}>Photo Preview</Text>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.fullScreenImageContainer}>
              <Image source={selectedPhoto} style={styles.fullScreenImage} contentFit="contain" />
            </View>
          </SafeAreaView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  galleryModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 1000,
  },
  gallerySafeArea: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyGalleryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyGalleryText: {
    color: '#7a7a7a',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  galleryCard: {
    width: (width - 24) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenViewer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1100,
  },
  fullScreenSafeArea: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
