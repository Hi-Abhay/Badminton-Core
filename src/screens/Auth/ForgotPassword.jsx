import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
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

const ForgotPassword = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSendResetLink = () => {
    // Dispatch password reset action / API request
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
        <View style={styles.content}>
          {/* Circular Back Button */}
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

          {/* Heading & Subtitle */}
          <View style={styles.headerArea}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter the email address registered with your BadmintonCore account and we'll send recovery instructions.
            </Text>
          </View>

          {/* Email Input Field */}
          <View style={styles.formContainer}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                ACCOUNT EMAIL
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor: isFocused ? theme.textPrimary : theme.borderColor,
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
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>

            {/* Send Reset Link Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSendResetLink}
              style={[styles.submitButton, { backgroundColor: theme.accentBg }]}
            >
              <Text style={[styles.submitButtonText, { color: theme.accentText }]}>
                Send Reset Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  headerArea: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 10,
    letterSpacing: -0.1,
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 24,
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
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});