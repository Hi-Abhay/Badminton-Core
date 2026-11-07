import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  useColorScheme,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Trophy } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { useNavigation, useRoute } from '@react-navigation/native';
import { get_api, patch_api } from '../../utils/api';
import { useSelector } from 'react-redux';
import { WS_BASE_URL } from '../../utils/api';

const TABS = ['Completed', 'Live', 'Upcoming'];
const COMPLETED_SUB_FILTERS = ['All', 'Singles', 'Doubles'];
const MUTUAL_SUB_FILTERS = ['All', 'My Matches', "Friends' Matches"];
let matchesSessionCache = null;

// Helper: Formats match completion date to "YYYY-MM-DD HH:mm"
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

// --- Skeleton Card Loader ---
const MatchCardSkeleton = ({ colors, isDark, shimmerAnim }) => (
  <View
    style={[
      styles.matchCard,
      {
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderColor,
      },
    ]}
  >
    <View style={styles.cardHeaderRow}>
      <Animated.View
        style={[
          styles.skeletonBox,
          {
            width: 120,
            height: 13,
            opacity: shimmerAnim,
            backgroundColor: isDark ? '#27272A' : '#E4E4E7',
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonBox,
          {
            width: 72,
            height: 20,
            borderRadius: 6,
            opacity: shimmerAnim,
            backgroundColor: isDark ? '#27272A' : '#E4E4E7',
          },
        ]}
      />
    </View>

    <View style={styles.cardBodyRow}>
      <View style={styles.participantsColumn}>
        <Animated.View
          style={[
            styles.skeletonBox,
            {
              width: 140,
              height: 16,
              marginBottom: 8,
              opacity: shimmerAnim,
              backgroundColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBox,
            {
              width: 110,
              height: 16,
              opacity: shimmerAnim,
              backgroundColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        />
      </View>

      <View style={styles.scoreColumn}>
        <Animated.View
          style={[
            styles.skeletonBox,
            {
              width: 52,
              height: 24,
              marginBottom: 6,
              opacity: shimmerAnim,
              backgroundColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonBox,
            {
              width: 75,
              height: 12,
              opacity: shimmerAnim,
              backgroundColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        />
      </View>
    </View>
  </View>
);

const Matches = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const user = useSelector((state) => state?.auth);
  const route = useRoute();
  const filterParam = route?.params?.filter || 'Completed';

  const normalizeFilter = useCallback((value) => {
    const match = TABS.find(
      (tab) => tab.toLowerCase() === String(value ?? '').toLowerCase()
    );
    return match || 'Completed';
  }, []);

  // Universal current user ID
  const currentUserId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  const [activeTab, setActiveTab] = useState(normalizeFilter(filterParam));
  const [subFilter, setSubFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Feeds state
  const [myMatches, setMyMatches] = useState(matchesSessionCache?.myMatches || []);
  const [friendsLive, setFriendsLive] = useState(matchesSessionCache?.friendsLive || []);
  const [friendsUpcoming, setFriendsUpcoming] = useState(matchesSessionCache?.friendsUpcoming || []);
  const [friendsCompleted, setFriendsCompleted] = useState(matchesSessionCache?.friendsCompleted || []);

  const [loading, setLoading] = useState(!matchesSessionCache);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const wsRef = useRef(null);

  // Sync route param filter
  useEffect(() => {
    if (route.params?.filter) {
      setActiveTab(normalizeFilter(route.params.filter));
      setSubFilter('All');
    }
  }, [route.params?.filter, normalizeFilter]);

  // Skeleton shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
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
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  // Floating Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message, type = 'success', onComplete) => {
    setToast({ visible: true, message, type });

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 1,
        tension: 85,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
      if (onComplete) onComplete();
    });
  }, [toastAnim]);

  // 1. Parallel Data Fetcher
  const fetchMatches = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else if (!matchesSessionCache) {
          setLoading(true);
        }

        const [myRes, liveRes, upcomingRes, compFriendsRes] = await Promise.allSettled([
          get_api('/matches/my-matches', user?.token),
          get_api('/matches/mutual-live', user?.token),
          get_api('/matches/mutual-upcoming', user?.token),

        ]);

        let fetchedMy = [];
        let fetchedFriendsLive = [];
        let fetchedFriendsUpcoming = [];
        let fetchedFriendsCompleted = [];

        if (myRes.status === 'fulfilled' && myRes.value?.success) {
          fetchedMy = myRes.value.matches || [];
          setMyMatches(fetchedMy);
        }

        if (liveRes.status === 'fulfilled' && liveRes.value?.success) {
          fetchedFriendsLive = liveRes.value.matches || [];
          setFriendsLive(fetchedFriendsLive);
        }

        if (upcomingRes.status === 'fulfilled' && upcomingRes.value?.success) {
          fetchedFriendsUpcoming = upcomingRes.value.matches || [];
          setFriendsUpcoming(fetchedFriendsUpcoming);
        }

        // if (compFriendsRes.status === 'fulfilled' && compFriendsRes.value?.success) {
        //   fetchedFriendsCompleted = compFriendsRes.value.matches || [];
        //   setFriendsCompleted(fetchedFriendsCompleted);
        // }

        matchesSessionCache = {
          myMatches: fetchedMy,
          friendsLive: fetchedFriendsLive,
          friendsUpcoming: fetchedFriendsUpcoming,
          friendsCompleted: fetchedFriendsCompleted,
        };
      } catch (error) {
        // console.error('Matches fetch error:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.token]
  );

  useEffect(() => {
    if (!matchesSessionCache) {
      fetchMatches(false);
    }
  }, [fetchMatches]);

  // REAL-TIME NATIVE WEBSOCKET MULTIPLEXING
  useEffect(() => {
    if (!user?.token) return;

    const wsUrl = `${WS_BASE_URL}?token=${user.token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const allLive = [
        ...myMatches.filter((m) => m?.status === 'IN_PROGRESS'),
        ...friendsLive,
      ];
      allLive.forEach((m) => {
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
            setMyMatches((prev) =>
              prev.map((m) =>
                m._id.toString() === targetId
                  ? { ...m, status: 'COMPLETED', liveState: data.liveState || m.liveState }
                  : m
              )
            );

            setFriendsLive((prev) => {
              const finished = prev.find((m) => m._id.toString() === targetId);
              if (finished) {
                setFriendsCompleted((fPrev) => [
                  { ...finished, status: 'COMPLETED', liveState: data.liveState || finished.liveState },
                  ...fPrev.filter((m) => m._id.toString() !== targetId),
                ]);
              }
              return prev.filter((m) => m._id.toString() !== targetId);
            });

            fetchMatches(true);
          } else {
            setMyMatches((prev) =>
              prev.map((item) =>
                item._id.toString() === targetId
                  ? {
                    ...item,
                    status: data.status || item.status,
                    liveState: data.liveState || item.liveState,
                  }
                  : item
              )
            );

            setFriendsLive((prev) =>
              prev.map((item) =>
                item._id.toString() === targetId
                  ? {
                    ...item,
                    status: data.status || item.status,
                    liveState: data.liveState || item.liveState,
                  }
                  : item
              )
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
          fetchMatches(true);
        }
      } catch (err) {
        // console.error('Matches WS parse error:', err);
      }
    };

    ws.onerror = (e) => {
      // console.warn('Matches WS notice:', e.message || 'Connecting...');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user?.token, fetchMatches, myMatches, friendsLive]);

  // Subscribe to newly loaded live match IDs
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const activeIds = [
        ...myMatches.filter((m) => m?.status === 'IN_PROGRESS'),
        ...friendsLive,
      ].map((m) => m?._id?.toString()).filter(Boolean);

      activeIds.forEach((id) => {
        wsRef.current.send(JSON.stringify({ action: 'join_match', matchId: id }));
      });
    }
  }, [myMatches, friendsLive]);

  // ==========================================
  // FIXED IDENTITY HELPERS (SUPPORTS DOUBLES)
  // ==========================================
  const isUserSideA = useCallback(
    (item) => {
      if (!currentUserId || !item?.sideA) return false;
      const primaryId = item.sideA?.primaryUser?._id || item.sideA?.primaryUser;
      const partnerId = item.sideA?.partnerUser?._id || item.sideA?.partnerUser;

      return (
        String(primaryId) === String(currentUserId) ||
        String(partnerId) === String(currentUserId)
      );
    },
    [currentUserId]
  );

  const isUserSideB = useCallback(
    (item) => {
      if (!currentUserId || !item?.sideB) return false;
      const primaryId = item.sideB?.primaryUser?._id || item.sideB?.primaryUser;
      const partnerId = item.sideB?.partnerUser?._id || item.sideB?.partnerUser;

      return (
        String(primaryId) === String(currentUserId) ||
        String(partnerId) === String(currentUserId)
      );
    },
    [currentUserId]
  );

  const isParticipant = useCallback(
    (item) => isUserSideA(item) || isUserSideB(item),
    [isUserSideA, isUserSideB]
  );

  // Challenge Response
  const handleRespond = useCallback(
    async (matchId, action) => {
      const body = { action };
      try {
        setActionLoadingId(matchId);
        const res = await patch_api(`/matches/${matchId}/respond`, body, user?.token);

        if (res?.success) {
          if (action === 'ACCEPT') {
            showToast('Best of luck! Challenge accepted 🔥', 'success');
          } else {
            showToast('Match challenge declined.', 'info');
          }
          fetchMatches(true);
        }
      } catch (error) {
        showToast(error?.message || 'Failed to update match', 'error');
      } finally {
        setActionLoadingId(null);
      }
    },
    [user?.token, showToast, fetchMatches]
  );

  // ==============================================================
  // FIXED NAVIGATION LOGIC (FILTER BASED ON CREATOR ID/CURRENT ID)
  // ==============================================================
  const handleCardPress = useCallback(
    (item) => {
      const isSideA = isUserSideA(item);
      const isSideB = isUserSideB(item);

      // Safe Host Check: Handles populated/unpopulated IDs and type mismatches. 
      const creatorId = item?.createdBy?._id || item?.createdBy;
      const isHost = creatorId ? String(creatorId) === String(currentUserId) : isSideA;

      const userInMatch = isSideA || isSideB;

      // 1. Spectator View
      if (!userInMatch) {
        navigation.navigate('ScoreCard', { matchId: item._id, match: item });
        return;
      }

      // 2. Pending Match
      if (item?.status === 'INVITATION_PENDING') {
        if (isHost) {
          showToast('Invite sent. Waiting for opponent to accept.', 'info');
        } else {
          navigation.navigate('ScoreCard', { matchId: item._id, match: item });
        }
        return;
      }

      // 3. Toss Ready
      if (item.status === 'TOSS_READY') {
        if (isHost) {
          navigation.navigate('Toss', { match: item });
        } else {
          showToast('Match not live yet. Creator will start the toss.', 'info');
        }
        return;
      }

      // 4. Live Match
      if (item.status === 'IN_PROGRESS') {
        if (isHost) {
          navigation.navigate('Live', { match: item });
        } else {
          navigation.navigate('ScoreCard', { matchId: item._id, match: item });
        }
        return;
      }

      // 5. Completed
      navigation.navigate('ScoreCard', { matchId: item._id, match: item });
    },
    [isUserSideA, isUserSideB, navigation, showToast, currentUserId]
  );

  const activeSubFilters = useMemo(() => {
    return activeTab === 'Completed' ? COMPLETED_SUB_FILTERS : MUTUAL_SUB_FILTERS;
  }, [activeTab]);

  const sections = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    const matchesSearch = (m) => {
      if (!cleanQuery) return true;
      const sideAName = (
        m?.sideA?.displayName ||
        m?.sideA?.primaryUser?.fullName ||
        ''
      ).toLowerCase();
      const sideBName = (
        m?.sideB?.displayName ||
        m?.sideB?.primaryUser?.fullName ||
        ''
      ).toLowerCase();
      return sideAName.includes(cleanQuery) || sideBName.includes(cleanQuery);
    };

    const wrapSectionData = (title, items, customEmptyMsg) => {
      if (items.length === 0) {
        return [
          {
            _id: `empty-${title}-${activeTab}`,
            isEmptyPlaceholder: true,
            emptyText: customEmptyMsg || `No ${title.toLowerCase()} found`,
          },
        ];
      }
      return items;
    };

    // --- COMPLETED TAB ---
    if (activeTab === 'Completed') {
      const formatFilter = (m) => {
        if (subFilter === 'All') return true;
        const fmt = (m?.format || 'SINGLES').toUpperCase();
        return fmt === subFilter.toUpperCase();
      };

      const myCompleted = myMatches.filter(
        (m) => m?.status === 'COMPLETED' && matchesSearch(m) && formatFilter(m)
      );

      return [
        {
          title: 'My Matches',
          actualCount: myCompleted.length,
          data: wrapSectionData(
            'My Matches',
            myCompleted,
            `No completed ${subFilter !== 'All' ? subFilter.toLowerCase() : ''} matches for you`
          ),
        },
      ];
    }

    // --- LIVE TAB ---
    if (activeTab === 'Live') {
      const myLive = myMatches.filter(
        (m) => m?.status === 'IN_PROGRESS' && matchesSearch(m)
      );
      const friends = friendsLive.filter(
        (m) =>
          !myMatches.some((my) => my._id.toString() === m._id.toString()) &&
          matchesSearch(m)
      );

      const result = [];
      if (subFilter === 'All' || subFilter === 'My Matches') {
        result.push({
          title: 'My Matches',
          actualCount: myLive.length,
          data: wrapSectionData('My Matches', myLive, 'No live matches in progress'),
        });
      }
      if (subFilter === 'All' || subFilter === "Friends' Matches") {
        result.push({
          title: "Friends' Matches",
          actualCount: friends.length,
          data: wrapSectionData("Friends' Matches", friends, "No friends' matches currently live"),
        });
      }
      return result;
    }

    // --- UPCOMING TAB ---
    if (activeTab === 'Upcoming') {
      const upcomingStatuses = ['INVITATION_PENDING', 'ACCEPTED', 'TOSS_READY'];
      const myUpcoming = myMatches.filter(
        (m) => upcomingStatuses.includes(m?.status) && matchesSearch(m)
      );
      const friends = friendsUpcoming.filter(
        (m) =>
          !myMatches.some((my) => my._id.toString() === m._id.toString()) &&
          matchesSearch(m)
      );

      const result = [];
      if (subFilter === 'All' || subFilter === 'My Matches') {
        result.push({
          title: 'My Matches',
          actualCount: myUpcoming.length,
          data: wrapSectionData('My Matches', myUpcoming, 'No upcoming matches scheduled'),
        });
      }
      if (subFilter === 'All' || subFilter === "Friends' Matches") {
        result.push({
          title: "Friends' Matches",
          actualCount: friends.length,
          data: wrapSectionData("Friends' Matches", friends, "No friends' matches scheduled"),
        });
      }
      return result;
    }

    return [];
  }, [
    activeTab,
    subFilter,
    searchQuery,
    myMatches,
    friendsLive,
    friendsUpcoming,
    friendsCompleted,
  ]);

  const renderSetScores = useCallback((item) => {
    const games = item?.liveState?.games;
    if (games && games.length > 0) {
      return games
        .filter((g) => g.sideAScore > 0 || g.sideBScore > 0)
        .map((g) => `${g.sideAScore}-${g.sideBScore}`)
        .join('   ');
    }
    return `${item?.rules?.pointsPerGame || 21} pts • Cap 30`;
  }, []);

  const renderMainScore = useCallback((item) => {
    if (item.status === 'COMPLETED' || item.status === 'IN_PROGRESS') {
      const wonA = item?.liveState?.gamesWonSideA ?? 0;
      const wonB = item?.liveState?.gamesWonSideB ?? 0;
      return `${wonA} - ${wonB}`;
    }
    if (item.status === 'TOSS_READY') return 'TOSS';
    return 'VS';
  }, []);

  const getStatusBadge = useCallback(
    (item) => {
      const status = item?.status;
      const isReceiver = isUserSideB(item);
      const userInMatch = isParticipant(item);

      if (!userInMatch && status === 'IN_PROGRESS') {
        return { label: 'SPECTATING', bg: '#EF444420', text: '#EF4444' };
      }

      if (status === 'INVITATION_PENDING') {
        if (isReceiver) {
          return { label: 'INVITE RECEIVED', bg: '#3B82F620', text: '#3B82F6' };
        }
        return { label: 'INVITE SENT', bg: '#6B728020', text: '#9CA3AF' };
      }

      switch (status) {
        case 'IN_PROGRESS':
          return { label: 'LIVE', bg: '#EF444420', text: '#EF4444' };
        case 'COMPLETED':
          return { label: 'FINISHED', bg: '#10B98120', text: '#10B981' };
        case 'TOSS_READY':
          return { label: 'TOSS READY', bg: '#F59E0B20', text: '#F59E0B' };
        default:
          return { label: status, bg: '#6B728020', text: '#9CA3AF' };
      }
    },
    [isUserSideB, isParticipant]
  );

  const renderMatchCard = useCallback(
    ({ item }) => {
      if (item.isEmptyPlaceholder) {
        return (
          <View
            style={[
              styles.emptySectionCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="badminton"
              size={20}
              color={colors.textTertiary}
              style={{ opacity: 0.6 }}
            />
            <Text style={[styles.emptySectionText, { color: colors.textTertiary }]}>
              {item.emptyText}
            </Text>
          </View>
        );
      }

      const formatLabel = `${item.format || 'SINGLES'} • BEST OF ${item.rules?.bestOf || 3}`;

      if (item.status === 'COMPLETED') {
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

        const games = item?.liveState?.games || [];
        const setScoresString = games
          .filter((g) => g.isCompleted || g.sideAScore > 0 || g.sideBScore > 0)
          .map((g) => {
            const scoreWinner = isWinnerA ? g.sideAScore : g.sideBScore;
            const scoreLoser = isWinnerA ? g.sideBScore : g.sideAScore;
            return `${scoreWinner}-${scoreLoser}`;
          })
          .join(', ');

        const matchDate = formatCompletedDate(item.updatedAt || item.createdAt);

        return (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleCardPress(item)}
            style={[
              styles.matchCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.completedMetaText, { color: colors.textTertiary }]}>
                {formatLabel}
              </Text>
              <Text style={[styles.completedDateText, { color: colors.textTertiary }]}>
                {matchDate}
              </Text>
            </View>

            <View style={styles.cardBodyRow}>
              <View style={styles.participantsColumn}>
                <View style={styles.winnerWrap}>
                  <Text
                    numberOfLines={1}
                    style={[styles.winnerNameText, { color: colors.textPrimary }]}>
                    {winnerName}
                  </Text>
                  <Trophy size={14} color="#EAB308" style={{ marginLeft: 6 }} />
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.loserNameText, { color: colors.textSecondary }]}>
                  {loserName}
                </Text>
              </View>

              <View style={styles.scoreColumn}>
                <Text style={[styles.completedScoreText, { color: colors.textPrimary }]}>
                  {mainScore}
                </Text>
                {setScoresString ? (
                  <Text style={[styles.completedSetScoresText, { color: colors.textTertiary }]}>
                    {setScoresString}
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      const badge = getStatusBadge(item);
      const isReceiver = isUserSideB(item);
      const isPending = item.status === 'INVITATION_PENDING';
      const isProcessingThis = actionLoadingId === item._id;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCardPress(item)}
          style={[
            styles.matchCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {formatLabel}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardBodyRow}>
            <View style={styles.participantsColumn}>
              <Text
                numberOfLines={1}
                style={[styles.participantText, { color: colors.textPrimary }]}
              >
                {item.sideA?.displayName || 'Player 1'}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.participantText, { color: colors.textPrimary }]}
              >
                {item.sideB?.displayName || 'Player 2'}
              </Text>
            </View>

            <View style={styles.scoreColumn}>
              <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
                {renderMainScore(item)}
              </Text>
              <Text style={[styles.setScoresText, { color: colors.textTertiary }]}>
                {renderSetScores(item)}
              </Text>
            </View>
          </View>

          {isPending && isReceiver && (
            <View style={[styles.cardActionRow, { borderTopColor: colors.borderColor }]}>
              {isProcessingThis ? (
                <ActivityIndicator
                  size="small"
                  color={colors.textPrimary}
                  style={{ flex: 1, paddingVertical: 8 }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRespond(item._id, 'DECLINE')}
                    style={[styles.actionBtn, styles.declineBtn, { borderColor: colors.borderColor }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                      Decline
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleRespond(item._id, 'ACCEPT')}
                    style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.accentBg }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.accentText }]}>
                      Accept Challenge
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [
      colors,
      actionLoadingId,
      getStatusBadge,
      isUserSideB,
      handleCardPress,
      handleRespond,
      renderMainScore,
      renderSetScores,
    ]
  );

  const totalMatchesCount = useMemo(
    () => sections.reduce((acc, curr) => acc + (curr.actualCount || 0), 0),
    [sections]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges ? handleEdges() : ['top', 'left', 'right']}
    >
      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              backgroundColor:
                toast.type === 'error'
                  ? '#DC2626'
                  : toast.type === 'info'
                    ? colors.bgSurface
                    : colors.accentBg,
              borderColor: toast.type === 'info' ? colors.borderColor : 'transparent',
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-35, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={
              toast.type === 'error'
                ? 'alert-circle'
                : toast.type === 'info'
                  ? 'information-circle'
                  : 'trophy'
            }
            size={18}
            color={toast.type === 'info' ? colors.textPrimary : colors.accentText}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.toastText,
              {
                color: toast.type === 'info' ? colors.textPrimary : colors.accentText,
              },
            ]}
          >
            {toast.message}
          </Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Matches
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.newMatchButton, { backgroundColor: colors.accentBg }]}
          onPress={() => navigation.navigate('CreateMatch')}
        >
          <Text style={[styles.newMatchText, { color: colors.accentText }]}>
            New Match
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by player name..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        style={[
          styles.tabsContainer,
          { borderBottomColor: colors.borderColor },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              onPress={() => {
                setActiveTab(tab);
                setSubFilter('All');
              }}
              style={[
                styles.tabItem,
                isActive && [
                  styles.activeTabItem,
                  { borderBottomColor: colors.textPrimary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.textPrimary : colors.textTertiary,
                    fontWeight: isActive ? '700' : '600',
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.subFilterRow}>
        {activeSubFilters.map((filterName) => {
          const isSelected = subFilter === filterName;
          return (
            <TouchableOpacity
              key={filterName}
              activeOpacity={0.8}
              onPress={() => setSubFilter(filterName)}
              style={[
                styles.subFilterPill,
                isSelected
                  ? { backgroundColor: colors.textPrimary }
                  : {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    borderWidth: 1,
                  },
              ]}
            >
              <Text
                style={[
                  styles.subFilterText,
                  { color: isSelected ? colors.bgBase : colors.textSecondary },
                ]}
              >
                {filterName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.listContent}>
          <MatchCardSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
          <MatchCardSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
          <MatchCardSkeleton colors={colors} isDark={isDark} shimmerAnim={shimmerAnim} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          extraData={[myMatches, friendsLive, friendsUpcoming, friendsCompleted, subFilter]}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderMatchCard}
          renderSectionHeader={({ section: { title, actualCount } }) => {
            if (totalMatchesCount === 0 && searchQuery) return null;
            return (
              <View style={[styles.sectionHeaderRow, { backgroundColor: colors.bgBase }]}>
                <Text style={[styles.sectionHeaderTitle, { color: colors.textTertiary }]}>
                  {title.toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.sectionCountBadge,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                    {actualCount || 0}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMatches(true)}
              tintColor={'#FFF'}
              colors={['#000']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name={searchQuery ? 'account-search-outline' : 'badminton'}
                size={42}
                color={colors.borderColor}
                style={{ marginBottom: 10 }}
              />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {searchQuery
                  ? `No ${activeTab.toLowerCase()} matches matching "${searchQuery}"`
                  : `No ${activeTab.toLowerCase()} matches found`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Matches;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  newMatchButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  newMatchText: { fontSize: 13.5, fontWeight: '700', letterSpacing: -0.2 },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, height: 42 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomColor: 'transparent' },
  activeTabItem: {},
  tabText: { fontSize: 15.5, letterSpacing: -0.2 },
  subFilterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  subFilterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  subFilterText: { fontSize: 12, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 6, marginBottom: 4 },
  sectionHeaderTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1 },
  sectionCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  sectionCountText: { fontSize: 11, fontWeight: '700' },
  listContent: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 110 },
  matchCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 12 },
  skeletonBox: { borderRadius: 6 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  cardBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantsColumn: { flex: 1, justifyContent: 'center', paddingRight: 12 },
  participantText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginVertical: 2 },
  scoreColumn: { alignItems: 'flex-end', justifyContent: 'center' },
  scoreText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  setScoresText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  completedMetaText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  completedDateText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  winnerWrap: { flexDirection: 'row', alignItems: 'center' },
  winnerNameText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  loserNameText: { fontSize: 14.5, fontWeight: '500', marginTop: 4 },
  completedScoreText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  completedSetScoresText: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  cardActionRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { borderWidth: 1 },
  acceptBtn: {},
  actionBtnText: { fontSize: 13.5, fontWeight: '700' },
  emptySectionCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  emptySectionText: { fontSize: 12.5, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 70 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, left: 20, right: 20, zIndex: 9999, elevation: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
  toastText: { fontSize: 14.5, fontWeight: '700', letterSpacing: -0.2 },
});