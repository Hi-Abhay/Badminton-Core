import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';

const MATCH_HISTORY_DATA = [
  {
    id: '1',
    type: 'SINGLES',
    date: '2026-10-20',
    player1: 'Viktor Axelsen',
    player2: 'Lakshya Sen',
    score: '1 - 2',
    sets: '2-21, 21-0, 0-21',
  },
  {
    id: '2',
    type: 'DOUBLES',
    date: '2026-10-19',
    player1: 'Sat-Chi Smashers',
    player2: 'Chia-Soh Titans',
    score: '0 - 2',
    sets: '2-21, 0-21',
  },
  {
    id: '3',
    type: 'SINGLES',
    date: '2026-03-12 15:15',
    player1: 'Viktor Axelsen',
    player2: 'Lakshya Sen',
    score: '2 - 1',
    sets: '21-18, 19-21, 21-16',
  },
  {
    id: '4',
    type: 'DOUBLES',
    date: '2026-03-18 11:20',
    player1: 'Sat-Chi Smashers',
    player2: 'Chia-Soh Titans',
    score: '2 - 0',
    sets: '21-17, 22-20',
  },
];

const FILTER_TABS = ['All', 'Singles', 'Doubles'];

const History = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Filter matches based on search term and category chip
  const filteredMatches = useMemo(() => {
    return MATCH_HISTORY_DATA.filter((item) => {
      const matchesCategory =
        selectedFilter === 'All' ||
        item.type.toLowerCase() === selectedFilter.toLowerCase();

      const matchesSearch =
        item.player1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.player2.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedFilter]);

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
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Match History
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar Input */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by player or team..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: colors.accentBg }
                    : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                ]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? colors.accentText : colors.textPrimary },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Match Cards List */}
        {filteredMatches.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            style={[
              styles.matchCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
            onPress={() => navigation.navigate('ScoreCard')}
          >
            {/* Meta Row: Category & Date */}
            <View style={styles.cardMetaRow}>
              <Text style={[styles.cardType, { color: colors.textTertiary }]}>
                {item.type}
              </Text>
              <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
                {item.date}
              </Text>
            </View>

            {/* Content Row: Competitors & Score */}
            <View style={styles.cardContentRow}>
              <View style={styles.competitorsColumn}>
                <Text
                  numberOfLines={1}
                  style={[styles.competitorText, { color: colors.textPrimary }]}
                >
                  {item.player1}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.competitorText, { color: colors.textPrimary }]}
                >
                  {item.player2}
                </Text>
              </View>

              <View style={styles.scoreColumn}>
                <Text style={[styles.scoreValue, { color: colors.textPrimary }]}>
                  {item.score}
                </Text>
                <Text style={[styles.setsValue, { color: colors.textTertiary }]}>
                  {item.sets}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredMatches.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No matches found
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  searchContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  matchCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitorsColumn: {
    flex: 1,
    gap: 4,
  },
  competitorText: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scoreColumn: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  setsValue: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
});