import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { light, dark } from '../../theme/Color';
import { useSelector, useDispatch } from 'react-redux';
import { get_api } from '../../utils/api';
import { loginSuccess } from '../../store/authSlice';

// --- Reusable Skeleton Component ---
const Skeleton = ({ width, height, borderRadius = 8, style, isDark }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2C2C32' : '#E2E4E9',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const Profile = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? dark : light;

  const user = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const email = user?.email || '';
  const [isEditing, setIsEditing] = useState(false);
  const [myStats, setMyStats] = useState({});

  // Sync state if Redux user updates
  useEffect(() => {
    if (!isEditing && user) {
      if (user.fullName) setName(user.fullName);
      if (user.mobile) setMobile(user.mobile);
    }
  }, [user, isEditing]);

  const get_profile = useCallback(async () => {
    try {
      const res = await get_api('/users/profile', user?.token);
      if (res?.user) {
        dispatch(
          loginSuccess({
            fullName: res.user.fullName,
            role: res.user.role,
            connections: res.user.connectionsCount,
          })
        );
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  }, [user?.token, dispatch]);

  const get_stats = useCallback(async () => {
    try {
      const res = await get_api('/matches/my-stats', user?.token);
      if (res?.success) {
        const stats = res?.stats || {};
        setMyStats(stats);
        dispatch(
          loginSuccess({
            total_match: stats?.completedMatches ?? stats?.totalMatches,
            win_match: stats?.totalWon,
          })
        );
      }
    } catch (error) {
      console.log('Error fetching stats:', error);
    }
  }, [user?.token, dispatch]);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([get_profile(), get_stats()]);
      if (isMounted) setLoading(false);
    };
    loadAll();
    return () => {
      isMounted = false;
    };
  }, [get_profile, get_stats]);

  // Format stats safely
  const totalMatches =
    myStats?.completedMatches ?? myStats?.totalMatches ?? user?.total_match ?? 0;
  const totalWins = myStats?.totalWon ?? user?.win_match ?? 0;
  const rawWinRate = myStats?.winRate;
  const winRateText =
    rawWinRate !== undefined && rawWinRate !== null
      ? String(rawWinRate).includes('%')
        ? rawWinRate
        : `${rawWinRate}%`
      : totalMatches > 0
        ? `${Math.round((totalWins / totalMatches) * 100)}%`
        : '0%';

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgBase}
      />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation?.openDrawer?.()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={26} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Profile
        </Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsEditing(!isEditing)}
          activeOpacity={0.7}
          // disabled={loading}
          disabled
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {/* <Ionicons
            name={isEditing ? 'checkmark' : 'create-outline'}
            size={22}
            color={isEditing ? theme.accentBg : theme.textPrimary}
          /> */}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {loading ? (
              <Skeleton
                width={96}
                height={96}
                borderRadius={48}
                isDark={isDark}
              />
            ) : (
              <Image
                source={
                  user?.image
                    ? { uri: user.image }
                    : { uri: 'https://via.placeholder.com/150' }
                }
                style={[styles.avatar, { borderColor: theme.borderColor }]}
              />
            )}
            {isEditing && !loading && (
              <TouchableOpacity
                style={[styles.cameraBadge, { backgroundColor: theme.accentBg }]}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={15} color={theme.accentText} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <>
              <Skeleton
                width={140}
                height={20}
                borderRadius={6}
                style={styles.skeletonSpacing}
                isDark={isDark}
              />
              <Skeleton
                width={100}
                height={14}
                borderRadius={4}
                style={styles.skeletonSpacingSmall}
                isDark={isDark}
              />
            </>
          ) : (
            <>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {user?.fullName || 'User Name'}
              </Text>
              <Text style={[styles.userRole, { color: theme.textTertiary }]}>
                Category - {user?.role || 'Player'}
              </Text>
            </>
          )}
        </View>

        {/* Responsive Match Statistics Cards */}
        <View style={styles.statsContainer}>
          {/* Card 1: Total Matches */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderColor,
              },
            ]}
          >
            {loading ? (
              <>
                <Skeleton width={32} height={20} borderRadius={4} isDark={isDark} />
                <Skeleton
                  width={65}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 6 }}
                  isDark={isDark}
                />
              </>
            ) : (
              <>
                <Text
                  style={[styles.statValue, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {totalMatches}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  Total Matches
                </Text>
              </>
            )}
          </View>

          {/* Card 2: Wins */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderColor,
              },
            ]}
          >
            {loading ? (
              <>
                <Skeleton width={32} height={20} borderRadius={4} isDark={isDark} />
                <Skeleton
                  width={40}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 6 }}
                  isDark={isDark}
                />
              </>
            ) : (
              <>
                <Text
                  style={[styles.statValue, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {totalWins}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  Wins
                </Text>
              </>
            )}
          </View>

          {/* Card 3: Win Rate */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.bgSurface,
                borderColor: theme.borderColor,
              },
            ]}
          >
            {loading ? (
              <>
                <Skeleton width={38} height={20} borderRadius={4} isDark={isDark} />
                <Skeleton
                  width={50}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 6 }}
                  isDark={isDark}
                />
              </>
            ) : (
              <>
                <Text
                  style={[styles.statValue, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {winRateText}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  Win Rate
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Profile Information Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.bgSurface,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account Details
          </Text>

          {/* Full Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Full Name
            </Text>
            {loading ? (
              <Skeleton width="100%" height={48} borderRadius={14} isDark={isDark} />
            ) : (
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: isEditing ? theme.textPrimary : theme.borderColor,
                    backgroundColor: isDark ? '#1F1F23' : '#FAFAFA',
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={theme.textTertiary}
                  style={styles.fieldIcon}
                />
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
            )}
          </View>

          {/* Email Field (Read-only) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Email Address
              </Text>
              <View style={styles.badgeLocked}>
                <Ionicons name="lock-closed" size={11} color={theme.textTertiary} />
                <Text style={[styles.badgeText, { color: theme.textTertiary }]}>
                  Read-only
                </Text>
              </View>
            </View>
            {loading ? (
              <Skeleton width="100%" height={48} borderRadius={14} isDark={isDark} />
            ) : (
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
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={theme.textTertiary}
                  style={styles.fieldIcon}
                />
                <TextInput
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                  style={[styles.input, { color: theme.textTertiary }]}
                />
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={theme.textTertiary}
                />
              </View>
            )}
          </View>
        </View>

        {/* Save Button */}
        {isEditing && !loading && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accentBg }]}
            onPress={() => setIsEditing(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveButtonText, { color: theme.accentText }]}>
              Save Changes
            </Text>
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
    textAlign: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  skeletonSpacing: {
    marginTop: 8,
  },
  skeletonSpacingSmall: {
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 0, // Prevents flex child overflow on narrow screens
    minHeight: 80, // Ensures all 3 cards keep equal heights when text wraps
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
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
    opacity: 0.85,
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