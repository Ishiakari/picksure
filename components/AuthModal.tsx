import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import PickSureLogo from '@/components/PickSureLogo';

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

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenUploadModal?: () => void;
}

export default function AuthModal({ visible, onClose, onOpenUploadModal }: AuthModalProps) {
  const { 
    user, 
    signInWithGoogle, 
    signInWithPassword, 
    signUpWithPassword,
    signOut 
  } = useAuth();
  
  // Auth Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [signingInGoogle, setSigningInGoogle] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Automatically reset states when modal closes or user signs in
  useEffect(() => {
    if (user) {
      setLoadingAuth(false);
      setSigningInGoogle(false);
      setUpdatingAvatar(false);
    }
  }, [user]);

  useEffect(() => {
    if (!visible) {
      setAuthMode('signin');
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLoadingAuth(false);
      setSigningInGoogle(false);
      setUpdatingAvatar(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Needed", "Please allow access to your photo library to pick an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;
        setUpdatingAvatar(true);

        const filename = `avatars/${user?.id}_${Date.now()}.jpg`;
        const blob = await getBlobFromUri(imageUri);
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { data: storageData, error: storageError } = await supabase.storage
          .from('template-overlays')
          .upload(filename, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        const publicUrl = storageData?.path
          ? supabase.storage.from('template-overlays').getPublicUrl(storageData.path).data.publicUrl
          : imageUri;

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl },
        });

        if (updateError) throw updateError;
        Alert.alert("Avatar Updated ✨", "Your profile photo has been updated successfully!");
      }
    } catch (err: any) {
      console.error("Avatar update error:", err);
      Alert.alert("Update Failed", err?.message || "Failed to update profile photo.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSigningInGoogle(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setSigningInGoogle(false);
      Alert.alert("Google Error", error?.message || "Could not launch Google Sign-In.");
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      Alert.alert("Password Required", "Please enter your password.");
      return;
    }

    try {
      setLoadingAuth(true);
      const res = await signInWithPassword(email, password);
      if (res?.session) {
        Alert.alert("Welcome Back! 🎉", "Successfully signed in!");
        onClose();
      } else {
        Alert.alert(
          "Email Confirmation Required ✉️", 
          "Login succeeded, but Supabase requires email confirmation before issuing a session. Please check your inbox or turn off 'Confirm email' in Supabase Dashboard -> Auth -> Providers -> Email."
        );
      }
    } catch (err: any) {
      Alert.alert("Sign In Failed", err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoadingAuth(true);
      const res = await signUpWithPassword(email, password, fullName);
      if (res?.session) {
        Alert.alert("Welcome! 🎉", "Your account has been created!");
        onClose();
      } else if (res?.user && !res?.session) {
        Alert.alert(
          "Account Created! ✉️", 
          "Registration successful! If required, please check your email inbox to verify your account."
        );
        onClose();
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err?.message || "Could not create account. Email may already be in use.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      Alert.alert("Signed Out 👋", "You have successfully signed out.");
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >
        <SafeAreaView style={styles.modalContent}>
          {/* Header Close Button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.creamLight} />
            </TouchableOpacity>
          </View>

          {user ? (
            /* Logged In User Profile View */
            <View style={styles.profileContainer}>
              {/* Interactive Custom Avatar Picker */}
              <TouchableOpacity 
                style={styles.avatarTouchable} 
                onPress={handlePickAvatar}
                disabled={updatingAvatar}
              >
                {user.user_metadata?.avatar_url ? (
                  <Image 
                    source={user.user_metadata.avatar_url} 
                    style={styles.avatar} 
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.emptyAvatar}>
                    <Ionicons name="person-outline" size={36} color={Colors.rosePrimary} />
                  </View>
                )}

                {updatingAvatar ? (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.creamLight} />
                  </View>
                ) : (
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={14} color={Colors.darkText} />
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.userName}>{user.user_metadata?.full_name || 'PickSure Creator'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.tapToChangeText}>Tap avatar circle to upload profile photo</Text>

              {/* Upload Custom Pose Button */}
              {onOpenUploadModal && (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                >
                  <Ionicons name="add-circle-outline" size={22} color={Colors.darkText} style={{ marginRight: 8 }} />
                  <Text style={styles.uploadButtonText}>Upload Custom Pose Template</Text>
                </TouchableOpacity>
              )}

              {/* Sign Out Button */}
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={Colors.rosePrimary} style={{ marginRight: 8 }} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Logged Out Login / Register Form */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.loginContainer}>
                <PickSureLogo size={48} showText={true} color={Colors.rosePrimary} textColor={Colors.creamLight} />
                
                <Text style={styles.loginTitle}>Welcome to PickSure</Text>
                <Text style={styles.loginSubtitle}>
                  Sign in or create an account to upload custom pose reference guides.
                </Text>

                {/* Segmented Auth Mode Switcher */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={[styles.tabButton, authMode === 'signin' && styles.activeTabButton]}
                    onPress={() => setAuthMode('signin')}
                  >
                    <Text style={[styles.tabText, authMode === 'signin' && styles.activeTabText]}>Sign In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.tabButton, authMode === 'register' && styles.activeTabButton]}
                    onPress={() => setAuthMode('register')}
                  >
                    <Text style={[styles.tabText, authMode === 'register' && styles.activeTabText]}>Create Account</Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                  {authMode === 'register' && (
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color={Colors.roseSoft} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#99818c"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={Colors.roseSoft} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#99818c"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.roseSoft} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#99818c"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {authMode === 'register' && (
                    <View style={styles.inputWrapper}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={Colors.roseSoft} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#99818c"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  {/* Primary Action Button */}
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={authMode === 'signin' ? handleSignIn : handleRegister}
                    disabled={loadingAuth}
                  >
                    {loadingAuth ? (
                      <ActivityIndicator size="small" color={Colors.darkText} />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* OR Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity 
                  style={styles.googleButton} 
                  onPress={handleGoogleSignIn}
                  disabled={signingInGoogle}
                >
                  {signingInGoogle ? (
                    <ActivityIndicator size="small" color={Colors.darkText} />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color={Colors.darkText} style={{ marginRight: 10 }} />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Toggle Footer Helper */}
                <TouchableOpacity 
                  style={styles.footerToggle} 
                  onPress={() => setAuthMode(authMode === 'signin' ? 'register' : 'signin')}
                >
                  <Text style={styles.footerToggleText}>
                    {authMode === 'signin' 
                      ? "Don't have an account? Create Account" 
                      : "Already have an account? Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    paddingBottom: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    alignItems: 'flex-end',
    paddingVertical: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.creamLight,
    marginTop: 8,
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 12,
    color: Colors.roseSoft,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    padding: 4,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.rosePrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.roseSoft,
  },
  activeTabText: {
    color: Colors.darkText,
  },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: Colors.creamLight,
    fontSize: 14,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.rosePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.rosePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: Colors.darkText,
    fontSize: 15,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.roseSoft,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 16,
  },
  googleButton: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.creamLight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: Colors.darkText,
    fontSize: 14,
    fontWeight: '800',
  },
  footerToggle: {
    marginTop: 14,
    paddingVertical: 6,
  },
  footerToggleText: {
    color: Colors.roseSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: Colors.rosePrimary,
  },
  emptyAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.rosePrimary,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.rosePrimary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.darkBackground,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.creamLight,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.roseSoft,
    marginTop: 2,
  },
  tapToChangeText: {
    fontSize: 11,
    color: Colors.roseSoft,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 20,
  },
  uploadButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.rosePrimary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: Colors.darkText,
    fontSize: 15,
    fontWeight: '800',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: Colors.rosePrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
