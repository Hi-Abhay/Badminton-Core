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
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signInWithGoogle } from '../../services/googleAuth';
import { useDispatch } from 'react-redux';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
  registerDeviceForRemoteMessages,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { loginSuccess } from '../../store/authSlice';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { patch_api, post_api, URL } from '../../utils/api';

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

export const getDeviceFcmToken = async () => {
  try {
    const messaging = getMessaging();

    // Android 13+ notification permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (status !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return '';
      }
    }

    // iOS registration and permission
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);

      const status = await requestPermission(messaging);

      const enabled =
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        // console.log('Notification permission denied');
        return '';
      }
    }

    const token = await getToken(messaging);

    if (token) {
      // console.log('FCM token retrieved successfully');
      return token;
    }

    return '';
  } catch (error) {
    // console.error('FCM token error:', error.code, error.message);
    return '';
  }
};

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  // Animated Toast State & Values
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const toastAnim = useRef(new Animated.Value(-120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(toastAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(prev => ({ ...prev, visible: false }));
    });
  }, [toastAnim, toastOpacity]);

  const showToast = useCallback(
    (message, type = 'error') => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setToast({ visible: true, message, type });

      Animated.parallel([
        Animated.spring(toastAnim, {
          toValue: insets.top + 10,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        hideToast();
      }, 3500);
    },
    [insets.top, toastAnim, toastOpacity, hideToast]
  );



  const handleSignIn = async () => {
    if (loading) return;

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      showToast('Please enter both your email and password.', 'error');
      return;
    }

    setLoading(true);


    try {
      const fcmToken = await getDeviceFcmToken();
      const response = await fetch(`${URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail.toLowerCase(),
          password: cleanPassword,
          fcmToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials.');
      }

      dispatch(loginSuccess({
        id: data?.user?.id || null,
        fullName: data?.user?.fullName || '',
        email: data?.user?.email || '',
        token: data?.token,
        total_match: data?.user?.totalMatch || '',
        win_match: data?.user?.winMatch || '',
        role: data?.user?.role || '',
        isLoggedIn: data?.success || false,
        image: data?.user?.profile_image

      }));

      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerRoot' }],
      });
    } catch (error) {
      showToast(error.message || 'Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };



  const getToastDetails = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          bg: isDark ? '#132A1C' : '#E6F9F0',
          border: '#10B981',
        };
      case 'info':
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6',
          bg: isDark ? '#142338' : '#EFF6FF',
          border: '#3B82F6',
        };
      case 'error':
      default:
        return {
          icon: 'alert-circle',
          iconColor: '#EF4444',
          bg: isDark ? '#2B1414' : '#FDF2F2',
          border: '#EF4444',
        };
    }
  };

  const toastStyleConfig = getToastDetails();


  const [googleLoading, setGoogleLoading] = useState(false);
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      const user = await signInWithGoogle();
      const fcmToken = await getDeviceFcmToken();
      const body = {
        email: user?.email,
        profile_image: user?.photoURL,
        fcmToken: fcmToken
      }
      const data = await post_api('/users/loginByEmail', body)
      if (!data?.success) {
        showToast(data.message || 'Invalid User', 'error');
        return
      }
      if (data?.success) {
        dispatch(loginSuccess({
          id: data?.user?.id || null,
          fullName: data?.user?.fullName || '',
          email: data?.user?.email || '',
          token: data?.token,
          total_match: data?.user?.totalMatch || '',
          win_match: data?.user?.winMatch || '',
          role: data?.user?.role || '',
          isLoggedIn: data?.success || false,
          image: data?.user?.profile_image
        }));

        navigation.reset({
          index: 0,
          routes: [{ name: 'DrawerRoot' }],
        });
      }

      // Let your existing authentication-state listener
      // or navigation flow take the user to Home.
    } catch (error) {
      if (
        error.code === 'SIGN_IN_CANCELLED' ||
        error.code === '12501'
      ) {
        return;
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const messaging = getMessaging();

    const unsubscribe = onTokenRefresh(
      messaging,
      async newToken => {
        console.log('FCM token refreshed');
      },
    );

    return unsubscribe;
  }, []);
  return (
    <SafeAreaView edges={handleEdges()} style={[styles.container, { backgroundColor: theme.bgBase }]}>
      {/* Floating Animated Toast Banner */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: toastStyleConfig.bg,
              borderColor: toastStyleConfig.border,
              opacity: toastOpacity,
              transform: [{ translateY: toastAnim }],
            },
          ]}
        >
          <Ionicons
            name={toastStyleConfig.icon}
            size={22}
            color={toastStyleConfig.iconColor}
            style={styles.toastIcon}
          />
          <Text
            style={[styles.toastText, { color: theme.textPrimary }]}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
          <TouchableOpacity onPress={hideToast} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={theme.textTertiary} />
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
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              navigation.canGoBack() && navigation.goBack()
            }}
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

          {/* BadmintonCore Brand Lockup */}
          <View style={styles.brandRow}>
            <View style={[styles.logoBadge, { backgroundColor: theme.bgSurface, borderColor: theme.borderColor }]}>
              <Text style={[styles.logoLetter, { color: theme.textPrimary }]}>B</Text>
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>BadmintonCore</Text>
              <Text style={[styles.brandTagline, { color: theme.textTertiary }]}>OFFICIAL MATCH ARENA</Text>
            </View>
          </View>

          {/* Screen Title & Subtitle */}
          <View style={styles.headerArea}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to continue your badminton matches.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* EMAIL ADDRESS */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor: focusedField === 'email' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="player@badmintoncore.com"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor: focusedField === 'password' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="••••••••"
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

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberMe ? theme.accentBg : theme.borderColor,
                      backgroundColor: rememberMe ? theme.accentBg : theme.bgSurface,
                    },
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={13} color={theme.accentText} />
                  )}
                </View>
                <Text style={[styles.rememberText, { color: theme.textSecondary }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              {/* <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: theme.textPrimary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity> */}
            </View>

            {/* Sign In Button with Wave Animation */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={loading}
              style={[
                styles.submitButton,
                { backgroundColor: theme.accentBg, opacity: loading ? 0.9 : 1 },
              ]}
            >
              {loading ? (
                <WaveDots color={theme.accentText} />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.accentText }]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.borderColor }]} />
              <Text style={[styles.dividerText, { color: theme.textTertiary }]}>
                OR CONTINUE WITH
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.borderColor }]} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={[
                styles.googleButton,
                {
                  backgroundColor: theme.bgSurface,
                  borderColor: theme.borderColor,
                },
              ]}
            >
              {googleLoading ? (
                <WaveDots color={'#EA4335'} />
              ) : (
                <View style={{ flexDirection: 'row' }}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.googleIcon} />
                  <Text style={[styles.googleButtonText, { color: theme.textPrimary }]}>
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={loading}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.footerLink, { color: theme.textPrimary }]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  toastIcon: {
    marginRight: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
    marginRight: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 40,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoLetter: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
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
    marginBottom: 18,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 12,
  },
  googleButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '800',
  },
});