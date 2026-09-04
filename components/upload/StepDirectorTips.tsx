import React from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface StepDirectorTipsProps {
  guideInstructions: string;
  onChangeGuideInstructions: (instructions: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
}

export default function StepDirectorTips({
  guideInstructions,
  onChangeGuideInstructions,
  description,
  onChangeDescription,
}: StepDirectorTipsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Provide concise camera direction notes (framing, angles, lighting) for creators following this guide.
      </Text>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRowWithCount}>
          <Text style={styles.fieldLabel}>DIRECTOR SHOOTING TIPS</Text>
          <Text style={styles.charCountText}>{guideInstructions.length}/300</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textAreaLarge]}
          placeholder={
            '• Position camera at hip level\n• Let natural window light illuminate face\n• Relax shoulders at 45° angle'
          }
          placeholderTextColor={Colors.textMuted}
          value={guideInstructions}
          onChangeText={(t) => onChangeGuideInstructions(t.slice(0, 300))}
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
          onChangeText={(t) => onChangeDescription(t.slice(0, 150))}
          multiline
        />
      </View>
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
  fieldGroup: {
    marginBottom: 20,
  },
  labelRowWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  charCountText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textAreaLarge: {
    height: 120,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  textAreaSmall: {
    height: 80,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
});
