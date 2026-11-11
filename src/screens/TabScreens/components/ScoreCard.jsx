import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Share,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import trophy from '../../../assets/Logo/trophy.png';
import live from '../../../assets/Logo/live.png';
import { useSelector } from 'react-redux';
import { WS_BASE_URL } from '../../../utils/api'

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { get_api, URL } from '../../../utils/api';


// --- Floating +1 Score Badge Animation ---
const FloatingPlusOne = ({ side, lastScoredSide, triggerTimestamp }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (lastScoredSide === side && triggerTimestamp > 0) {
      animY.setValue(0);
      animOpacity.setValue(1);
      animScale.setValue(0.7);

      Animated.parallel([
        Animated.timing(animY, {
          toValue: -26,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.spring(animScale, {
          toValue: 1.2,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [triggerTimestamp, lastScoredSide, side]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.plusOneContainer,
        {
          opacity: animOpacity,
          transform: [{ translateY: animY }, { scale: animScale }],
        },
      ]}
    >
      <Text style={styles.plusOneText}>+1</Text>
    </Animated.View>
  );
};

// --- Centered Three Dot Wave Animation ---
const ThreeDotWave = ({ color }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim) =>
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -14,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.delay(280),
      ]);

    const loop = Animated.loop(
      Animated.parallel([
        createBounce(anim1),
        Animated.sequence([Animated.delay(160), createBounce(anim2)]),
        Animated.sequence([Animated.delay(320), createBounce(anim3)]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.waveRow}>
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: anim1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: anim2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.waveDot,
          { backgroundColor: color, transform: [{ translateY: anim3 }] },
        ]}
      />
    </View>
  );
};

const ScoreCard = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  const route = useRoute();
  const user = useSelector((state) => state?.auth);

  // Incoming Route Data
  const initialData = route?.params?.match || route?.params?.matchData || {};
  const matchId = initialData?._id || route?.params?.matchId;

  const [match, setMatch] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(!initialData?._id && !!matchId);

  // Track point scored for +1 animation
  const [lastPoint, setLastPoint] = useState({
    side: null,
    timestamp: 0,
  });

  const wsRef = useRef(null);

  // 1. Initial / Pull-to-Refresh API Call Only
  const fetchMatchDetails = useCallback(
    async (isPullToRefresh = false) => {
      if (!matchId) return;

      try {
        if (isPullToRefresh) setRefreshing(true);

        const res = await get_api(`/matches/${matchId}/live`, user?.token, URL);
        if (res?.success) {
          setMatch((prev) => ({
            ...prev,
            ...res,
            rules: res.rules || prev?.rules,
            sideA: res.sideA || prev?.sideA,
            sideB: res.sideB || prev?.sideB,
            liveState: res.liveState || prev?.liveState,
            status: res.status || prev?.status,
          }));
        }
      } catch (error) {
        console.log('Error loading scorecard data:', error);
      } finally {
        setLoading(false);
        if (isPullToRefresh) setRefreshing(false);
      }
    },
    [matchId, user?.token]
  );

  useEffect(() => {
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  // 2. Pure WebSocket Stream: Updates State Directly (Zero HTTP Calls)
  useEffect(() => {
    if (!matchId || !user?.token) return;

    const wsUrl = `${WS_BASE_URL}?token=${user.token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          action: 'join_match',
          matchId: matchId.toString(),
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Verify incoming message belongs to this match
        if (data?.matchId && data.matchId.toString() === matchId.toString()) {
          // DIRECT STATE UPDATE FROM WEBSOCKET PAYLOAD (No API call)
          setMatch((prev) => ({
            ...prev,
            status: data.status || prev?.status,
            liveState: data.liveState || prev?.liveState,
            toss: data.toss || prev?.toss,
          }));

          // Trigger "+1" Animation on point increment
          if (data?.latestPoint?.scoredBy) {
            setLastPoint({
              side: data.latestPoint.scoredBy,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        // console.log('WebSocket payload parsing error:', err);
      }
    };

    ws.onerror = (e) => {
      // console.log('Native WebSocket connection notice:', e.message || 'Connecting...');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              action: 'leave_match',
              matchId: matchId.toString(),
            })
          );
        } catch (_) { }
      }
      ws.close();
      wsRef.current = null;
    };
  }, [matchId, user?.token]);

  // Status Check
  const isMatchStartedOrCompleted =
    match?.status === 'IN_PROGRESS' || match?.status === 'COMPLETED';

  // Competitor & Rule Variables
  const player1Name = match?.sideA?.displayName || 'Player A';
  const player2Name = match?.sideB?.displayName || 'Player B';
  const totalGames = match?.rules?.bestOf || 1;
  const targetPoints = match?.rules?.pointsPerGame || 21;
  const maxCap = match?.rules?.maxPointCap || 30;
  const gamesWonA = match?.liveState?.gamesWonSideA ?? 0;
  const gamesWonB = match?.liveState?.gamesWonSideB ?? 0;
  const isMatchLive = match?.status === 'IN_PROGRESS';

  // Determine Champion / Leader
  const championName =
    match?.liveState?.matchWinner === 'sideA' || gamesWonA > gamesWonB
      ? player1Name
      : player2Name;

  // Dynamic Game Scores
  const gamesList = match?.liveState?.games || [];
  const getGameScore = (gameIdx, side) => {
    const g = gamesList[gameIdx];
    if (!g) return '-';
    return side === 'sideA' ? g.sideAScore : g.sideBScore;
  };

  const tableRows = [
    {
      side: 'sideA',
      name: player1Name,
      scores: Array.from({ length: totalGames }).map((_, i) =>
        getGameScore(i, 'sideA')
      ),
      total: gamesWonA,
    },
    {
      side: 'sideB',
      name: player2Name,
      scores: Array.from({ length: totalGames }).map((_, i) =>
        getGameScore(i, 'sideB')
      ),
      total: gamesWonB,
    },
  ];

  // Details Summary
  const details = [
    { label: 'Format', value: match?.format || 'SINGLES' },
    { label: 'Match Length', value: `Best of ${totalGames}` },
    { label: 'Points Per Game', value: `${targetPoints} Pts (Cap ${maxCap})` },
    {
      label: 'Total Rallies Played',
      value: `${match?.liveState?.history?.length || 0} Rallies`,
    },
    { label: 'Status', value: match?.status || 'COMPLETED' },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏸 Badminton Match Result\nChampion: ${championName}\nFinal Score: ${gamesWonA} - ${gamesWonB}`,
      });
    } catch (error) {
      // Handled silently
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.center, { backgroundColor: colors.bgBase }]}
        edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']}
      >
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgBase}
      />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Match Scorecard
          </Text>
        </View>
{/* 
        {isMatchStartedOrCompleted && (
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.shareButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )} */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          !isMatchStartedOrCompleted && styles.containerCentered,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMatchDetails(true)}
            tintColor={colors.textPrimary}
          />
        }
      >
        {isMatchStartedOrCompleted ? (
          <>
            {/* Status / Champion Banner Card */}
            <View
              style={[
                styles.championCard,
                {
                  backgroundColor: isMatchLive ? colors.bgSurface : colors.accentBg,
                  borderColor: isMatchLive ? colors.borderColor : 'transparent',
                  borderWidth: isMatchLive ? 1 : 0,
                },
              ]}
            >
              {isMatchLive ? (
                <Image source={live} style={{ width: 100, height: 50 }} />
              ) : (
                <Image source={trophy} style={styles.image} />
              )}
              <Text
                style={[
                  styles.championLabel,
                  {
                    color: isMatchLive
                      ? '#EF4444'
                      : colorScheme === 'dark'
                        ? '#52525B'
                        : '#A1A1AA',
                  },
                ]}
              >
                {isMatchLive ? '' : 'CHAMPION'}
              </Text>
              <Text
                style={[
                  styles.championName,
                  { color: isMatchLive ? colors.textPrimary : colors.accentText },
                ]}
              >
                {championName}
              </Text>
              <Text
                style={[
                  styles.finalScore,
                  { color: isMatchLive ? colors.textSecondary : colors.accentText },
                ]}
              >
                {isMatchLive ? 'Current Sets: ' : 'Final Score: '}
                {`${gamesWonA} - ${gamesWonB}`}
              </Text>
            </View>

            {/* Game Scores Table Card with Floating +1 Badges */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                GAME SCORES
              </Text>

              <View style={styles.tableHeaderRow}>
                <Text
                  style={[
                    styles.colCompetitor,
                    styles.tableHeaderLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Competitor
                </Text>
                {Array.from({ length: totalGames }).map((_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.colScore,
                      styles.tableHeaderLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    G{i + 1}
                  </Text>
                ))}
                <Text
                  style={[
                    styles.colScore,
                    styles.tableHeaderLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Total
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

              {tableRows.map((row) => (
                <View key={row.side} style={styles.tableRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.colCompetitor,
                      styles.competitorName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {row.name}
                  </Text>
                  {row.scores.map((score, sIdx) => (
                    <Text
                      key={sIdx}
                      style={[
                        styles.colScore,
                        styles.scoreValue,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {score}
                    </Text>
                  ))}

                  {/* Total Score Column with +1 Animation */}
                  <View style={styles.totalScoreWrapper}>
                    <Text
                      style={[
                        styles.scoreValue,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {row.total}
                    </Text>
                    <FloatingPlusOne
                      side={row.side}
                      lastScoredSide={lastPoint.side}
                      triggerTimestamp={lastPoint.timestamp}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Match Details Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
              ]}
            >
              {details.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.detailRow,
                    index < details.length - 1 && styles.detailRowSpacing,
                  ]}
                >
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionGroup}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.accentBg }]}
                onPress={() => navigation.navigate('CreateMatch')}
              >
                <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>
                  Start New Match
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                  Back to Match List
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Match Not Started Yet View */
          <View style={styles.notStartedWrapper}>
            <View
              style={[
                styles.notStartedCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
              ]}
            >
              <ThreeDotWave color={colors.textPrimary} />

              <Text style={[styles.notStartedTitle, { color: colors.textPrimary }]}>
                Match not started yet
              </Text>
              <Text style={[styles.notStartedSubtitle, { color: colors.textTertiary }]}>
                Waiting for the coin toss and official match commencement.
              </Text>

              {/* Matchup Preview */}
              <View
                style={[
                  styles.preMatchupBox,
                  {
                    backgroundColor:
                      colorScheme === 'dark' ? '#27272A' : '#F4F4F5',
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.prePlayerText, { color: colors.textPrimary }]}
                >
                  {player1Name}
                </Text>
                <Text style={[styles.preVsText, { color: colors.textTertiary }]}>
                  VS
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.prePlayerText, { color: colors.textPrimary }]}
                >
                  {player2Name}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.borderColor,
                  width: '100%',
                },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                Back to Match List
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScoreCard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 100,
    width: 75,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14,
  },
  containerCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  championCard: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  championLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  championName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  colCompetitor: {
    flex: 1,
  },
  colScore: {
    width: 44,
    textAlign: 'right',
  },
  totalScoreWrapper: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  plusOneContainer: {
    position: 'absolute',
    right: -4,
    top: -14,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 99,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  plusOneText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  competitorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowSpacing: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  notStartedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 32,
  },
  notStartedCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    gap: 10,
    marginBottom: 14,
  },
  waveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notStartedTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  notStartedSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  preMatchupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: '100%',
    gap: 12,
  },
  prePlayerText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  preVsText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});