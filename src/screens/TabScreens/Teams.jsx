import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const INITIAL_TEAMS = [
  {
    id: '1',
    name: 'Sat-Chi Smashers',
    code: 'SCS',
    type: 'Doubles',
    winRate: 81,
    partner1: 'Satwiksairaj Rankireddy',
    partner2: 'Chirag Shetty',
    matches: 31,
    wins: 25,
  },
  {
    id: '2',
    name: 'Chia-Soh Titans',
    code: 'CST',
    type: 'Doubles',
    winRate: 75,
    partner1: 'Aaron Chia',
    partner2: 'Soh Wooi Yik',
    matches: 24,
    wins: 18,
  },
];

const AVAILABLE_PLAYERS = [
  'Satwiksairaj Rankireddy',
  'Chirag Shetty',
  'Aaron Chia',
  'Soh Wooi Yik',
  'Viktor Axelsen',
  'Lakshya Sen',
  'Tai Tzu-ying',
  'Akane Yamaguchi',
];

const FILTERS = ['All', 'Doubles', 'Club'];
const TEAM_TYPE_OPTIONS = ['Doubles', 'Club'];

const Teams = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;

  // Filter & List State
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Modal & Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamType, setTeamType] = useState('Doubles');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');

  // Dropdown Picker Modal State
  const [activePicker, setActivePicker] = useState(null); // 'teamType' | 'player1' | 'player2' | null

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        team.name.toLowerCase().includes(query) ||
        team.code.toLowerCase().includes(query) ||
        `${team.partner1} & ${team.partner2}`.toLowerCase().includes(query);

      const matchesFilter =
        selectedFilter === 'All'
          ? true
          : team.type.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [teams, searchQuery, selectedFilter]);

  const handleOpenModal = () => {
    setTeamName('');
    setTeamCode('');
    setTeamType('Doubles');
    setPlayer1('');
    setPlayer2('');
    setIsModalVisible(true);
  };

  const handleCreateTeam = () => {
    if (!teamName.trim() || !player1 || !player2) return;

    const generatedCode = teamCode.trim()
      ? teamCode.trim().toUpperCase()
      : teamName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase();

    const newTeam = {
      id: Date.now().toString(),
      name: teamName.trim(),
      code: generatedCode,
      type: teamType,
      winRate: 0,
      partner1,
      partner2,
      matches: 0,
      wins: 0,
    };

    setTeams((prev) => [newTeam, ...prev]);
    setIsModalVisible(false);
  };

  const getPickerOptions = () => {
    if (activePicker === 'teamType') return TEAM_TYPE_OPTIONS;
    if (activePicker === 'player1') {
      return AVAILABLE_PLAYERS.filter((p) => p !== player2);
    }
    if (activePicker === 'player2') {
      return AVAILABLE_PLAYERS.filter((p) => p !== player1);
    }
    return [];
  };

  const renderTeamCard = ({ item }) => (
    <View
      style={[
        styles.teamCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.teamName, { color: colors.textPrimary }]}>
          {item.name}
        </Text>
        <View style={[styles.winBadge, { backgroundColor: colors.bgBase }]}>
          <Text style={[styles.winBadgeText, { color: colors.textSecondary }]}>
            {item.winRate}% WIN
          </Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
        {item.code} - {item.type}
      </Text>

      <Text style={styles.partnersRow}>
        <Text style={[styles.partnersLabel, { color: colors.textPrimary }]}>
          Partners:{' '}
        </Text>
        <Text style={[styles.partnersNames, { color: colors.textSecondary }]}>
          {item.partner1} & {item.partner2}
        </Text>
      </Text>

      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>
          {item.matches} Matches
        </Text>
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>
          {item.wins} Wins
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Teams
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenModal}
          style={[
            styles.headerAddButton,
            { borderColor: colors.borderColor, backgroundColor: colors.bgSurface },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Input & Filter Pills */}
      <View style={styles.searchFilterContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search team name or code..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.accentBg : colors.bgSurface,
                    borderColor: isActive ? colors.accentBg : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? colors.accentText : colors.textPrimary,
                    },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Teams List */}
      <FlatList
        data={filteredTeams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeamCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No teams found
            </Text>
          </View>
        }
      />

      {/* Create Doubles Pair / Team Bottom Sheet Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {/* OUTER CATCH: Closes the modal if user clicks the dark empty background */}
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}>
            
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoid}
            >
              {/* INNER CATCH: Dismisses keyboard and STOPS touch from closing the modal */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: colors.bgSurface },
                  ]}
                >
                  {/* Drag Handle Indicator */}
                  <View style={styles.dragHandle} />

                  {/* Modal Title */}
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Create Doubles Pair / Team
                  </Text>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Team Name */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                        TEAM NAME *
                      </Text>
                      <TextInput
                        value={teamName}
                        onChangeText={setTeamName}
                        placeholder="e.g. Sat-Chi Smashers"
                        placeholderTextColor={colors.textTertiary}
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                          },
                        ]}
                      />
                    </View>

                    {/* Team Code (3-4 Letters) */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                        TEAM CODE (3-4 LETTERS)
                      </Text>
                      <TextInput
                        value={teamCode}
                        onChangeText={setTeamCode}
                        placeholder="SCS"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={4}
                        autoCapitalize="characters"
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                          },
                        ]}
                      />
                    </View>

                    {/* Team Type Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                        TEAM TYPE
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setActivePicker('teamType')}
                        style={[
                          styles.dropdownSelector,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectedText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {teamType}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Player 1 Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                        PLAYER 1 *
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setActivePicker('player1')}
                        style={[
                          styles.dropdownSelector,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectedText,
                            {
                              color: player1
                                ? colors.textPrimary
                                : colors.textTertiary,
                            },
                          ]}
                        >
                          {player1 || 'Select First Partner'}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Player 2 Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                        PLAYER 2 *
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setActivePicker('player2')}
                        style={[
                          styles.dropdownSelector,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectedText,
                            {
                              color: player2
                                ? colors.textPrimary
                                : colors.textTertiary,
                            },
                          ]}
                        >
                          {player2 || 'Select Second Partner'}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Actions Button Group */}
                    <View style={styles.modalActionRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsModalVisible(false)}
                        style={[
                          styles.actionButton,
                          styles.cancelButton,
                          {
                            borderColor: colors.borderColor,
                            backgroundColor: colors.bgSurface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleCreateTeam}
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: colors.accentBg,
                            opacity:
                              teamName.trim() && player1 && player2 ? 1 : 0.6,
                          },
                        ]}
                        disabled={!teamName.trim() || !player1 || !player2}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: colors.accentText },
                          ]}
                        >
                          Create Team
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Options Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
          style={[styles.pickerOverlay, { backgroundColor: colors.overlayBg }]}
        >
          {/* Blocks touch from bubbling up and closing modal if tapping empty space inside the picker menu */}
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
              ]}
            >
              <ScrollView style={{ maxHeight: 340 }}>
                {getPickerOptions().map((option, idx) => {
                  const isSelected =
                    (activePicker === 'teamType' && teamType === option) ||
                    (activePicker === 'player1' && player1 === option) ||
                    (activePicker === 'player2' && player2 === option);

                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (activePicker === 'teamType') setTeamType(option);
                        if (activePicker === 'player1') setPlayer1(option);
                        if (activePicker === 'player2') setPlayer2(option);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerOption,
                        idx > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { color: colors.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {option}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.textPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Teams;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerAddButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 15,
    fontWeight: '400',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  teamCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  winBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  winBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  partnersRow: {
    fontSize: 13.5,
    marginBottom: 12,
  },
  partnersLabel: {
    fontWeight: '700',
  },
  partnersNames: {
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
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