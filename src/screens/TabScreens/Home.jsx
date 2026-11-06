import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  Animated,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { useSelector } from 'react-redux';
import { get_api } from '../../utils/api';
import { Bell, Clock, Calendar, ChevronRight, Trophy } from 'lucide-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WS_BASE_URL } from '../../utils/api'
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;



// Format timestamp to "YYYY-MM-DD HH:mm"
const formatCompletedDate = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const formatScheduleTime = (isoString) => {
  if (!isoString) return 'Scheduled';
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} • ${time}`;
  } catch {
    return 'Upcoming';
  }
};

// --- High-Performance Smooth Animated Dot ---
const SmoothDot = ({ isActive, activeColor, inactiveColor }) => {
  const dotWidth = useRef(new Animated.Value(isActive ? 22 : 6)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dotWidth, {
        toValue: isActive ? 22 : 6,
        friction: 8,
        tension: 60,
        useNativeDriver: false,
      }),
      Animated.timing(dotOpacity, {
        toValue: isActive ? 1 : 0.35,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: dotWidth,
          opacity: dotOpacity,
          backgroundColor: isActive ? activeColor : inactiveColor,
        },
      ]}
    />
  );
};

// --- Smooth Dots Container ---
const PaginationDots = ({ count, activeIndex, colors }) => {
  if (count <= 1) return null;

  return (
    <View style={styles.paginationDotsContainer}>
      {Array.from({ length: count }).map((_, idx) => (
        <SmoothDot
          key={`dot-${idx}`}
          isActive={idx === activeIndex}
          activeColor={colors.textPrimary}
          inactiveColor={colors.borderColor}
        />
      ))}
    </View>
  );
};

// --- Skeleton Box Loader ---
const SkeletonBox = ({ width, height, borderRadius = 8, style, shimmerAnim, isDark }) => (
  <Animated.View
    style={[
      {
        width,
        height,
        borderRadius,
        backgroundColor: isDark ? '#27272A' : '#E4E4E7',
        opacity: shimmerAnim,
      },
      style,
    ]}
  />
);

// --- Live Match Skeleton Card ---
const LiveMatchSkeleton = ({ colors, isDark, shimmerAnim }) => (
  <View
    style={[
      styles.liveCard,
      {
        width: CARD_WIDTH,
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderColor,
        marginBottom: 0,
      },
    ]}
  >
    <View style={styles.liveHeaderRow}>
      <SkeletonBox width={100} height={22} borderRadius={11} shimmerAnim={shimmerAnim} isDark={isDark} />
      <SkeletonBox width={70} height={14} shimmerAnim={shimmerAnim} isDark={isDark} />
    </View>

    <View style={styles.liveMatchRow}>
      <View style={styles.liveTeamColumnLeft}>
        <SkeletonBox width={90} height={16} shimmerAnim={shimmerAnim} isDark={isDark} />
        <SkeletonBox width={65} height={12} style={{ marginTop: 6 }} shimmerAnim={shimmerAnim} isDark={isDark} />
      </View>

      <SkeletonBox width={50} height={26} shimmerAnim={shimmerAnim} isDark={isDark} />

      <View style={styles.liveTeamColumnRight}>
        <SkeletonBox width={90} height={16} shimmerAnim={shimmerAnim} isDark={isDark} />
        <SkeletonBox width={65} height={12} style={{ marginTop: 6 }} shimmerAnim={shimmerAnim} isDark={isDark} />
      </View>
    </View>

    <SkeletonBox width="100%" height={46} borderRadius={14} shimmerAnim={shimmerAnim} isDark={isDark} />
  </View>
);

// --- Upcoming Match Skeleton Card ---
const UpcomingMatchSkeleton = ({ colors, isDark, shimmerAnim }) => (
  <View
    style={[
      styles.upcomingCard,
      {
        width: CARD_WIDTH,
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderColor,
      },
    ]}
  >
    <View style={styles.upcomingHeaderRow}>
      <SkeletonBox width={90} height={22} borderRadius={11} shimmerAnim={shimmerAnim} isDark={isDark} />
      <SkeletonBox width={85} height={14} shimmerAnim={shimmerAnim} isDark={isDark} />
    </View>

    <View style={styles.upcomingMatchupRow}>
      <View style={styles.upcomingCompetitorLeft}>
        <SkeletonBox width={32} height={32} borderRadius={16} shimmerAnim={shimmerAnim} isDark={isDark} />
        <SkeletonBox width={80} height={15} shimmerAnim={shimmerAnim} isDark={isDark} />
      </View>

      <SkeletonBox width={24} height={16} borderRadius={4} shimmerAnim={shimmerAnim} isDark={isDark} />

      <View style={styles.upcomingCompetitorRight}>
        <SkeletonBox width={32} height={32} borderRadius={16} shimmerAnim={shimmerAnim} isDark={isDark} />
        <SkeletonBox width={80} height={15} shimmerAnim={shimmerAnim} isDark={isDark} />
      </View>
    </View>

    <View style={[styles.upcomingFooterRow, { borderTopColor: colors.borderColor }]}>
      <View style={styles.upcomingMetaLeft}>
        <SkeletonBox width={100} height={14} shimmerAnim={shimmerAnim} isDark={isDark} />
        <SkeletonBox width={75} height={11} style={{ marginTop: 5 }} shimmerAnim={shimmerAnim} isDark={isDark} />
      </View>
      <SkeletonBox width={96} height={32} borderRadius={12} shimmerAnim={shimmerAnim} isDark={isDark} />
    </View>
  </View>
);

// --- Conditional Animated Bell ---
const AnimatedBell = ({ size = 20, color = '#000000', count = 0 }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-16, { duration: 110 }),
          withTiming(16, { duration: 220 }),
          withTiming(-10, { duration: 160 }),
          withTiming(10, { duration: 160 }),
          withTiming(0, { duration: 110 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 150 });
    }

    return () => cancelAnimation(rotation);
  }, [count, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Reanimated.View style={animatedStyle}>
      <Bell size={size} color={color} strokeWidth={2} />
    </Reanimated.View>
  );
};

// --- Animated Dynamic Recent Match Card ---
const AnimatedRecentCard = ({ item, index, colors, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scalePress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scalePress, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scalePress, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Determine winner, loser, and score calculations dynamically
  const wonA = item?.liveState?.gamesWonSideA ?? 0;
  const wonB = item?.liveState?.gamesWonSideB ?? 0;
  const isWinnerA = item?.liveState?.matchWinner === 'sideA' || wonA > wonB;

  const winnerName = isWinnerA
    ? item?.sideA?.displayName || item?.sideA?.primaryUser?.fullName || 'Player 1'
    : item?.sideB?.displayName || item?.sideB?.primaryUser?.fullName || 'Player 2';

  const loserName = isWinnerA
    ? item?.sideB?.displayName || item?.sideB?.primaryUser?.fullName || 'Player 2'
    : item?.sideA?.displayName || item?.sideA?.primaryUser?.fullName || 'Player 1';

  const winnerGames = isWinnerA ? wonA : wonB;
  const loserGames = isWinnerA ? wonB : wonA;
  const scoreDisplay = `${winnerGames} - ${loserGames}`;

  // Comma-separated game set scores
  const games = item?.liveState?.games || [];
  const setsDisplay = games
    .filter((g) => g.isCompleted || g.sideAScore > 0 || g.sideBScore > 0)
    .map((g) => {
      const sWinner = isWinnerA ? g.sideAScore : g.sideBScore;
      const sLoser = isWinnerA ? g.sideBScore : g.sideAScore;
      return `${sWinner}-${sLoser}`;
    })
    .join(', ');

  const category = `${item?.format || 'SINGLES'} • BEST OF ${item?.rules?.bestOf || 3}`;
  const dateFormatted = formatCompletedDate(item?.updatedAt || item?.createdAt);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scalePress }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.matchCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
        ]}
        onPress={onPress}
      >
        <View style={styles.matchMetaRow}>
          <Text style={[styles.matchCategory, { color: colors.textTertiary }]}>
            {category}
          </Text>
          <Text style={[styles.matchDate, { color: colors.textTertiary }]}>
            {dateFormatted}
          </Text>
        </View>

        <View style={styles.matchContentRow}>
          <View style={styles.playersColumn}>
            <View style={styles.winnerWrap}>
              <Text style={[styles.winnerName, { color: colors.textPrimary }]}>
                {winnerName}
              </Text>
              <Trophy size={14} color="#EAB308" style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.loserName, { color: colors.textSecondary }]}>
              {loserName}
            </Text>
          </View>

          <View style={styles.scoreColumn}>
            <Text style={[styles.matchScore, { color: colors.textPrimary }]}>
              {scoreDisplay}
            </Text>
            {setsDisplay ? (
              <Text style={[styles.setScores, { color: colors.textTertiary }]}>
                {setsDisplay}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Home = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const user = useSelector((state) => state?.auth);

  const [liveFeeds, setLiveFeeds] = useState([]);
  const [soonFeeds, setSoonFeeds] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active indices for snap pagination
  const [activeLiveIndex, setActiveLiveIndex] = useState(0);
  const [activeUpcomingIndex, setActiveUpcomingIndex] = useState(0);

  const [notificationCount, setNotificationCount] = useState(0);

  // Native WebSocket ref for in-place multi-match live stream
  const wsRef = useRef(null);

  // Subtle live badge pulse and skeleton shimmer
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  const handleOpenDrawer = () => {
    navigation.getParent()?.openDrawer();
  };

  const get_live = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoadingLive(true);
        const res = await get_api('/matches/mutual-live', user?.token);
        if (res?.success) {
          setLiveFeeds(res?.matches || []);
        }
      } catch (error) {
        console.error('Failed to fetch live matches:', error);
      } finally {
        if (!isRefresh) setLoadingLive(false);
      }
    },
    [user?.token]
  );

  const get_upcoming = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoadingUpcoming(true);
        const res = await get_api('/matches/mutual-upcoming', user?.token);
        if (res?.success) {
          setSoonFeeds(res?.matches || []);
        }
      } catch (error) {
        console.error('Failed to fetch upcoming matches:', error);
      } finally {
        if (!isRefresh) setLoadingUpcoming(false);
      }
    },
    [user?.token]
  );

  // Fetch at most 3 completed matches from /matches/my-matches
  const get_recent = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoadingRecent(true);
        const res = await get_api('/matches/my-matches?status=COMPLETED&limit=10', user?.token);
        if (res?.success && Array.isArray(res?.matches)) {
          const completed = res.matches
            .filter((m) => m?.status === 'COMPLETED')
            .slice(0, 3);
          setRecentMatches(completed);
        } else {
          setRecentMatches([]);
        }
      } catch (error) {
        console.error('Failed to fetch recent matches:', error);
      } finally {
        if (!isRefresh) setLoadingRecent(false);
      }
    },
    [user?.token]
  );

  useEffect(() => {
    get_live();
    get_upcoming();
    get_recent();
  }, [get_live, get_upcoming, get_recent]);


  const get_notification_count = async () => {
    try {
      const res = await get_api('/notifications/unread-count', user?.token)
      if (res.success) {
        setNotificationCount(res?.unreadCount || 0)
      }
    } catch (error) {

    }
  }

  useEffect(() => {
    get_notification_count()
  }, [])
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([get_live(true), get_upcoming(true), get_recent(true)]);
    } catch (err) {
      console.error('Pull-to-refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [get_live, get_upcoming, get_recent]);

  // ========================================================
  // NATIVE WEBSOCKET FOR MULTIPLE LIVE MATCHES
  // ========================================================
  useEffect(() => {
    if (!user?.token) return;

    const wsUrl = `${WS_BASE_URL}?token=${user.token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      liveFeeds.forEach((m) => {
        if (m?._id) {
          ws.send(JSON.stringify({ action: 'join_match', matchId: m._id.toString() }));
        }
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data?.matchId) return;

        const targetId = data.matchId.toString();

        if (data?.type === 'LIVE_SCORE' || (data?.event === 'match:update' && data?.liveState)) {
          if (data?.matchCompleted) {
            setLiveFeeds((prev) => prev.filter((m) => m?._id?.toString() !== targetId));
            get_live(true);
            get_upcoming(true);
            get_recent(true);
          } else {
            setLiveFeeds((prev) =>
              prev.map((item) => {
                if (item?._id?.toString() === targetId) {
                  return {
                    ...item,
                    status: data.status || item.status,
                    liveState: data.liveState || item.liveState,
                  };
                }
                return item;
              })
            );
          }
        } else if (
          data?.type === 'TOSS_COMPLETED' ||
          data?.status === 'IN_PROGRESS' ||
          data?.action === 'invitation_responded' ||
          data?.type === 'MATCH_CREATED'
        ) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'join_match', matchId: targetId }));
          }
          get_live(true);
          get_upcoming(true);
          get_recent(true);
        }
      } catch (err) {
        console.error('Home WebSocket parse error:', err);
      }
    };

    ws.onerror = (e) => {
      // Handled silently
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user?.token, get_live, get_upcoming, get_recent, liveFeeds]);

  // Re-subscribe when new matches appear in liveFeeds
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && liveFeeds.length > 0) {
      liveFeeds.forEach((m) => {
        if (m?._id) {
          wsRef.current.send(JSON.stringify({ action: 'join_match', matchId: m._id.toString() }));
        }
      });
    }
  }, [liveFeeds.length]);

  // Snap index handlers
  const handleLiveScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index !== activeLiveIndex && index >= 0 && index < liveFeeds.length) {
      setActiveLiveIndex(index);
    }
  };

  const handleUpcomingScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index !== activeUpcomingIndex && index >= 0 && index < soonFeeds.length) {
      setActiveUpcomingIndex(index);
    }
  };

  // --- Render Live Match Card ---
  const renderLiveCard = ({ item }) => {
    const currentGameNum = item?.liveState?.currentGameNumber || 1;
    const bestOf = item?.rules?.bestOf || 3;
    const currentGame =
      item?.liveState?.games?.find((g) => g?.gameNumber === currentGameNum) ||
      item?.liveState?.games?.[0] ||
      {};

    const sideAName =
      item?.sideA?.displayName ||
      item?.sideA?.primaryUser?.fullName ||
      'Side A';

    const sideBName =
      item?.sideB?.displayName ||
      item?.sideB?.primaryUser?.fullName ||
      'Side B';

    const gamesWonA = item?.liveState?.gamesWonSideA ?? 0;
    const gamesWonB = item?.liveState?.gamesWonSideB ?? 0;

    const scoreA = currentGame?.sideAScore ?? 0;
    const scoreB = currentGame?.sideBScore ?? 0;

    return (
      <View
        style={[
          styles.liveCard,
          {
            width: CARD_WIDTH,
            marginBottom: 0,
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
          },
        ]}
      >
        <View style={styles.liveHeaderRow}>
          <View style={styles.liveBadgeContainer}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  backgroundColor: colors.danger,
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.25, 1],
                        outputRange: [0.85, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={[styles.liveBadgeText, { color: colors.danger }]}>
              {item?.status === 'IN_PROGRESS' ? 'MATCH IN PROGRESS' : 'LIVE'}
            </Text>
          </View>
          <Text style={[styles.liveGameMeta, { color: colors.textTertiary }]}>
            Game {currentGameNum} of {bestOf}
          </Text>
        </View>

        <View style={styles.liveMatchRow}>
          <View style={styles.liveTeamColumnLeft}>
            <Text
              numberOfLines={1}
              style={[styles.liveTeamName, { color: colors.textPrimary }]}
            >
              {sideAName}
            </Text>
            <Text style={[styles.liveTeamSub, { color: colors.textTertiary }]}>
              {gamesWonA} {gamesWonA === 1 ? 'game' : 'games'} won
            </Text>
          </View>

          <Text style={[styles.liveScoreText, { color: colors.textPrimary }]}>
            {scoreA} - {scoreB}
          </Text>

          <View style={styles.liveTeamColumnRight}>
            <Text
              numberOfLines={1}
              style={[styles.liveTeamName, { color: colors.textPrimary }]}
            >
              {sideBName}
            </Text>
            <Text style={[styles.liveTeamSub, { color: colors.textTertiary }]}>
              {gamesWonB} {gamesWonB === 1 ? 'game' : 'games'} won
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.resumeButton, { backgroundColor: colors.accentBg }]}
          onPress={() =>
            navigation.navigate('ScoreCard', { matchId: item?._id, match: item })
          }
        >
          <Text style={[styles.resumeButtonText, { color: colors.accentText }]}>
            Watch Now
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Render Upcoming Match Card ---
  const renderUpcomingCard = ({ item }) => {
    const sideAName =
      item?.sideA?.displayName ||
      item?.sideA?.primaryUser?.fullName ||
      'Player 1';

    const sideBName =
      item?.sideB?.displayName ||
      item?.sideB?.primaryUser?.fullName ||
      'Player 2';

    const format = item?.format || 'SINGLES';
    const bestOf = item?.rules?.bestOf ? `BEST OF ${item.rules.bestOf}` : 'BEST OF 1';
    const points = item?.rules?.pointsPerGame ? `${item.rules.pointsPerGame} PTS` : '21 PTS';
    const statusText = item?.status ? item.status.replace(/_/g, ' ') : 'UPCOMING';
    const scheduleDate = formatScheduleTime(item?.createdAt);

    return (
      <View
        style={[
          styles.upcomingCard,
          {
            width: CARD_WIDTH,
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
          },
        ]}
      >
        <View style={styles.upcomingHeaderRow}>
          <View
            style={[
              styles.upcomingStatusBadge,
              {
                backgroundColor: isDark ? '#27272A' : '#E4E4E7',
              },
            ]}
          >
            <Clock size={11} color={colors.textSecondary} />
            <Text style={[styles.upcomingStatusText, { color: colors.textSecondary }]}>
              {statusText}
            </Text>
          </View>

          <Text style={[styles.upcomingRulesTag, { color: colors.textTertiary }]}>
            {format} • {bestOf}
          </Text>
        </View>

        <View style={styles.upcomingMatchupRow}>
          <View style={styles.upcomingCompetitorLeft}>
            <View
              style={[
                styles.playerAvatarCircle,
                { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                {sideAName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.upcomingPlayerTitle, { color: colors.textPrimary }]}
            >
              {sideAName}
            </Text>
          </View>

          <View style={styles.vsBadgeContainer}>
            <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
          </View>

          <View style={styles.upcomingCompetitorRight}>
            <View
              style={[
                styles.playerAvatarCircle,
                { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                {sideBName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.upcomingPlayerTitle, { color: colors.textPrimary }]}
            >
              {sideBName}
            </Text>
          </View>
        </View>

        <View style={[styles.upcomingFooterRow, { borderTopColor: colors.borderColor }]}>
          <View style={styles.upcomingMetaLeft}>
            <View style={styles.metaTimeRow}>
              <Calendar size={12} color={colors.textTertiary} />
              <Text style={[styles.upcomingDateText, { color: colors.textSecondary }]}>
                {scheduleDate}
              </Text>
            </View>
            <Text style={[styles.pointsBadge, { color: colors.textTertiary }]}>
              Target: {points}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.lobbyButton, { backgroundColor: colors.accentBg }]}
            onPress={() =>
              navigation.navigate('ScoreCard', { matchId: item?._id, match: item })
            }
          >
            <Text style={[styles.lobbyButtonText, { color: colors.accentText }]}>
              Match Lobby
            </Text>
            <ChevronRight size={14} color={colors.accentText} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFF' : '#000'}
            colors={[isDark ? '#000' : '#000']}
          />
        }
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.iconButton,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
              ]}
              onPress={handleOpenDrawer}
            >
              <Ionicons name="menu-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.brandTextContainer}>
                <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
                  BadmintonCore
                </Text>
                <Text style={[styles.brandSubtitle, { color: colors.textTertiary }]}>
                  BADMINTON ARENA
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.iconButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('Notification')}
          >
            <AnimatedBell
              size={20}
              color={colors.textPrimary}
              count={notificationCount}
              
            />

            {notificationCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: colors.danger }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
            Welcome Back 👋
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Ready for tournament scoring?
          </Text>
        </View>

        {/* Quick Action Card */}
        <View style={[styles.actionCard, { backgroundColor: colors.accentBg }]}>
          <Text style={styles.actionCategory}>QUICK ACTION</Text>
          <Text style={[styles.actionTitle, { color: colors.accentText }]}>
            Start New Match
          </Text>
          <Text style={styles.actionDescription}>
            Configure singles or doubles, coin toss, and official BWF scoring.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.launchButton, { backgroundColor: colors.accentText }]}
            onPress={() => navigation.navigate('CreateMatch')}
          >
            <Ionicons name="play" size={16} color={colors.accentBg} />
            <Text style={[styles.launchButtonText, { color: colors.accentBg }]}>
              Launch Match Setup
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Matches Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Live Matches
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.viewAllButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('Matches', { filter: 'Live' })}
          >
            <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {loadingLive ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselWrapper}
            contentContainerStyle={styles.carouselContent}
          >
            <LiveMatchSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
            <LiveMatchSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
          </ScrollView>
        ) : (
          <>
            <FlatList
              data={liveFeeds}
              extraData={liveFeeds}
              keyExtractor={(item, index) => item?._id || String(index)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              style={styles.carouselWrapper}
              contentContainerStyle={styles.carouselContent}
              renderItem={renderLiveCard}
              onMomentumScrollEnd={handleLiveScroll}
              ListEmptyComponent={
                <View
                  style={[
                    styles.liveCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 28,
                      marginBottom: 0,
                    },
                  ]}
                >
                  <Text style={[styles.liveTeamSub, { color: colors.textTertiary, fontSize: 13 }]}>
                    No live matches in progress
                  </Text>
                </View>
              }
            />

            <PaginationDots
              count={liveFeeds.length}
              activeIndex={activeLiveIndex}
              colors={colors}
            />
          </>
        )}

        {/* Upcoming Matches Section */}
        <View style={[styles.sectionHeader, { marginTop: liveFeeds.length > 1 ? 8 : 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Upcoming Matches
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.viewAllButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('Matches', { filter: 'Upcoming' })}
          >
            <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {loadingUpcoming ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselWrapper}
            contentContainerStyle={styles.carouselContent}
          >
            <UpcomingMatchSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
            <UpcomingMatchSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
          </ScrollView>
        ) : (
          <>
            <FlatList
              data={soonFeeds}
              keyExtractor={(item, index) => item?._id || String(index)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              style={styles.carouselWrapper}
              contentContainerStyle={styles.carouselContent}
              renderItem={renderUpcomingCard}
              onMomentumScrollEnd={handleUpcomingScroll}
              ListEmptyComponent={
                <View
                  style={[
                    styles.upcomingCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 28,
                    },
                  ]}
                >
                  <Text style={[styles.liveTeamSub, { color: colors.textTertiary, fontSize: 13 }]}>
                    No upcoming matches scheduled
                  </Text>
                </View>
              }
            />

            <PaginationDots
              count={soonFeeds.length}
              activeIndex={activeUpcomingIndex}
              colors={colors}
            />
          </>
        )}

        {/* Recent Matches Header */}
        <View style={[styles.sectionHeader, { marginTop: soonFeeds.length > 1 ? 8 : 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Matches
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.viewAllButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('Matches', { filter: 'Completed' })}
          >
            <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Recent Completed Matches (Max 3) */}
        {loadingRecent && !refreshing ? (
          <View style={{ gap: 10, marginBottom: 12 }}>
            <SkeletonBox width="100%" height={88} borderRadius={18} shimmerAnim={shimmerAnim} isDark={isDark} />
            <SkeletonBox width="100%" height={88} borderRadius={18} shimmerAnim={shimmerAnim} isDark={isDark} />
          </View>
        ) : recentMatches.length === 0 ? (
          <View
            style={[
              styles.matchCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderColor,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 26,
              },
            ]}
          >
            <Text style={[styles.liveTeamSub, { color: colors.textTertiary, fontSize: 13 }]}>
              No recent completed matches found
            </Text>
          </View>
        ) : (
          recentMatches.map((item, index) => (
            <AnimatedRecentCard
              key={item._id || item.id || String(index)}
              item={item}
              index={index}
              colors={colors}
              onPress={() => navigation.navigate('ScoreCard', { matchId: item._id, match: item })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
 
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  welcomeSection: {
    marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    marginTop: 4,
  },
  actionCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
  },
  actionCategory: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  actionDescription: {
    color: '#878787',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 20,
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  launchButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  carouselWrapper: {
    marginHorizontal: -16,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  liveCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveGameMeta: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  liveMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  liveTeamColumnLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  liveTeamColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  liveTeamName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  liveTeamSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  liveScoreText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 12,
  },
  resumeButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  upcomingCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upcomingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 5,
  },
  upcomingStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  upcomingRulesTag: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  upcomingMatchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  upcomingCompetitorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingCompetitorRight: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '800',
  },
  upcomingPlayerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  vsBadgeContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upcomingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  upcomingMetaLeft: {
    justifyContent: 'center',
  },
  metaTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  upcomingDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsBadge: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  lobbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  lobbyButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  viewAllButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchCard: {
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchCategory: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  matchDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playersColumn: {
    flex: 1,
  },
  winnerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerName: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  loserName: {
    fontSize: 14.5,
    fontWeight: '500',
    marginTop: 4,
  },
  scoreColumn: {
    alignItems: 'flex-end',
  },
  matchScore: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  setScores: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
});