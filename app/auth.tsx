import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all studio credentials.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name or creator handle.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          router.replace('/(tabs)/profile');
        }
      } else {
        const { error } = await signUpWithPassword(email, password, fullName.trim());
        if (error) {
          setErrorMessage(error.message);
        } else {
          router.replace('/(tabs)/profile');
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Dismiss */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              <Feather name="x" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Header Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="camera" size={24} color={Colors.primaryDark} />
            </View>
            <Text style={styles.brandTitle}>Picksure</Text>
            <Text style={styles.brandSubtitle}>
              Compose with confidence, shoot with vision.
            </Text>
          </View>

          {/* Segmented Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'signin' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === 'signin' && styles.tabTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'signup' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === 'signup' && styles.tabTextActive,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={14} color="#C62828" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CREATOR NAME</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={16}
                    color={Colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STUDIO EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={16}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="curator@picksure.studio"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={16}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'Connecting...'
                  : mode === 'signin'
                  ? 'Enter Studio'
                  : 'Start Creating'}
              </Text>
              <Feather
                name="arrow-right"
                size={18}
                color={Colors.background}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          {/* Social Logins */}
          <View style={styles.socialDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleAuth}
              activeOpacity={0.75}
            >
              <Ionicons name="logo-google" size={18} color={Colors.textPrimary} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Link */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuest}
            activeOpacity={0.6}
          >
            <Text style={styles.guestButtonText}>
              Explore without an account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#C62828',
    flex: 1,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  forgotText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  passwordInput: {
    fontFamily: Platform.select({ ios: 'System', default: 'normal' }),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  checkboxLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.background,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 46,
    gap: 8,
  },
  socialButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 6,
  },
  guestButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
