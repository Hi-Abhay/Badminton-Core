import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  ActivityIndicator,
  Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Trophy } from 'lucide-react-native';
import { getInitials } from '../functions/Avatar';
import { delete_api, get_api, patch_api, post_api } from '../../../utils/api';
import { useSelector } from 'react-redux';

// ==========================================
// DATE & TIME FORMATTER (YYYY-MM-DD HH:mm)
// ==========================================
const formatCompletedDate = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return '';
  }
};

// ==========================================
// 1. REUSABLE ANIMATED SKELETON ITEM
// ==========================================
const SkeletonItem = ({ width, height, borderRadius = 8, style, isDark }) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#27272A' : '#E4E4E7',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

// ==========================================
// 2. MODULAR SECTION SKELETON PLACEHOLDERS
// ==========================================
const ProfileCardSkeleton = ({ isDark, theme }) => (
  <View style={[stylesProfile(theme).profileCard, { alignItems: 'center' }]}>
    <SkeletonItem width={72} height={72} borderRadius={36} isDark={isDark} />
    <SkeletonItem width={160} height={22} borderRadius={6} isDark={isDark} style={{ marginTop: 16 }} />
    <SkeletonItem width={64} height={20} borderRadius={100} isDark={isDark} style={{ marginTop: 10 }} />
    <SkeletonItem width={130} height={36} borderRadius={100} isDark={isDark} style={{ marginTop: 18 }} />
  </View>
);

const StatsRowSkeleton = ({ isDark, theme }) => (
  <View style={stylesProfile(theme).statsRow}>
    {[1, 2, 3].map((key) => (
      <View key={key} style={stylesProfile(theme).statCard}>
        <SkeletonItem width={46} height={12} borderRadius={4} isDark={isDark} style={{ marginBottom: 8 }} />
        <SkeletonItem width={36} height={24} borderRadius={6} isDark={isDark} />
      </View>
    ))}
  </View>
);

