import React, { useState, useEffect } from 'react';
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

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';

const Live = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  const route = useRoute();

  // Match Configuration & Player Names
  const player1Name = route.params?.player1 || 'Viktor Axelsen';
  const player2Name = route.params?.player2 || 'Lakshya Sen';
  const targetPoints = route.params?.targetPoints || 21;
  const maxCap = route.params?.maxCap || 30;
  const totalGames = route.params?.totalGames || 3;

  // Match State
  const [currentGame, setCurrentGame] = useState(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1GamesWon, setPlayer1GamesWon] = useState(0);
  const [player2GamesWon, setPlayer2GamesWon] = useState(0);
  const [completedGames, setCompletedGames] = useState([]);

  // Server state: 1 = Player 1, 2 = Player 2
  const [server, setServer] = useState(2);
  const [courtSide, setCourtSide] = useState('RIGHT COURT'); // 'RIGHT COURT' | 'LEFT COURT'

  // History stack for Undo
  const [history, setHistory] = useState([]);

  // Match Timer State
  const [seconds, setSeconds] = useState(9);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Add Point
  const handleAddPoint = (player) => {
    // Save snapshot for undo
    setHistory((prev) => [
      ...prev,
      {
        player1Score,
        player2Score,
        server,
        courtSide,
        currentGame,
        player1GamesWon,
        player2GamesWon,
      },
    ]);

    if (player === 1) {
      const nextScore = player1Score + 1;
      setPlayer1Score(nextScore);
      setServer(1);
      // Badminton Rule: Even = Right, Odd = Left
      setCourtSide(nextScore % 2 === 0 ? 'RIGHT COURT' : 'LEFT COURT');
      checkGameWin(nextScore, player2Score, 1);
    } else {
      const nextScore = player2Score + 1;
      setPlayer2Score(nextScore);
      setServer(2);
      setCourtSide(nextScore % 2 === 0 ? 'RIGHT COURT' : 'LEFT COURT');
      checkGameWin(player1Score, nextScore, 2);
    }
  };

  // Check Game & Match Win Condition
  const checkGameWin = (s1, s2, winner) => {
    const minWin = (winner === 1 ? s1 : s2) >= targetPoints && Math.abs(s1 - s2) >= 2;
    const capWin = (winner === 1 ? s1 : s2) >= maxCap;

    if (minWin || capWin) {
      const updatedP1Wins = winner === 1 ? player1GamesWon + 1 : player1GamesWon;
      const updatedP2Wins = winner === 2 ? player2GamesWon + 1 : player2GamesWon;
      const matchWinTarget = Math.ceil(totalGames / 2);

      if (updatedP1Wins >= matchWinTarget || updatedP2Wins >= matchWinTarget) {
        setIsPaused(true);
        navigation.navigate('ScoreCard', {
          matchData: {
            champion: updatedP1Wins > updatedP2Wins ? player1Name : player2Name,
            finalScore: `${updatedP1Wins} - ${updatedP2Wins}`,
            scores: [
              { name: player1Name, g1: `${s1}`, g2: `${s2}`, total: `${updatedP1Wins}` },
              { name: player2Name, g1: `${s2}`, g2: `${s1}`, total: `${updatedP2Wins}` },
            ],
            details: [
              { label: 'Format', value: 'Singles' },
              { label: 'Match Length', value: `Best of ${totalGames}` },
              { label: 'Points Per Game', value: `${targetPoints} Pts` },
              { label: 'Duration', value: formatTime(seconds) },
            ],
          },
        });
      } else {
        setCompletedGames((prev) => [...prev, `${s1}-${s2}`]);
        if (winner === 1) setPlayer1GamesWon(updatedP1Wins);
        if (winner === 2) setPlayer2GamesWon(updatedP2Wins);
        setCurrentGame((prev) => prev + 1);
        setPlayer1Score(0);
        setPlayer2Score(0);
      }
    }
  };

  // Undo Last Point
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setPlayer1Score(lastState.player1Score);
    setPlayer2Score(lastState.player2Score);
    setServer(lastState.server);
    setCourtSide(lastState.courtSide);
    setCurrentGame(lastState.currentGame);
    setPlayer1GamesWon(lastState.player1GamesWon);
    setPlayer2GamesWon(lastState.player2GamesWon);
    setHistory((prev) => prev.slice(0, -1));
  };

  // Swap Ends
  const handleSwapCourtEnds = () => {
    setCourtSide((prev) =>
      prev === 'RIGHT COURT' ? 'LEFT COURT' : 'RIGHT COURT'
    );
  };

  // Prompt Exit/Stop Match
  const handleStopMatch = () => {
    Alert.alert(
      'End Match?',
      'Are you sure you want to stop this match scoring session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Match', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

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
          >
            <Ionicons name="time-outline" size={19} color={colors.textPrimary} />
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
          {/* Player 1 Card */}
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

            {/* Server Badge or Placeholder spacer */}
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
              style={[styles.addPointButton, { backgroundColor: colors.accentBg }]}
              onPress={() => handleAddPoint(1)}
            >
              <Text style={[styles.addPointText, { color: colors.accentText }]}>
                +1 Point
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player 2 Card */}
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
              style={[styles.playerName, { color: colors.textPrimary }]}>
              {player2Name}
            </Text>
            <Text style={[styles.gamesWonText, { color: colors.textTertiary }]}>
              {player2GamesWon} Games Won
            </Text>

            {/* Server Badge or Placeholder spacer */}
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
              style={[styles.addPointButton, { backgroundColor: colors.accentBg }]}
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
            style={[
              styles.secondaryActionButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
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