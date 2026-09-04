import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

interface GuestGateModalProps {
  visible: boolean;
  onSignIn: () => void;
  onCancel: () => void;
}

export default function GuestGateModal({
  visible,
  onSignIn,
  onCancel,
}: GuestGateModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.guestGateOverlay}>
      <View style={styles.guestGateSheet}>
        <View style={styles.guestIconBadge}>
          <Feather name="user" size={28} color={Colors.primaryDark} />
        </View>
        <Text style={styles.guestGateTitle}>Sign In to Publish</Text>
        <Text style={styles.guestGateSubtitle}>
          Create your free studio profile to attribute this guide, sync saved overlays, and build
          your creator portfolio.
        </Text>

        <TouchableOpacity
          style={styles.guestAuthBtnPrimary}
          activeOpacity={0.88}
          onPress={onSignIn}
        >
          <Text style={styles.guestAuthBtnPrimaryText}>Sign In / Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestCancelBtn} onPress={onCancel}>
          <Text style={styles.guestCancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guestGateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 28, 22, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  guestGateSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestGateTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  guestGateSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  guestAuthBtnPrimary: {
    width: '100%',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  guestAuthBtnPrimaryText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.background,
  },
  guestCancelBtn: {
    paddingVertical: 10,
  },
  guestCancelBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
