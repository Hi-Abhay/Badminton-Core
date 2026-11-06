import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { get_api, post_api } from '../../../utils/api';

const Live = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  const route = useRoute();
  const user = useSelector((state) => state?.auth);

  // Incoming Route Params (Using primitive string ID for stability)
  const initialMatch = route?.params?.match;
  const matchId = initialMatch?._id || route?.params?.matchId;

  // Match Information
  const [matchData, setMatchData] = useState(initialMatch || {});
  const player1Name = matchData?.sideA?.displayName || 'Player A';
  const player2Name = matchData?.sideB?.displayName || 'Player B';
  const targetPoints = matchData?.rules?.pointsPerGame || 21;
  const maxCap = matchData?.rules?.maxPointCap || 30;
  const totalGames = matchData?.rules?.bestOf || 1;

  // Live Scoreboard State
  const [currentGame, setCurrentGame] = useState(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1GamesWon, setPlayer1GamesWon] = useState(0);
  const [player2GamesWon, setPlayer2GamesWon] = useState(0);
  const [completedGames, setCompletedGames] = useState([]);

  // Server state: 1 = Player 1 (sideA), 2 = Player 2 (sideB)
  const [server, setServer] = useState(1);
  const [courtSide, setCourtSide] = useState('RIGHT COURT'); // 'RIGHT COURT' | 'LEFT COURT'
  const [canUndo, setCanUndo] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Match Timer State with ref to prevent re-render re-fetching
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // 1. Synchronize Live State from API responses (Stable Callback)
  const syncLiveState = useCallback(
    (liveState, status) => {
      if (!liveState) return;

      const currentGNum = liveState.currentGameNumber || 1;
      setCurrentGame(currentGNum);
      setPlayer1GamesWon(liveState.gamesWonSideA || 0);
      setPlayer2GamesWon(liveState.gamesWonSideB || 0);

      // Determine Server (1 = sideA, 2 = sideB)
      const isSideAServer = (liveState.currentServer || 'sideA') === 'sideA';
      setServer(isSideAServer ? 1 : 2);

      // Active Game Scores
      const activeGame =
        liveState.games?.find((g) => g.gameNumber === currentGNum) ||
        liveState.games?.[liveState.games.length - 1] || {
          sideAScore: 0,
          sideBScore: 0,
        };

      const s1 = activeGame.sideAScore || 0;
      const s2 = activeGame.sideBScore || 0;
      setPlayer1Score(s1);
      setPlayer2Score(s2);

      // Badminton Court Calculation: Even = Right, Odd = Left based on server's score
      const servingScore = isSideAServer ? s1 : s2;
      setCourtSide(servingScore % 2 === 0 ? 'RIGHT COURT' : 'LEFT COURT');

      // Completed Games Overview
      const finished = (liveState.games || [])
        .filter((g) => g.isCompleted)
        .map((g) => `${g.sideAScore}-${g.sideBScore}`);
      setCompletedGames(finished);

      // Undo Availability
      setCanUndo(Array.isArray(liveState.history) && liveState.history.length > 0);

      // Match Completion Check
      if (status === 'COMPLETED' || liveState.matchWinner) {
        setIsPaused(true);
        const p1Wins = liveState.gamesWonSideA || 0;
        const p2Wins = liveState.gamesWonSideB || 0;
        const champion =
          liveState.matchWinner === 'sideA' || p1Wins > p2Wins
            ? player1Name
            : player2Name;

        navigation.replace('ScoreCard', {
          matchId,
          matchData: {
            champion,
            finalScore: `${p1Wins} - ${p2Wins}`,
            scores: [
              { name: player1Name, total: `${p1Wins}` },
              { name: player2Name, total: `${p2Wins}` },
            ],
            completedGames: finished,
            details: [
              { label: 'Format', value: matchData?.format || 'Singles' },
              { label: 'Match Length', value: `Best of ${totalGames}` },
              { label: 'Points Per Game', value: `${targetPoints} Pts` },
              { label: 'Duration', value: formatTime(secondsRef.current) },
            ],
          },
        });
      }
    },
    [matchId, navigation, player1Name, player2Name, targetPoints, totalGames, matchData?.format]
  );

  // 2. Fetch Live Scoreboard: GET /matches/{id}/live (Stable)
  const fetchLiveScore = useCallback(async () => {
    if (!matchId) return;
    try {
      const res = await get_api(`/matches/${matchId}/live`, user?.token);
      if (res?.success) {
        if (res.rules || res.sideA || res.sideB) {
          setMatchData((prev) => ({ ...prev, ...res }));
        }
        syncLiveState(res.liveState, res.status);
      }
    } catch (error) {
      console.error('Failed to fetch live score:', error);
    }
  }, [matchId, user?.token, syncLiveState]);

  // 3. Initial Mount Only: Calls API once when matchId is available
  useEffect(() => {
    if (initialMatch?.liveState) {
      syncLiveState(initialMatch.liveState, initialMatch.status);
    }
    fetchLiveScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // 4. Timer: Kept isolated so it doesn't trigger network re-fetching
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          secondsRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  // 5. Record Point API: POST /matches/{id}/live/point
  const handleAddPoint = async (playerNumber) => {
    if (isUpdating) return;
    const side = playerNumber === 1 ? 'sideA' : 'sideB';

    try {
      setIsUpdating(true);
      const res = await post_api(
        `/matches/${matchId}/live/point`,
        { side },
        user?.token
      );

      if (res?.success) {
        syncLiveState(res.liveState, res.status);
      } else {
        Alert.alert('Error', res?.message || 'Failed to record point.');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Network error recording point.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 6. Undo Point API: POST /matches/{id}/live/undo
  const handleUndo = async () => {
    if (isUpdating || !canUndo) return;

    try {
      setIsUpdating(true);
      const res = await post_api(
        `/matches/${matchId}/live/undo`,
        {},
        user?.token
      );

      if (res?.success) {
        syncLiveState(res.liveState, res.status);
      } else {
        Alert.alert('Notice', res?.message || 'No more points to undo.');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to undo point.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 7. Swap Service Court Ends
  const handleSwapCourtEnds = () => {
    setCourtSide((prev) =>
      prev === 'RIGHT COURT' ? 'LEFT COURT' : 'RIGHT COURT'
    );
  };

  // 8. Exit Alert
  const handleStopMatch = () => {
    Alert.alert(
      'End Match Session?',
      'Are you sure you want to exit this live scoring screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgBase}
      />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* LIVE Badge */}
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>

          {/* Match Timer */}
          <Text style={[styles.timerText, { color: colors.textPrimary }]}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.circleButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={fetchLiveScore}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.circleButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={handleStopMatch}
          >
            <Ionicons name="stop" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Game Status Banner */}
        <View style={styles.gameMetaRow}>
          <Text style={[styles.gameMetaTitle, { color: colors.textPrimary }]}>
            GAME {currentGame} OF {totalGames}
          </Text>
          <Text style={[styles.gameMetaTarget, { color: colors.textTertiary }]}>
            Target: {targetPoints} Pts (Cap {maxCap})
          </Text>
        </View>

        {/* Main Scores Grid */}
        <View style={styles.scoringGrid}>
          {/* Player 1 Card (Side A) */}
          <View
            style={[
              styles.playerCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: server === 1 ? colors.textPrimary : colors.borderColor,
                borderWidth: server === 1 ? 2.5 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.playerName, { color: colors.textPrimary }]}
            >
              {player1Name}
            </Text>
            <Text style={[styles.gamesWonText, { color: colors.textTertiary }]}>
              {player1GamesWon} Games Won
            </Text>

            {/* Server Badge or Spacer */}
            <View style={styles.servingBadgeWrapper}>
              {server === 1 ? (
                <View style={[styles.servingBadge, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.servingBadgeText, { color: colors.accentText }]}>
                    SERVING ({courtSide})
                  </Text>
                </View>
              ) : (
                <View style={styles.servingBadgeSpacer} />
              )}
            </View>

            {/* Score Display */}
            <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>
              {player1Score}
            </Text>

            {/* Add Point Action */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isUpdating}
              style={[
                styles.addPointButton,
                { backgroundColor: colors.accentBg, opacity: isUpdating ? 0.7 : 1 },
              ]}
              onPress={() => handleAddPoint(1)}
            >
              <Text style={[styles.addPointText, { color: colors.accentText }]}>
                +1 Point
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player 2 Card (Side B) */}
          <View
            style={[
              styles.playerCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: server === 2 ? colors.textPrimary : colors.borderColor,
                borderWidth: server === 2 ? 2.5 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.playerName, { color: colors.textPrimary }]}
            >
              {player2Name}
            </Text>
            <Text style={[styles.gamesWonText, { color: colors.textTertiary }]}>
              {player2GamesWon} Games Won
            </Text>

            {/* Server Badge or Spacer */}
            <View style={styles.servingBadgeWrapper}>
              {server === 2 ? (
                <View style={[styles.servingBadge, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.servingBadgeText, { color: colors.accentText }]}>
                    SERVING ({courtSide})
                  </Text>
                </View>
              ) : (
                <View style={styles.servingBadgeSpacer} />
              )}
            </View>

            {/* Score Display */}
            <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>
              {player2Score}
            </Text>

            {/* Add Point Action */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isUpdating}
              style={[
                styles.addPointButton,
                { backgroundColor: colors.accentBg, opacity: isUpdating ? 0.7 : 1 },
              ]}
              onPress={() => handleAddPoint(2)}
            >
              <Text style={[styles.addPointText, { color: colors.accentText }]}>
                +1 Point
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Completed Games Bar */}
        <View
          style={[
            styles.completedBar,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <Text style={[styles.completedLabel, { color: colors.textPrimary }]}>
            Completed Games:
          </Text>
          <Text style={[styles.completedValue, { color: colors.textTertiary }]}>
            {completedGames.length > 0 ? completedGames.join(', ') : 'None'}
          </Text>
        </View>

        {/* Quick Match Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canUndo || isUpdating}
            style={[
              styles.secondaryActionButton,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderColor,
                opacity: !canUndo || isUpdating ? 0.45 : 1,
              },
            ]}
            onPress={handleUndo}
          >
            <Ionicons name="arrow-undo-outline" size={18} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
              Undo Point
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.secondaryActionButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => setIsPaused((prev) => !prev)}
          >
            <Ionicons
              name={isPaused ? 'play-outline' : 'pause-outline'}
              size={18}
              color={colors.textPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swap Service Court Ends */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.swapButton,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
          onPress={handleSwapCourtEnds}
        >
          <Ionicons name="swap-horizontal" size={18} color={colors.textPrimary} />
          <Text style={[styles.swapButtonText, { color: colors.textPrimary }]}>
            Swap Service Court Ends
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Live;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 2,
    justifyContent: 'center',
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timerText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  gameMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameMetaTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  gameMetaTarget: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoringGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playerCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  gamesWonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  servingBadgeWrapper: {
    height: 34,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  servingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  servingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  servingBadgeSpacer: {
    height: 34,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
    marginVertical: 10,
  },
  addPointButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPointText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  completedBar: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  completedLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  completedValue: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  secondaryActionButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  swapButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  swapButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});