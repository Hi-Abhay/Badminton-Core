import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  useColorScheme,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { light, dark } from '../../theme/Color';
import { useSelector, useDispatch } from 'react-redux';
import { get_api } from '../../utils/api';
import { loginSuccess } from '../../store/authSlice';

const Profile = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? dark : light;
  const user = useSelector(state => state.auth)
  const [name, setName] = useState(user?.fullName);
  const [mobile, setMobile] = useState(user?.mobile || 1234567899);
  const email = user?.email || ''; // Non-editable field
  const [isEditing, setIsEditing] = useState(false);
  const [myStats, setMyStats] = useState({})
  const dispatch = useDispatch();


  const get_profile = async () => {
    try {
      const res = await get_api('/users/profile', user?.token)
      dispatch(loginSuccess({
        fullName: res?.user?.fullName,
        role: res?.user?.role,
        connections: res?.user?.connectionsCount,
      }))

    } catch (error) {

    }
  }

  const get_stats = async () => {
    try {
      const res = await get_api('/matches/my-stats', user?.token)
      if (res.success) {
        const stats = res?.stats || {};
        setMyStats(stats)
        dispatch(loginSuccess({
          total_match: stats?.totalMatches,
          win_match: stats?.totalWon,
        }))
      }
    } catch (error) {

    }
  }

  useEffect(() => {
    get_profile()
    get_stats()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgBase}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={[styles.iconButton]}
          onPress={() => navigation?.openDrawer?.()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={26} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile</Text>

        <TouchableOpacity
          style={[styles.iconButton]}
          onPress={() => setIsEditing(!isEditing)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isEditing ? 'checkmark' : 'create'}
            size={25}
            color={isEditing ? theme.success : theme.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 }, // Extra clearance for the floating tab bar
        ]}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              }}
              style={[styles.avatar, { borderColor: theme.borderColor }]}
            />
            {isEditing && (
              <TouchableOpacity
                style={[styles.cameraBadge, { backgroundColor: theme.accentBg }]}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color={theme.accentText} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{user?.fullName}</Text>
          <Text style={[styles.userRole, { color: theme.textTertiary }]}>Category - {user?.role}</Text>
        </View>

        {/* Match Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderColor }]}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{myStats?.completedMatches || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Matches</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderColor }]}>

            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{myStats?.totalWon || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wins</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderColor }]}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{myStats?.winRate}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>WinRate</Text>
          </View>
        </View>

        {/* Profile Information Inputs */}
        <View style={[styles.detailsCard, { backgroundColor: theme.bgSurface, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Account Details</Text>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: isEditing ? theme.textPrimary : theme.borderColor,
                  backgroundColor: isDark ? '#1F1F23' : '#FAFAFA',
                },
              ]}
            >
              <Ionicons name="person-outline" size={18} color={theme.textTertiary} style={styles.fieldIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                editable={isEditing}
                style={[
                  styles.input,
                  { color: theme.textPrimary, opacity: isEditing ? 1 : 0.85 },
                ]}
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>

          {/* Mobile */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mobile Number</Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: isEditing ? theme.textPrimary : theme.borderColor,
                  backgroundColor: isDark ? '#1F1F23' : '#FAFAFA',
                },
              ]}
            >
              <Ionicons name="call-outline" size={18} color={theme.textTertiary} style={styles.fieldIcon} />
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                editable={isEditing}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { color: theme.textPrimary, opacity: isEditing ? 1 : 0.85 },
                ]}
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>

          {/* Email Address (Non-Editable) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <View style={styles.badgeLocked}>
                <Ionicons name="lock-closed" size={11} color={theme.textTertiary} />
                <Text style={[styles.badgeText, { color: theme.textTertiary }]}>Read-only</Text>
              </View>
            </View>
            <View
              style={[
                styles.inputContainer,
                styles.disabledInputContainer,
                {
                  borderColor: theme.borderColor,
                  backgroundColor: isDark ? '#121215' : '#F0F0F2',
                },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={theme.textTertiary} style={styles.fieldIcon} />
              <TextInput
                value={email}
                editable={false}
                selectTextOnFocus={false}
                style={[styles.input, { color: theme.textTertiary }]}
              />
              <Ionicons name="lock-closed-outline" size={16} color={theme.textTertiary} />
            </View>
          </View>
        </View>

        {/* Primary Save Button (Only shown in edit mode) */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accentBg }]}
            onPress={() => setIsEditing(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveButtonText, { color: theme.accentText }]}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  disabledInputContainer: {
    opacity: 0.8,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});