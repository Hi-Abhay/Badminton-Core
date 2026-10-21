import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { useNavigation } from '@react-navigation/native';

const TABS = ['Completed', 'Live', 'Upcoming']; //[cite: 8]
const FORMAT_OPTIONS = ['Best of 3', 'Best of 1', 'Best of 5'];
const MATCH_TYPE_OPTIONS = ['Singles', 'Doubles'];

const INITIAL_MATCHES = {
  Completed: [
    {
      id: '1',
      format: 'SINGLES • BEST OF 3', //[cite: 8]
      status: 'COMPLETED', //[cite: 8]
      participant1: 'Viktor Axelsen', //[cite: 8]
      participant2: 'Lakshya Sen', //[cite: 8]
      score: '2 - 1', //[cite: 8]
      setScores: '21-18 19-21 21-16', //[cite: 8]
    },
    {
      id: '2',
      format: 'DOUBLES • BEST OF 3', //[cite: 8]
      status: 'COMPLETED', //[cite: 8]
      participant1: 'Sat-Chi Smashers', //[cite: 8]
      participant2: 'Chia-Soh Titans', //[cite: 8]
      score: '2 - 0', //[cite: 8]
      setScores: '21-17 22-20', //[cite: 8]
    },
  ],
  Live: [],
  Upcoming: [],
};

const Matches = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  // Tab & Data State
  const [activeTab, setActiveTab] = useState('Completed');
  const [allMatches, setAllMatches] = useState(INITIAL_MATCHES);

  // New Match Modal & Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [matchType, setMatchType] = useState('Singles');
  const [matchFormat, setMatchFormat] = useState('Best of 3');
  const [playerOne, setPlayerOne] = useState('');
  const [playerTwo, setPlayerTwo] = useState('');

  // Dropdown Picker State
  const [activePicker, setActivePicker] = useState(null); // 'matchType' | 'format' | null

  const currentMatches = useMemo(() => {
    return allMatches[activeTab] || [];
  }, [allMatches, activeTab]);

  const handleOpenModal = () => {
    setMatchType('Singles');
    setMatchFormat('Best of 3');
    setPlayerOne('');
    setPlayerTwo('');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setIsModalVisible(false);
  };

  const handleCreateMatch = () => {
    if (!playerOne.trim() || !playerTwo.trim()) return;

    const newMatch = {
      id: Date.now().toString(),
      format: `${matchType.toUpperCase()} • ${matchFormat.toUpperCase()}`,
      status: 'UPCOMING',
      participant1: playerOne.trim(),
      participant2: playerTwo.trim(),
      score: '0 - 0',
      setScores: 'Upcoming Match',
    };

    setAllMatches((prev) => ({
      ...prev,
      Upcoming: [newMatch, ...prev.Upcoming],
    }));

    handleCloseModal();
    setActiveTab('Upcoming');
  };

  const renderMatchCard = ({ item }) => (
    <View
      style={[
        styles.matchCard,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderColor,
        },
      ]}
    >
      {/* Category / Status Header Row */}
      <View style={styles.cardHeaderRow}>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          {item.format}
        </Text>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          {item.status}
        </Text>
      </View>

      {/* Main Players & Scores Row */}
      <View style={styles.cardBodyRow}>
        <View style={styles.participantsColumn}>
          <Text style={[styles.participantText, { color: colors.textPrimary }]}>
            {item.participant1}
          </Text>
          <Text style={[styles.participantText, { color: colors.textPrimary }]}>
            {item.participant2}
          </Text>
        </View>

        <View style={styles.scoreColumn}>
          <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
            {item.score}
          </Text>
          <Text style={[styles.setScoresText, { color: colors.textTertiary }]}>
            {item.setScores}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >
      {/* Top Header */}
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
            + New Match
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Tabs */}
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
              onPress={() => setActiveTab(tab)}
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

      {/* Matches List */}
      <FlatList
        data={currentMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No {activeTab.toLowerCase()} matches found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Matches;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  newMatchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newMatchText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {},
  tabText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 36,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
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
  participantText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginVertical: 2,
  },
  scoreColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  setScoresText: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4D4D8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
  },
  dropdownSelector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownSelectedText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  pickerOptionText: {
    fontSize: 15,
  },
});