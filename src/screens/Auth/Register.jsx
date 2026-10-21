import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const Register = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';

  // Form State (Email removed as requested)
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleCreateAccount = () => {
    // Proceed with registration flow or navigation to verification screen
  };

  return (
    <SafeAreaView edges={handleEdges()} style={[styles.container, { backgroundColor: theme.bgBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgBase}
      />

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
                />
              </View>
            </View>

            {/* PHONE NUMBER (OPTIONAL) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                PHONE NUMBER (OPTIONAL)
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor:
                      focusedField === 'phoneNumber' ? theme.textPrimary : theme.borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="+1 (555) 019-2834"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField(null)}
                />
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

            {/* CREATE ACCOUNT BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateAccount}
              style={[styles.submitButton, { backgroundColor: theme.accentBg }]}
            >
              <Text style={[styles.submitButtonText, { color: theme.accentText }]}>
                Create Account
              </Text>
            </TouchableOpacity>

            {/* SIGN IN LINK */}
            <View style={styles.signInRow}>
              <Text style={[styles.signInLabel, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
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