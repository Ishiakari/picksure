import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';
import { addCustomTemplateToFeed } from '@/hooks/useTemplates';
import { Template } from '@/src/data/templates';
import { CATEGORIES, CategoryType } from '@/src/constants/categories';
import { detectBestRatio, TemplateAspectRatio } from '@/utils/detectBestRatio';
import { uploadTemplateImage, createTemplateRecord } from '@/services/uploadService';

import StepImagePicker from './upload/StepImagePicker';
import StepCropRatio from './upload/StepCropRatio';
import StepCategoryDetails, { DifficultyLevel } from './upload/StepCategoryDetails';
import StepDirectorTips from './upload/StepDirectorTips';
import StepReview from './upload/StepReview';
import GuestGateModal from './upload/GuestGateModal';

const STEPS = [
  { id: 1, title: 'Select Image' },
  { id: 2, title: 'Outline & Crop' },
  { id: 3, title: 'Set Category' },
  { id: 4, title: 'Director Tips' },
  { id: 5, title: 'Review & Publish' },
];

interface UploadTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadTemplateModal({
  visible,
  onClose,
  onUploadSuccess,
}: UploadTemplateModalProps) {
  const { user } = useAuth();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Beginner');
  const [description, setDescription] = useState('');
  const [guideInstructions, setGuideInstructions] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<TemplateAspectRatio>('3:4 RATIO');
  const [uploading, setUploading] = useState(false);

  // Guest Auth Gate
  const [showGuestGate, setShowGuestGate] = useState(false);

  const getDraftKey = useCallback(() => `picksure_guide_draft_${user?.id || 'guest'}`, [user?.id]);

  const loadSavedDraft = useCallback(async () => {
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
      console.warn('Error loading draft:', e);
    }
  }, [getDraftKey]);

  useEffect(() => {
    if (visible) {
      loadSavedDraft();
    }
  }, [visible, loadSavedDraft]);

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
      console.warn('Error saving draft:', e);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(getDraftKey());
    } catch (e) {
      console.warn('Error clearing draft:', e);
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
      { text: 'OK', onPress: onClose },
    ]);
  };

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access photo library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);

      if (asset.width && asset.height) {
        setAspectRatio(detectBestRatio(asset.width, asset.height));
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
        setAspectRatio(detectBestRatio(asset.width, asset.height));
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
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalPublish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
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
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const trimmedDescription = description.trim();
    const tipsList =
      parsedTips.length > 0
        ? parsedTips
        : trimmedDescription.length > 0
        ? [trimmedDescription]
        : ['Align pose overlay with subject.'];

    try {
      setUploading(true);
      setShowGuestGate(false);

      // 1. Upload to Supabase Storage via service
      const publicUrl = await uploadTemplateImage(selectedImageUri, creatorId);

      // 2. Insert record via service
      const insertedRow = await createTemplateRecord({
        title: title.trim(),
        category,
        description: trimmedDescription || 'Custom community composition guide.',
        tips: tipsList,
        imageUrl: publicUrl,
        creatorId,
        difficulty,
        timeSetup: '2 min',
        ratio: aspectRatio,
      });

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

      // 4. Save to user uploads locally
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
      setCategory(CATEGORIES[0]);
      setDifficulty('Beginner');
      setDescription('');
      setGuideInstructions('');
      setSelectedImageUri(null);
      setCurrentStep(1);

      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      Alert.alert('Publish Failed', err?.message || 'Failed to publish guide.');
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

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
              <Feather
                name={currentStep === 1 ? 'x' : 'arrow-left'}
                size={18}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.modalTitle}>{STEPS[currentStep - 1].title}</Text>
              <Text style={styles.stepIndicatorText}>
                Step {currentStep} of {STEPS.length}
              </Text>
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
            {currentStep === 1 && (
              <StepImagePicker
                selectedImageUri={selectedImageUri}
                onPickFromGallery={pickImageFromGallery}
                onCaptureFromCamera={capturePhotoFromCamera}
              />
            )}

            {currentStep === 2 && (
              <StepCropRatio
                selectedImageUri={selectedImageUri}
                aspectRatio={aspectRatio}
                onSelectAspectRatio={setAspectRatio}
              />
            )}

            {currentStep === 3 && (
              <StepCategoryDetails
                title={title}
                onChangeTitle={setTitle}
                category={category}
                onChangeCategory={setCategory}
                difficulty={difficulty}
                onChangeDifficulty={setDifficulty}
              />
            )}

            {currentStep === 4 && (
              <StepDirectorTips
                guideInstructions={guideInstructions}
                onChangeGuideInstructions={setGuideInstructions}
                description={description}
                onChangeDescription={setDescription}
              />
            )}

            {currentStep === 5 && (
              <StepReview
                selectedImageUri={selectedImageUri}
                category={category}
                aspectRatio={aspectRatio}
                title={title}
                description={description}
              />
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
          <GuestGateModal
            visible={showGuestGate}
            onSignIn={async () => {
              await saveDraft();
              setShowGuestGate(false);
              onClose();
              router.push('/auth');
            }}
            onCancel={() => setShowGuestGate(false)}
          />
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  draftButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stepDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: Colors.primaryDark,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  footerCTAContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryCTA: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 15,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryCTADisabled: {
    opacity: 0.7,
  },
  primaryCTAText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.background,
  },
});
