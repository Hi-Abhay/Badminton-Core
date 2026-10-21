import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const MATCHES = [
  {
    id: '1',
    category: 'SINGLES • BEST OF 3',
    date: '2026-03-12 15:15',
    winner: 'Viktor Axelsen',
    loser: 'Lakshya Sen',
    score: '2 - 1',
    sets: '21-18, 19-21, 21-16',
  },
  {
    id: '2',
    category: 'DOUBLES • BEST OF 3',
    date: '2026-03-18 11:20',
    winner: 'Sat-Chi Smashers',
    loser: 'Chia-Soh Titans',
    score: '2 - 0',
    sets: '21-17, 22-20',
  },
];

const Home = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();

  // Pulse animation for the live status badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Safely open the drawer from inside the tab navigator
  const handleOpenDrawer = () => {
    navigation.getParent()?.openDrawer();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges ? handleEdges() : ['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgBase}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
          <View style={styles.headerLeft}>
            {/* Drawer Toggle */}
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

          {/* Settings / Actions */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.iconButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('Notification')}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
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

        {/* Live Match in Progress Card */}
        <View
          style={[
            styles.liveCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
            },
          ]}
        >
          {/* Top Live Meta */}
          <View style={styles.liveHeaderRow}>
            <View style={styles.liveBadgeContainer}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor: colors.danger,
                    opacity: pulseAnim,
                    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.25, 1], outputRange: [0.85, 1.2] }) }],
                  },
                ]}
              />
              <Text style={[styles.liveBadgeText, { color: colors.danger }]}>
                MATCH IN PROGRESS
              </Text>
            </View>
            <Text style={[styles.liveGameMeta, { color: colors.textTertiary }]}>
              Game 1 of 3
            </Text>
          </View>

          {/* Teams and Center Score */}
          <View style={styles.liveMatchRow}>
            <View style={styles.liveTeamColumnLeft}>
              <Text
                numberOfLines={1}
                style={[styles.liveTeamName, { color: colors.textPrimary }]}
              >
                Chia-Soh Titans
              </Text>
              <Text style={[styles.liveTeamSub, { color: colors.textTertiary }]}>
                0 games won
              </Text>
            </View>

            <Text style={[styles.liveScoreText, { color: colors.textPrimary }]}>
              0 - 0
            </Text>

            <View style={styles.liveTeamColumnRight}>
              <Text
                numberOfLines={1}
                style={[styles.liveTeamName, { color: colors.textPrimary }]}
              >
                Sat-Chi Smashers
              </Text>
              <Text style={[styles.liveTeamSub, { color: colors.textTertiary }]}>
                0 games won
              </Text>
            </View>
          </View>

          {/* Resume Match Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.resumeButton,
              { backgroundColor: colors.accentBg },
            ]}
            onPress={() => navigation.navigate('Live')}
          >
            <Text style={[styles.resumeButtonText, { color: colors.accentText }]}>
              Resume Match
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
          >
            <View style={styles.statHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.bgBase }]}>
                <Ionicons name="person-outline" size={16} color={colors.textPrimary} />
              </View>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>
                Single
              </Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>8</Text>
            <Text style={[styles.statCaption, { color: colors.textTertiary }]}>
              Registered athletes
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
          >
            <View style={styles.statHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.bgBase }]}>
                <Ionicons name="people-outline" size={17} color={colors.textPrimary} />
              </View>
              <Text style={[styles.statTitle, { color: colors.textPrimary }]}>
                Doubles
              </Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>2</Text>
            <Text style={[styles.statCaption, { color: colors.textTertiary }]}>
              Doubles pairs
            </Text>
          </View>
        </View>

        {/* Recent Matches Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Matches
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.viewAllButton,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Match Cards */}
        {MATCHES.map((item) => (
          <TouchableOpacity
            activeOpacity={0.7}
            key={item.id}
            style={[
              styles.matchCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('ScoreCard')}
          >
            <View style={styles.matchMetaRow}>
              <Text style={[styles.matchCategory, { color: colors.textTertiary }]}>
                {item.category}
              </Text>
              <Text style={[styles.matchDate, { color: colors.textTertiary }]}>
                {item.date}
              </Text>
            </View>

            <View style={styles.matchContentRow}>
              <View style={styles.playersColumn}>
                <Text style={[styles.winnerName, { color: colors.textPrimary }]}>
                  {item.winner} 🏆
                </Text>
                <Text style={[styles.loserName, { color: colors.textSecondary }]}>
                  {item.loser}
                </Text>
              </View>

              <View style={styles.scoreColumn}>
                <Text style={[styles.matchScore, { color: colors.textPrimary }]}>
                  {item.score}
                </Text>
                <Text style={[styles.setScores, { color: colors.textTertiary }]}>
                  {item.sets}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    borderWidth: 1,
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