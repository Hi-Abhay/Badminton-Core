import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';

const ScoreCard = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  const route = useRoute();

  // Dynamic parameters with fallback to tournament mock data
  const matchData = route.params?.matchData || {
    champion: 'Chia-Soh Titans',
    finalScore: '0 - 2',
    scores: [
      { name: 'Sat-Chi Smashers', g1: '2', g2: '0', total: '0' },
      { name: 'Chia-Soh Titans', g1: '21', g2: '21', total: '2' },
    ],
    details: [
      { label: 'Format', value: 'Doubles' },
      { label: 'Match Length', value: 'Best of 3' },
      { label: 'Points Per Game', value: '21 Pts' },
      { label: 'Total Rallies Played', value: '44 Rallies' },
    ],
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏸 BadmintonCore Match Result\nChampion: ${matchData.champion}\nFinal Score: ${matchData.finalScore}`,
      });
    } catch (error) {
      // Handled silently
    }
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
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Champion Banner Card */}
        <View style={[styles.championCard, { backgroundColor: colors.accentBg }]}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text
            style={[
              styles.championLabel,
              { color: colorScheme === 'dark' ? '#52525B' : '#A1A1AA' },
            ]}
          >
            CHAMPION
          </Text>
          <Text style={[styles.championName, { color: colors.accentText }]}>
            {matchData.champion}
          </Text>
          <Text style={[styles.finalScore, { color: colors.accentText }]}>
            Final Score: {matchData.finalScore}
          </Text>
        </View>

        {/* Game Scores Table Card */}
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
            <Text
              style={[
                styles.colScore,
                styles.tableHeaderLabel,
                { color: colors.textPrimary },
              ]}
            >
              G1
            </Text>
            <Text
              style={[
                styles.colScore,
                styles.tableHeaderLabel,
                { color: colors.textPrimary },
              ]}
            >
              G2
            </Text>
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

          {matchData?.scores?.map((row, idx) => (
            <View key={idx} style={styles.tableRow}>
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
              <Text style={[styles.colScore, styles.scoreValue, { color: colors.textPrimary }]}>
                {row.g1}
              </Text>
              <Text style={[styles.colScore, styles.scoreValue, { color: colors.textPrimary }]}>
                {row.g2}
              </Text>
              <Text style={[styles.colScore, styles.scoreValue, { color: colors.textPrimary }]}>
                {row.total}
              </Text>
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
          {matchData.details.map((item, index) => (
            <View
              key={index}
              style={[
                styles.detailRow,
                index < matchData.details.length - 1 && styles.detailRowSpacing,
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScoreCard;

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
  championCard: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: {
    fontSize: 44,
    marginBottom: 10,
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
});