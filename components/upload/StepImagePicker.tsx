import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Fonts } from '@/constants/theme';

interface StepImagePickerProps {
  selectedImageUri: string | null;
  onPickFromGallery: () => void;
  onCaptureFromCamera: () => void;
}

export default function StepImagePicker({
  selectedImageUri,
  onPickFromGallery,
  onCaptureFromCamera,
}: StepImagePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Choose a reference photo overlay from your library or take a fresh shot with your camera.
      </Text>

      {selectedImageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} contentFit="cover" />
          <View style={styles.imageChangeOverlay}>
            <TouchableOpacity style={styles.changeImageBtn} onPress={onPickFromGallery}>
              <Feather name="refresh-cw" size={13} color={Colors.background} />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.pickerCardsRow}>
          <TouchableOpacity
            style={styles.pickerCard}
            activeOpacity={0.85}
            onPress={onPickFromGallery}
          >
            <View style={styles.pickerIconCircle}>
              <Feather name="image" size={24} color={Colors.primaryDark} />
            </View>
            <Text style={styles.pickerCardTitle}>Photo Library</Text>
            <Text style={styles.pickerCardSubtitle}>Select existing photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerCard}
            activeOpacity={0.85}
            onPress={onCaptureFromCamera}
          >
            <View style={styles.pickerIconCircle}>
              <Feather name="camera" size={24} color={Colors.primaryDark} />
            </View>
            <Text style={styles.pickerCardTitle}>Take Photo</Text>
            <Text style={styles.pickerCardSubtitle}>Capture in real-time</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  pickerCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
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
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
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
    backgroundColor: 'rgba(50, 48, 43, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  changeImageText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.background,
  },
});