const MatchHistorySkeleton = ({ isDark, theme }) => (
  <View style={{ marginTop: 4 }}>
    {[1, 2, 3].map((key) => (
      <View key={key} style={stylesProfile(theme).matchCard}>
        <View style={stylesProfile(theme).cardHeaderRow}>
          <SkeletonItem width={110} height={13} borderRadius={4} isDark={isDark} />
          <SkeletonItem width={90} height={13} borderRadius={4} isDark={isDark} />
        </View>
        <View style={stylesProfile(theme).cardBodyRow}>
          <View style={stylesProfile(theme).participantsColumn}>
            <SkeletonItem width={120} height={16} borderRadius={5} isDark={isDark} style={{ marginBottom: 6 }} />
            <SkeletonItem width={90} height={14} borderRadius={4} isDark={isDark} />
          </View>
          <View style={stylesProfile(theme).scoreColumn}>
            <SkeletonItem width={45} height={22} borderRadius={5} isDark={isDark} style={{ marginBottom: 4 }} />
            <SkeletonItem width={95} height={12} borderRadius={4} isDark={isDark} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const CheckIcon = ({ color }) => (
  <Text style={{ fontSize: 13, fontWeight: '800', color, marginRight: 5 }}>✓</Text>
);

const PlusIcon = ({ color }) => (
  <Text style={{ fontSize: 15, fontWeight: '600', color, marginRight: 5 }}>+</Text>
);

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const PlayerProfile = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? dark : light;
  const route = useRoute();
  const player = route?.params?.item || {};
  const navigation = useNavigation();

  const user = useSelector((state) => state.auth);
  const currentUserId = user?.user?._id || user?.user?.id || user?.id;

  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);

  // Loading states
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState(
    player?.connectionStatus || 'none'
  );
  const [connectionId, setConnectionId] = useState(player?.connectionId || null);
  const [btnLoading, setBtnLoading] = useState(false);

  const styles = stylesProfile(theme);
  const isSelf = currentUserId && player?._id && currentUserId.toString() === player?._id.toString();

  // 1. Fetch Connection Status
  const fetchConnectionStatus = useCallback(async () => {
    if (!player?._id || isSelf) {
      setLoadingStatus(false);
      return;
    }

    try {
      setLoadingStatus(true);
      const res = await get_api(`/connections/status/${player._id}`, user?.token);
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success) {
        setConnectionStatus(data?.status);
        setConnectionId(data?.connectionId || null);
      }
    } catch (error) {
      console.error('Fetch connection status error:', error);
    } finally {
      setLoadingStatus(false);
    }
  }, [player?._id, user?.token, isSelf]);

  // 2. Fetch Player Stats
  const fetchStats = useCallback(async () => {
    if (!player?._id) {
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      const res = await get_api(`/matches/stats/${player._id}`, user?.token);
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success) {
        setStats(data?.stats);
      }
    } catch (error) {
      console.error('Fetch player stats error:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [player?._id, user?.token]);

  // 3. Fetch Completed Matches Only
  const fetchMatchHistory = useCallback(async () => {
    if (!player?._id) {
      setLoadingMatches(false);
      return;
    }

    try {
      setLoadingMatches(true);
      const res = await get_api(`/matches/user/${player._id}?status=COMPLETED&limit=20`, user?.token);
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success && Array.isArray(data?.matches)) {
        // Enforce completed matches only
        const completedOnly = data.matches.filter((m) => m?.status === 'COMPLETED');
        setMatches(completedOnly);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Fetch match history error:', error);
    } finally {
      setLoadingMatches(false);
    }
  }, [player?._id, user?.token]);

  useEffect(() => {
    fetchConnectionStatus();
    fetchStats();
    fetchMatchHistory();
  }, [fetchConnectionStatus, fetchStats, fetchMatchHistory]);

  // Handle Send Connection Request
  const handleFollow = async () => {
    if (btnLoading || !player?._id) return;

    try {
      setBtnLoading(true);
      const res = await post_api(
        '/connections/request',
        { recipientId: player._id },
        user?.token
      );
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success || res?.status === 200 || res?.status === 201) {
        const isMutualAccepted = data?.connection?.status === 'accepted';
        setConnectionStatus(isMutualAccepted ? 'connected' : 'pending_sent');
        if (data?.connection?._id) {
          setConnectionId(data.connection._id);
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Handle Accept Incoming Request
  const handleAccept = async () => {
    if (btnLoading || !connectionId) return;

    try {
      setBtnLoading(true);
      const res = await patch_api(
        `/connections/${connectionId}/respond`,
        { action: 'accept' },
        user?.token
      );
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success || res?.status === 200) {
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Accept connection error:', error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Handle Cancel / Unfollow
  const handleCancel = async () => {
    if (btnLoading || !connectionId) return;

    try {
      setBtnLoading(true);
      const res = await delete_api(`/connections/${connectionId}`, user?.token);
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data?.success || res?.status === 200) {
        setConnectionStatus('none');
        setConnectionId(null);
      }
    } catch (error) {
      console.error('Cancel connection error:', error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleButtonPress = () => {
    switch (connectionStatus) {
      case 'none':
        handleFollow();
        break;
      case 'pending_received':
        handleAccept();
        break;
      case 'pending_sent':
      case 'connected':
        handleCancel();
        break;
      default:
        break;
    }
  };

  const isPendingSent = connectionStatus === 'pending_sent';
  const isPendingReceived = connectionStatus === 'pending_received';
  const isConnected = connectionStatus === 'connected';
  const isNone = connectionStatus === 'none';

  // DISPLAY UP TO 5 COMPLETED MATCHES
  const displayedMatches = matches.slice(0, 5);
  const hasMoreMatches = matches.length > 5;

  return (
    <SafeAreaView edges={handleEdges()} style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgBase}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" color={theme.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Player Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* PROFILE CARD                                             */}
        {/* ======================================================== */}
        {!player?._id ? (
          <ProfileCardSkeleton isDark={isDark} theme={theme} />
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              {player?.profile_image !== null ? (<Image source={{ uri: player?.profile_image }} style={{ width: 80, height: 80 }} />) : (<Text style={styles.avatarText}>{getInitials(player?.fullName)}</Text>)}
            </View>

            <Text style={styles.playerName}>{player?.fullName || 'Player'}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{player?.role || 'single'}</Text>
              </View>
            </View>

            {!isSelf && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleButtonPress}
                disabled={btnLoading || loadingStatus}
                style={[
                  styles.followButton,
                  isNone || isPendingReceived
                    ? styles.notFollowingButton
                    : styles.followingButton,
                ]}
              >
                {btnLoading || loadingStatus ? (
                  <ActivityIndicator
                    size="small"
                    color={isNone || isPendingReceived ? theme.accentText : theme.textPrimary}
                  />
                ) : isPendingReceived ? (
                  <>
                    <CheckIcon color={theme.accentText} />
                    <Text style={[styles.followButtonText, { color: theme.accentText }]}>
                      Accept Request
                    </Text>
                  </>
                ) : isPendingSent ? (
                  <>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={theme.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.followButtonText, { color: theme.textSecondary }]}>
                      Requested
                    </Text>
                  </>
                ) : isConnected ? (
                  <>
                    <CheckIcon color={theme.textPrimary} />
                    <Text style={[styles.followButtonText, { color: theme.textPrimary }]}>
                      Connected
                    </Text>
                  </>
                ) : (
                  <>
                    <PlusIcon color={theme.accentText} />
                    <Text style={[styles.followButtonText, { color: theme.accentText }]}>
                      Connect
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* STATS ROW                                                */}
        {/* ======================================================== */}
        {loadingStats ? (
          <StatsRowSkeleton isDark={isDark} theme={theme} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MATCHES</Text>
              <Text style={styles.statValue}>
                {stats?.completedMatches ?? player?.totalMatch ?? 0}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>WINS</Text>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {stats?.totalWon ?? player?.winMatch ?? 0}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>WIN RATE</Text>
              <Text style={styles.statValue}>
                {stats?.winRate ?? '0%'}
              </Text>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* COMPLETED MATCH HISTORY (EXACT ATTACHED DESIGN)           */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Completed Matches {!loadingMatches && `(${displayedMatches.length})`}
          </Text>
          {hasMoreMatches && (
            <Text style={styles.totalMatchesCount}>
              Total: {matches.length}
            </Text>
          )}
        </View>

        {loadingMatches ? (
          <MatchHistorySkeleton isDark={isDark} theme={theme} />
        ) : displayedMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="badminton"
              size={36}
              color={theme.borderColor}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyText}>No completed matches recorded yet</Text>
          </View>
        ) : (
          <>
            {displayedMatches.map((item) => {
              const wonA = item?.liveState?.gamesWonSideA ?? 0;
              const wonB = item?.liveState?.gamesWonSideB ?? 0;
              const isWinnerA =
                item?.liveState?.matchWinner === 'sideA' || wonA > wonB;

              const winnerName = isWinnerA
                ? item?.sideA?.displayName || item?.sideA?.primaryUser?.fullName || 'Player 1'
                : item?.sideB?.displayName || item?.sideB?.primaryUser?.fullName || 'Player 2';

              const loserName = isWinnerA
                ? item?.sideB?.displayName || item?.sideB?.primaryUser?.fullName || 'Player 2'
                : item?.sideA?.displayName || item?.sideA?.primaryUser?.fullName || 'Player 1';

              const winnerGames = isWinnerA ? wonA : wonB;
              const loserGames = isWinnerA ? wonB : wonA;
              const mainScore = `${winnerGames} - ${loserGames}`;

              // Comma-separated game set scores
              const games = item?.liveState?.games || [];
              const setScoresString = games
                .filter((g) => g.isCompleted || g.sideAScore > 0 || g.sideBScore > 0)
                .map((g) => {
                  const scoreWinner = isWinnerA ? g.sideAScore : g.sideBScore;
                  const scoreLoser = isWinnerA ? g.sideBScore : g.sideAScore;
                  return `${scoreWinner}-${scoreLoser}`;
                })
                .join(', ');

              const formatLabel = `${item.format || 'SINGLES'} • BEST OF ${item.rules?.bestOf || 3}`;
              const matchDate = formatCompletedDate(item.updatedAt || item.createdAt);

              return (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('ScoreCard', { matchId: item._id, match: item })
                  }
                  style={styles.matchCard}
                >
                  {/* TOP HEADER ROW: FORMAT & DATE */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.completedMetaText}>{formatLabel}</Text>
                    <Text style={styles.completedDateText}>{matchDate}</Text>
                  </View>

                  {/* BODY ROW: WINNER/LOSER & SCORE */}
                  <View style={styles.cardBodyRow}>
                    <View style={styles.participantsColumn}>
                      <View style={styles.winnerWrap}>
                        <Text numberOfLines={1} style={styles.winnerNameText}>
                          {winnerName}
                        </Text>
                        <Trophy size={14} color="#EAB308" style={{ marginLeft: 6 }} />
                      </View>

                      <Text numberOfLines={1} style={styles.loserNameText}>
                        {loserName}
                      </Text>
                    </View>

                    <View style={styles.scoreColumn}>
                      <Text style={styles.completedScoreText}>{mainScore}</Text>
                      {setScoresString ? (
                        <Text style={styles.completedSetScoresText}>
                          {setScoresString}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {hasMoreMatches && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('Matches', { filter: 'Completed' })}
              >
                <Text style={styles.viewMoreText}>
                  View all {matches.length} completed matches ({matches.length - 5} more)
                </Text>
                <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlayerProfile;

const stylesProfile = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bgBase,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerBtn: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    scrollContent: {
      paddingTop: 16,
      paddingBottom: 32,
    },
    profileCard: {
      backgroundColor: theme.bgSurface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 22,
      paddingHorizontal: 20,
    },
    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#27272A',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderColor,
      overflow : 'hidden'
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    playerName: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      marginTop: 16,
      letterSpacing: -0.4,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    badge: {
      backgroundColor: '#27272A',
      paddingHorizontal: 12,
      paddingVertical: 4.5,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.8,
    },
    followButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      paddingVertical: 9,
      paddingHorizontal: 24,
      borderRadius: 100,
      minWidth: 130,
    },
    notFollowingButton: {
      backgroundColor: theme.accentBg,
    },
    followingButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    followButtonText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.bgSurface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderColor,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    totalMatchesCount: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    matchCard: {
      backgroundColor: theme.bgSurface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderColor,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 12,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    completedMetaText: {
      fontSize: 11.5,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: theme.textTertiary,
    },
    completedDateText: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: theme.textTertiary,
    },
    cardBodyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    participantsColumn: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: 12,
    },
    winnerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    winnerNameText: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: theme.textPrimary,
    },
    loserNameText: {
      fontSize: 14.5,
      fontWeight: '500',
      marginTop: 4,
      color: theme.textSecondary,
    },
    scoreColumn: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    completedScoreText: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: theme.textPrimary,
    },
    completedSetScoresText: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 3,
      color: theme.textTertiary,
    },
    viewMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: theme.bgSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginTop: 6,
    },
    viewMoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginRight: 4,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.textTertiary,
      fontWeight: '500',
    },
  });