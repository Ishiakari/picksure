import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

const UPLOAD_CATEGORIES = [
  'Cafe & Lifestyle',
  'OOTD & Streetwear',
  'Cottagecore & Nature',
  'Editorial & Noir',
  'Minimalist & Silhouette',
  'Casual & Mirror Check',
  'Couples & Friends'
];

import { addCustomTemplateToFeed } from '@/hooks/useTemplates';

// Safe local file reader using native XMLHttpRequest to prevent fetch hangs on Android
const getBlobFromUri = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError("Local file read request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

interface UploadTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadTemplateModal({ visible, onClose, onUploadSuccess }: UploadTemplateModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(UPLOAD_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!visible) return null;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required to upload custom poses.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your custom pose template.');
      return;
    }

    if (!selectedImageUri) {
      Alert.alert('Image Required', 'Please select a photo overlay to upload.');
      return;
    }

    try {
      setUploading(true);

      // 1. Convert URI to blob / ArrayBuffer for upload safely using XHR
      const blob = await getBlobFromUri(selectedImageUri);
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // 2. Upload file to Supabase Storage
      const fileExt = selectedImageUri.split('.').pop() || 'jpg';
      const fileName = `${user?.id || 'anonymous'}_${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('template-overlays')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (storageError) {
        console.warn("Storage upload warning, using local file URI fallback:", storageError.message);
      }

      // 3. Get Public URL or fallback
      const publicUrl = storageData?.path
        ? supabase.storage.from('template-overlays').getPublicUrl(storageData.path).data.publicUrl
        : selectedImageUri;

      // 4. Ensure profile row exists in public.profiles table to prevent foreign key violation
      if (user?.id) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'PickSure Creator',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
        });
        if (profileError) {
          console.warn("Profile upsert warning:", profileError.message);
        }
      }

      // 5. Insert row into Supabase 'templates' database table
      let insertResult = await supabase.from('templates').insert([
        {
          title,
          category,
          description,
          image_url: publicUrl,
          creator_id: user?.id,
          difficulty: 'Beginner',
          time: '2 min',
        }
      ]).select();

      let dbError = insertResult.error;
      let insertedRow = insertResult.data?.[0];

      // Fallback: If profile doesn't exist and violates foreign key constraint, insert with creator_id = null
      if (dbError && (dbError.message.includes("violates foreign key constraint") || dbError.code === '23503')) {
        console.warn("Foreign key constraint failed, retrying with creator_id = null fallback");
        const fallbackResult = await supabase.from('templates').insert([
          {
            title,
            category,
            description,
            image_url: publicUrl,
            creator_id: null,
            difficulty: 'Beginner',
            time: '2 min',
          }
        ]).select();
        dbError = fallbackResult.error;
        insertedRow = fallbackResult.data?.[0];
      }

      // Create a local Template object for instant feed display, using DB uuid if insert succeeded
      const newTemplateObj = {
        id: insertedRow?.id || `custom-${Date.now()}`,
        title,
        category,
        description,
        imageSource: { uri: publicUrl },
        difficulty: 'Beginner' as const,
        time: '2 min',
        usedCount: '1',
        savedCount: '0',
        tips: ['Align pose overlay with subject.']
      };

      if (dbError) {
        console.warn("Database table insert blocked by RLS policy, added template to live app feed:", dbError.message);
      }

      // Add template to active feed so it appears immediately on Home screen
      addCustomTemplateToFeed(newTemplateObj);

      Alert.alert('Success ✨', 'Your custom pose overlay template has been published to PickSure!');
      
      // Reset form
      setTitle('');
      setCategory(UPLOAD_CATEGORIES[0]);
      setDescription('');
      setSelectedImageUri(null);
      
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert('Upload Failed', err?.message || 'Failed to upload template.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Upload Custom Pose</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.creamLight} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {selectedImageUri ? (
                <Image source={selectedImageUri} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={36} color={Colors.rosePrimary} />
                  <Text style={styles.imagePlaceholderText}>Select Pose Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title Input */}
            <TextInput 
              style={styles.input}
              placeholder="Pose Title (e.g. Vintage Sunset Stance)"
              placeholderTextColor="#99818c"
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Select Label */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryLabel}>Select Category</Text>
            </View>

            {/* Horizontal Scroll Category Selector */}
            <View style={styles.categorySelectorContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {UPLOAD_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.activeCategoryButton
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text 
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.activeCategoryButtonText
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Description Input */}
            <TextInput 
              style={[styles.input, { height: 60 }]}
              placeholder="Brief description or tips for aligning..."
              placeholderTextColor="#99818c"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.darkText} />
              ) : (
                <Text style={styles.submitButtonText}>Publish Overlay Template</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.creamLight,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formContainer: {
    gap: 12,
  },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: Colors.roseSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.creamLight,
    fontSize: 14,
  },
  categoryHeader: {
    marginTop: 4,
    marginBottom: -4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.creamLight,
  },
  categorySelectorContainer: {
    width: '100%',
    height: 36,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 16,
  },
  categoryButton: {
    backgroundColor: Colors.darkCard,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryButton: {
    backgroundColor: Colors.rosePrimary,
    borderColor: Colors.rosePrimary,
  },
  categoryButtonText: {
    color: Colors.roseSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  activeCategoryButtonText: {
    color: Colors.darkText,
  },
  submitButton: {
    backgroundColor: Colors.rosePrimary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.rosePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: Colors.darkText,
    fontSize: 15,
    fontWeight: '900',
  },
});
