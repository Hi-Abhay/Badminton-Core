import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { URL } from '../../utils/api';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { loginSuccess } from '../../store/authSlice';
import { useDispatch } from 'react-redux';
import { signInWithGoogle } from '../../services/googleAuth';
import { getDeviceFcmToken } from './Login'
// ─── Three Dot Wave Loading Animation ──────────────────────────────────────────
const WaveDots = ({ color = '#FFFFFF' }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWave = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -6,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 2,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, 360 - delay)),
        ]),
      );
    };

    const anim1 = createWave(dot1, 0);
    const anim2 = createWave(dot2, 140);
    const anim3 = createWave(dot3, 280);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.waveRow}>
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: dot1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: dot2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: dot3 }] },
        ]}
      />
    </View>
  );
};

const Register = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';
  const dispatch = useDispatch();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('single'); // 'single' | 'double'
  const [image, setImage] = useState('')
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Custom Animated Toast State
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info', // 'success' | 'error' | 'info'
  });
  const toastAnim = useRef(new Animated.Value(-120)).current;
  const toastTimeout = useRef(null);

  const showToast = useCallback(
    (message, type = 'info') => {
      setToastConfig({ visible: true, message, type });

      Animated.spring(toastAnim, {
        toValue: Platform.OS === 'ios' ? 16 : 40,
        useNativeDriver: true,
        bounciness: 6,
        speed: 12,
      }).start();

      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }

      toastTimeout.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setToastConfig((prev) => ({ ...prev, visible: false }));
        });
      }, 3000);
    },
    [toastAnim],
  );

  const getToastIcon = () => {
    switch (toastConfig.type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />;
      case 'error':
        return <Ionicons name="alert-circle" size={22} color="#FFFFFF" />;
      case 'info':
      default:
        return <Ionicons name="information-circle" size={22} color="#FFFFFF" />;
    }
  };

  const getToastBgColor = () => {
    switch (toastConfig.type) {
      case 'success':
        return theme.success || '#10B981';
      case 'error':
        return theme.danger || '#EF4444';
      case 'info':
      default:
        return '#2563EB';
    }
  };

  const handleCreateAccount = async () => {
    if (loading) return;
    const fcmToken = await getDeviceFcmToken();

    if (!fullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!agreedToTerms) {
      showToast('Please accept the Terms and Privacy Policy', 'error');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      password,
      fcmToken,
      profile_image: image

    };

    setLoading(true);

    try {
      const res = await fetch(`${URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(
          loginSuccess({
            id: data?.user?.id || null,
            fullName: data?.user?.fullName || '',
            email: data?.user?.email || '',
            token: data?.token,
            total_match: data?.user?.totalMatch || '',
            win_match: data?.user?.winMatch || '',
            role: data?.user?.role || '',
            isLoggedIn: data?.success || false,
            image: data?.user?.profile_image
          }),
        );

        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerRoot' }],
        });
      } else {
        showToast(data?.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast('Something went wrong. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const get_Email = async () => {
    try {
      const user = await signInWithGoogle();
      setEmail(user?.email)
      setImage(user?.photoURL)
    } catch (error) {

    }
  }

  return (
    <SafeAreaView edges={handleEdges()} style={[styles.container, { backgroundColor: theme.bgBase }]}>
      {/* Floating Animated Dropdown Toast */}
      {toastConfig.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: getToastBgColor(),
              transform: [{ translateY: toastAnim }],
            },
          ]}
        >
          <View style={styles.toastIconContainer}>{getToastIcon()}</View>
          <Text style={styles.toastText} numberOfLines={2}>
            {toastConfig.message}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (toastTimeout.current) clearTimeout(toastTimeout.current);
              Animated.timing(toastAnim, {
                toValue: -120,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setToastConfig((prev) => ({ ...prev, visible: false }));
              });
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Circular Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              {
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderColor,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerArea}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Create Your Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Start tracking your badminton journey.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* FULL NAME */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                FULL NAME <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor:
                      focusedField === 'fullName' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Viktor Axelsen"
                  placeholderTextColor={theme.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                EMAIL ADDRESS <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor:
                      focusedField === 'email' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => get_Email()}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Tab to select your email"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={false}
                />
              </TouchableOpacity>
            </View>

            {/* ROLE (SINGLE / DOUBLE) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                PLAYING ROLE <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <View style={styles.roleContainer}>
                {/* Single */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={() => setRole('single')}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        role === 'single' ? theme.accentBg : theme.bgSurface,
                      borderColor:
                        role === 'single' ? theme.accentBg : theme.borderColor,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={role === 'single' ? theme.accentText : theme.textSecondary}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          role === 'single' ? theme.accentText : theme.textPrimary,
                        fontWeight: role === 'single' ? '700' : '500',
                      },
                    ]}
                  >
                    Single
                  </Text>
                </TouchableOpacity>

                {/* Double */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={() => setRole('double')}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        role === 'double' ? theme.accentBg : theme.bgSurface,
                      borderColor:
                        role === 'double' ? theme.accentBg : theme.borderColor,
                    },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={17}
                    color={role === 'double' ? theme.accentText : theme.textSecondary}
                    style={styles.roleIcon}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          role === 'double' ? theme.accentText : theme.textPrimary,
                        fontWeight: role === 'double' ? '700' : '500',
                      },
                    ]}
                  >
                    Double
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                PASSWORD <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor:
                      focusedField === 'password' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                CONFIRM PASSWORD <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor:
                      focusedField === 'confirmPassword'
                        ? theme.textPrimary
                        : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Repeat password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* TERMS & PRIVACY CHECKBOX */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={loading}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agreedToTerms ? theme.accentBg : theme.borderColor,
                    backgroundColor: agreedToTerms ? theme.accentBg : theme.bgSurface,
                  },
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={13} color={theme.accentText} />
                )}
              </View>
              <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                I agree to BadmintonCore's{' '}
                <Text style={[styles.linkText, { color: theme.textPrimary }]}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.linkText, { color: theme.textPrimary }]}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </TouchableOpacity>

            {/* CREATE ACCOUNT BUTTON WITH WAVE ANIMATION */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleCreateAccount}
              style={[
                styles.submitButton,
                { backgroundColor: theme.accentBg, opacity: loading ? 0.9 : 1 },
              ]}
            >
              {loading ? (
                <WaveDots color={theme.accentText} />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.accentText }]}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* SIGN IN LINK */}
            <View style={styles.signInRow}>
              <Text style={[styles.signInLabel, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={loading}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.signInLink, { color: theme.textPrimary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 40,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    zIndex: 9999,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  toastIconContainer: {
    marginRight: 10,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerArea: {
    marginBottom: 28,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: -0.1,
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  roleIcon: {
    marginRight: 8,
  },
  roleText: {
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  termsText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
    fontWeight: '400',
  },
  linkText: {
    fontWeight: '700',
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: 6,
  },
  waveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 13.5,
    fontWeight: '800',
  },
});