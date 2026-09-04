import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';
import { addCustomTemplateToFeed } from '@/hooks/useTemplates';
import { Template } from '@/src/data/templates';
import { CATEGORIES, CategoryType } from '@/src/constants/categories';

const { width } = Dimensions.get('window');
const UPLOAD_CATEGORIES = CATEGORIES;

const DIFFICULTIES: Array<'Beginner' | 'Intermediate' | 'Advanced'> = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

const STEPS = [
  { id: 1, title: 'Select Image' },
  { id: 2, title: 'Outline & Crop' },
  { id: 3, title: 'Set Category' },
  { id: 4, title: 'Director Tips' },
  { id: 5, title: 'Review & Publish' },
];

const DRAFT_STORAGE_KEY = 'picksure_guide_draft_data';

const getBlobFromUri = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
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
  
  // Step state
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>(UPLOAD_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [description, setDescription] = useState('');
  const [guideInstructions, setGuideInstructions] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'3:4 RATIO' | '4:5 RATIO' | '1:1 RATIO' | '9:16 RATIO'>('3:4 RATIO');
  const [uploading, setUploading] = useState(false);

  // Guest auth bottom sheet gate
  const [showGuestGate, setShowGuestGate] = useState(false);

  const getDraftKey = () => `picksure_guide_draft_${user?.id || 'guest'}`;

  // Load draft on mount / opening
  useEffect(() => {
    if (visible) {
      loadSavedDraft();
    }
  }, [visible, user?.id]);

  const loadSavedDraft = async () => {
    try {
      const saved = await AsyncStorage.getItem(getDraftKey());
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.category) setCategory(draft.category);
        if (draft.difficulty) setDifficulty(draft.difficulty);
        if (draft.description) setDescription(draft.description);
        if (draft.guideInstructions) setGuideInstructions(draft.guideInstructions);
        if (draft.selectedImageUri) setSelectedImageUri(draft.selectedImageUri);
        if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      }
    } catch (e) {
      console.warn("Error loading draft:", e);
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        title,
        category,
        difficulty,
        description,
        guideInstructions,
        selectedImageUri,
        aspectRatio,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    } catch (e) {
      console.warn("Error saving draft:", e);
    }
  };

  const hasFormContent = () => {
    return Boolean(
      title.trim() ||
      description.trim() ||
      guideInstructions.trim() ||
      selectedImageUri
    );
  };

  const handleSaveDraftAndExit = async () => {
    if (!hasFormContent()) {
      onClose();
      return;
    }
    await saveDraft();
    Alert.alert('Draft Saved ✨', 'Your guide progress has been saved locally.', [
      { text: 'OK', onPress: onClose }
    ]);
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(getDraftKey());
    } catch (e) {
      console.warn("Error clearing draft:", e);
    }
  };

  if (!visible) return null;

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access photo library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      
      // Auto-detect native aspect ratio
      if (asset.width && asset.height) {
        const r = asset.width / asset.height;
        if (Math.abs(r - 1) < 0.12) {
          setAspectRatio('1:1 RATIO');
        } else if (Math.abs(r - (3 / 4)) < 0.12) {
          setAspectRatio('3:4 RATIO');
        } else if (Math.abs(r - (4 / 5)) < 0.12) {
          setAspectRatio('4:5 RATIO');
        } else if (Math.abs(r - (9 / 16)) < 0.15) {
          setAspectRatio('9:16 RATIO');
        }
      }
      setCurrentStep(2);
    }
  };

  const capturePhotoFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);

      if (asset.width && asset.height) {
        const r = asset.width / asset.height;
        if (Math.abs(r - 1) < 0.12) {
          setAspectRatio('1:1 RATIO');
        } else if (Math.abs(r - (3 / 4)) < 0.12) {
          setAspectRatio('3:4 RATIO');
        } else if (Math.abs(r - (4 / 5)) < 0.12) {
          setAspectRatio('4:5 RATIO');
        } else if (Math.abs(r - (9 / 16)) < 0.15) {
          setAspectRatio('9:16 RATIO');
        }
      }
      setCurrentStep(2);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedImageUri) {
      Alert.alert('Photo Required', 'Please select a reference photo first.');
      return;
    }
    if (currentStep === 3 && !title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your pose guide.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalPublish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      handleSaveDraftAndExit();
    }
  };

  const handleFinalPublish = async () => {
    if (!selectedImageUri) {
      Alert.alert('Photo Required', 'Please pick a reference photo to proceed.');
      return;
    }

    const creatorId = user?.id || null;

    if (!creatorId) {
      setShowGuestGate(true);
      return;
    }

    const parsedTips = guideInstructions
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const trimmedDescription = description.trim();
    const tipsList = parsedTips.length > 0 
      ? parsedTips 
      : (trimmedDescription.length > 0 ? [trimmedDescription] : ['Align pose overlay with subject.']);

    try {
      setUploading(true);
      setShowGuestGate(false);

      // 1. Upload to Supabase Storage
      let publicUrl = '';
      const blob = await getBlobFromUri(selectedImageUri);
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const fileExt = selectedImageUri.split('.').pop() || 'jpg';
      const userId = creatorId || 'guest';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `templates/${userId}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('template-overlays')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      if (storageData?.path) {
        publicUrl = supabase.storage.from('template-overlays').getPublicUrl(storageData.path).data.publicUrl;
      }

      if (!publicUrl) {
        throw new Error('Failed to obtain public URL for uploaded photo.');
      }

      // 2. Insert into Supabase table
      const insertPayload = {
        title: title.trim(),
        category,
        description: trimmedDescription || 'Custom community composition guide.',
        tips: tipsList,
        image_url: publicUrl,
        creator_id: creatorId || null,
        difficulty,
        time_setup: '2 min',
        ratio: aspectRatio,
      };

      let insertedRow: any = null;
      let insertResult = await supabase.from('templates').insert([insertPayload]).select();
      let dbError = insertResult.error;
      insertedRow = insertResult.data?.[0];

      if (dbError && (dbError.message.includes("violates foreign key constraint") || dbError.code === '23503')) {
        const fallbackResult = await supabase.from('templates').insert([{
          ...insertPayload,
          creator_id: null,
        }]).select();
        if (fallbackResult.error) {
          throw new Error(`Database insert failed: ${fallbackResult.error.message}`);
        }
        insertedRow = fallbackResult.data?.[0];
      } else if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      if (!insertedRow) {
        throw new Error('Database insert did not return created row.');
      }

      // 3. Create local template object for feed rendering
      const newTemplateObj: Template & { creator_id?: string } = {
        id: insertedRow.id,
        title: title.trim(),
        category,
        description: trimmedDescription || 'Custom community composition guide.',
        imageSource: { uri: publicUrl },
        difficulty,
        time: '2 min',
        usedCount: '0',
        savedCount: '0',
        ratio: aspectRatio,
        tips: tipsList,
        creator_id: creatorId || undefined,
      };

      // 4. Save to user uploads
      try {
        const userKey = creatorId || 'guest';
        await AsyncStorage.setItem(`my_upload_${userKey}_${newTemplateObj.id}`, 'true');
      } catch (err) {
        console.warn(err);
      }

      // 5. Add to live feed state
      addCustomTemplateToFeed(newTemplateObj);
      await clearDraft();

      Alert.alert('Published ✨', 'Your custom pose guide has been created and synced to the studio feed!');
      
      // Reset state
      setTitle('');
      setCategory(UPLOAD_CATEGORIES[0]);
      setDifficulty('Beginner');
      setDescription('');
      setGuideInstructions('');
      setSelectedImageUri(null);
      setCurrentStep(1);

      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error("Upload failed:", err);
      Alert.alert('Publish Failed', err?.message || 'Failed to publish guide.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSaveDraftAndExit}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.modalContent} edges={['bottom']}>
          {/* Top Sheet Drag & Header */}
          <View style={styles.topHandleBar}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={currentStep === 1 ? 'Close and save draft' : 'Previous step'}
            >
              <Feather name={currentStep === 1 ? 'x' : 'arrow-left'} size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.modalTitle}>{STEPS[currentStep - 1].title}</Text>
              <Text style={styles.stepIndicatorText}>Step {currentStep} of {STEPS.length}</Text>
            </View>

            <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraftAndExit}>
              <Text style={styles.draftButtonText}>Save Draft</Text>
            </TouchableOpacity>
          </View>

          {/* Step Progress Dots */}
          <View style={styles.stepDotsRow}>
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              return (
                <View 
                  key={step.id} 
                  style={[
                    styles.stepDot,
                    isActive && styles.stepDotActive,
                    isCompleted && styles.stepDotCompleted,
                  ]} 
                />
              );
            })}
          </View>

          {/* Step Content */}
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: Select Image */}
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepSubtitle}>
                  Choose a reference photo overlay from your library or take a fresh shot with your camera.
                </Text>

                {selectedImageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} contentFit="cover" />
                    <View style={styles.imageChangeOverlay}>
                      <TouchableOpacity style={styles.changeImageBtn} onPress={pickImageFromGallery}>
                        <Feather name="refresh-cw" size={13} color={Colors.background} />
                        <Text style={styles.changeImageText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pickerCardsRow}>
                    <TouchableOpacity style={styles.pickerCard} activeOpacity={0.85} onPress={pickImageFromGallery}>
                      <View style={styles.pickerIconCircle}>
                        <Feather name="image" size={24} color={Colors.primaryDark} />
                      </View>
                      <Text style={styles.pickerCardTitle}>Photo Library</Text>
                      <Text style={styles.pickerCardSubtitle}>Select existing photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pickerCard} activeOpacity={0.85} onPress={capturePhotoFromCamera}>
                      <View style={styles.pickerIconCircle}>
                        <Feather name="camera" size={24} color={Colors.primaryDark} />
                      </View>
                      <Text style={styles.pickerCardTitle}>Take Photo</Text>
                      <Text style={styles.pickerCardSubtitle}>Capture in real-time</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* STEP 2: Outline & Crop */}
            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepSubtitle}>
                  Frame the subject aspect ratio and enable real-time ghost overlay trace.
                </Text>

                <View style={styles.outlinePreviewWrapper}>
                  {selectedImageUri && (
                    <Image source={{ uri: selectedImageUri }} style={styles.outlineImage} contentFit="cover" />
                  )}
                  <View style={styles.outlineOverlayMask}>
                    <View style={styles.outlineFrameBorder} />
                    <View style={styles.outlineBadge}>
                      <Ionicons name="scan-outline" size={13} color={Colors.primarySoft} />
                      <Text style={styles.outlineBadgeText}>Ghost Frame Enabled</Text>
                    </View>
                  </View>
                </View>

                {/* Aspect Ratio Selector */}
                <Text style={styles.fieldLabel}>ASPECT RATIO</Text>
                <View style={styles.aspectRatioRow}>
                  {(['3:4 RATIO', '4:5 RATIO', '1:1 RATIO', '9:16 RATIO'] as const).map((ratio) => (
                    <TouchableOpacity
                      key={ratio}
                      style={[
                        styles.ratioPill,
                        aspectRatio === ratio && styles.ratioPillActive,
                      ]}
                      onPress={() => setAspectRatio(ratio)}
                    >
                      <Text style={[styles.ratioPillText, aspectRatio === ratio && styles.ratioPillTextActive]}>
                        {ratio}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* STEP 3: Set Category & Title */}
            {currentStep === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepSubtitle}>
                  Give your composition guide a title and assign it to a curated lifestyle category.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>GUIDE TITLE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Vintage Sunset Stance"
                    placeholderTextColor={Colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CATEGORY</Text>
                  <View style={styles.categoryChipsGrid}>
                    {UPLOAD_CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                          onPress={() => setCategory(cat)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>DIFFICULTY LEVEL</Text>
                  <View style={styles.difficultyContainer}>
                    {DIFFICULTIES.map((diff) => (
                      <TouchableOpacity
                        key={diff}
                        style={[styles.difficultyButton, difficulty === diff && styles.activeDifficultyButton]}
                        onPress={() => setDifficulty(diff)}
                      >
                        <Text style={[styles.difficultyText, difficulty === diff && styles.activeDifficultyText]}>
                          {diff}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* STEP 4: Director Tips */}
            {currentStep === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepSubtitle}>
                  Provide concise camera direction notes (framing, angles, lighting) for creators following this guide.
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRowWithCount}>
                    <Text style={styles.fieldLabel}>DIRECTOR SHOOTING TIPS</Text>
                    <Text style={styles.charCountText}>{guideInstructions.length}/300</Text>
                  </View>
                  <TextInput 
                    style={[styles.input, styles.textAreaLarge]}
                    placeholder={"• Position camera at hip level\n• Let natural window light illuminate face\n• Relax shoulders at 45° angle"}
                    placeholderTextColor={Colors.textMuted}
                    value={guideInstructions}
                    onChangeText={(t) => setGuideInstructions(t.slice(0, 300))}
                    multiline
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRowWithCount}>
                    <Text style={styles.fieldLabel}>AESTHETIC DESCRIPTION</Text>
                    <Text style={styles.charCountText}>{description.length}/150</Text>
                  </View>
                  <TextInput 
                    style={[styles.input, styles.textAreaSmall]}
                    placeholder="Short summary of the vibe and mood..."
                    placeholderTextColor={Colors.textMuted}
                    value={description}
                    onChangeText={(t) => setDescription(t.slice(0, 150))}
                    multiline
                  />
                </View>
              </View>
            )}

            {/* STEP 5: Live Feed Card Review */}
            {currentStep === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepSubtitle}>
                  Here is how your custom guide will appear to curators on the PickSure feed.
                </Text>

                <View style={styles.previewCardContainer}>
                  <View style={styles.mockFeedCard}>
                    <View style={styles.mockImageContainer}>
                      {selectedImageUri && (
                        <Image source={{ uri: selectedImageUri }} style={styles.mockImage} contentFit="cover" />
                      )}
                      <View style={styles.mockCardScrim} />
                      
                      {/* Top-Left Category Badge */}
                      <View style={styles.mockCategoryBadge}>
                        <Text style={styles.mockCategoryText}>{category}</Text>
                      </View>

                      {/* Top-Right Ratio Badge */}
                      <View style={styles.mockRatioBadge}>
                        <Text style={styles.mockRatioText}>{aspectRatio}</Text>
                      </View>
                    </View>

                    <View style={styles.mockCardBody}>
                      <Text style={styles.mockCardTitle} numberOfLines={1}>{title || 'Untitled Pose'}</Text>
                      <Text style={styles.mockCardDesc} numberOfLines={2}>
                        {description || 'Effortless composition guide with real-time HUD alignment.'}
                      </Text>

                      <View style={styles.mockCardFooter}>
                        <View style={styles.mockStats}>
                          <View style={styles.mockStatItem}>
                            <Feather name="clock" size={11} color={Colors.textMuted} />
                            <Text style={styles.mockStatText}>2 min</Text>
                          </View>
                        </View>

                        <View style={styles.mockBookmark}>
                          <Ionicons name="bookmark-outline" size={14} color={Colors.textSecondary} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action CTA */}
          <View style={styles.footerCTAContainer}>
            {currentStep < 5 ? (
              <TouchableOpacity style={styles.primaryCTA} activeOpacity={0.88} onPress={handleNext}>
                <Text style={styles.primaryCTAText}>Continue</Text>
                <Feather name="arrow-right" size={16} color={Colors.background} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.primaryCTA, uploading && styles.primaryCTADisabled]} 
                activeOpacity={0.88} 
                onPress={handleFinalPublish}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <Feather name="check" size={16} color={Colors.background} style={{ marginRight: 6 }} />
                    <Text style={styles.primaryCTAText}>Publish Guide to Feed</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Guest Sign-In Bottom Sheet Gating */}
          {showGuestGate && (
            <View style={styles.guestGateOverlay}>
              <View style={styles.guestGateSheet}>
                <View style={styles.guestIconBadge}>
                  <Feather name="user" size={28} color={Colors.primaryDark} />
                </View>
                <Text style={styles.guestGateTitle}>Sign In to Publish</Text>
                <Text style={styles.guestGateSubtitle}>
                  Create your free studio profile to attribute this guide, sync saved overlays, and build your creator portfolio.
                </Text>

                <TouchableOpacity 
                  style={styles.guestAuthBtnPrimary}
                  activeOpacity={0.88}
                  onPress={async () => {
                    await saveDraft();
                    setShowGuestGate(false);
                    onClose();
                    router.push('/auth');
                  }}
                >
                  <Text style={styles.guestAuthBtnPrimaryText}>Sign In / Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.guestCancelBtn}
                  onPress={() => setShowGuestGate(false)}
                >
                  <Text style={styles.guestCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topHandleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  stepIndicatorText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  draftButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  draftButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  stepDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceAlt,
  },
  stepDotActive: {
    backgroundColor: Colors.primaryDark,
    width: 32,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primarySoft,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  stepContainer: {
    gap: 16,
  },
  stepSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pickerCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pickerCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pickerCardSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  selectedImagePreview: {
    width: '100%',
    height: '100%',
  },
  imageChangeOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  changeImageText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.background,
  },
  outlinePreviewWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineImage: {
    width: '100%',
    height: '100%',
  },
  outlineOverlayMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 24, 23, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineFrameBorder: {
    width: '80%',
    height: '80%',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.background,
    borderRadius: 14,
  },
  outlineBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 48, 43, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  outlineBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textLight,
  },
  aspectRatioRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratioPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  ratioPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  ratioPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratioPillTextActive: {
    color: Colors.background,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  labelRowWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textAreaLarge: {
    height: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  textAreaSmall: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.background,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeDifficultyButton: {
    backgroundColor: Colors.primaryDark,
  },
  difficultyText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeDifficultyText: {
    color: Colors.background,
  },
  previewCardContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  mockFeedCard: {
    width: (width - 60) / 1.4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mockImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  mockImage: {
    width: '100%',
    height: '100%',
  },
  mockCardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.15)',
  },
  mockCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(254, 249, 240, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockCategoryText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.textPrimary,
  },
  mockRatioBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(50, 48, 43, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockRatioText: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textLight,
  },
  mockCardBody: {
    padding: 10,
  },
  mockCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  mockCardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 8,
  },
  mockCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  mockStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mockStatText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  mockBookmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerCTAContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    height: 50,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryCTADisabled: {
    opacity: 0.6,
  },
  primaryCTAText: {
    fontFamily: Fonts.bold,
    color: Colors.background,
    fontSize: 14,
  },
  guestGateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 24, 23, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  guestGateSheet: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  guestIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestGateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  guestGateSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  guestAuthBtnPrimary: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  guestAuthBtnPrimaryText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.background,
  },
  guestAuthBtnSecondary: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  guestAuthBtnSecondaryText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  guestCancelBtn: {
    paddingVertical: 6,
  },
  guestCancelBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
});


