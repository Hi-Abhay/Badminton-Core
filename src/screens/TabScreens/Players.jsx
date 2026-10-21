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
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const INITIAL_PLAYERS = [
  {
    id: '1',
    name: 'Viktor Axelsen',
    initials: 'VA',
    category: 'SINGLES',
    matches: 34,
    wins: 30,
    winRate: 88,
  },
  {
    id: '2',
    name: 'Lakshya Sen',
    initials: 'LS',
    category: 'BOTH',
    matches: 28,
    wins: 22,
    winRate: 79,
  },
  {
    id: '3',
    name: 'Tai Tzu-ying',
    initials: 'TT',
    category: 'SINGLES',
    matches: 29,
    wins: 24,
    winRate: 83,
  },
  {
    id: '4',
    name: 'Akane Yamaguchi',
    initials: 'AY',
    category: 'SINGLES',
    matches: 26,
    wins: 20,
    winRate: 77,
  },
  {
    id: '5',
    name: 'Satwiksairaj Rankireddy',
    initials: 'SR',
    category: 'DOUBLES',
    matches: 31,
    wins: 25,
    winRate: 81,
  },
  {
    id: '6',
    name: 'Chirag Shetty',
    initials: 'CS',
    category: 'DOUBLES',
    matches: 31,
    wins: 25,
    winRate: 81,
  },
  {
    id: '7',
    name: 'An Se-young',
    initials: 'AS',
    category: 'SINGLES',
    matches: 35,
    wins: 32,
    winRate: 91,
  },
  {
    id: '8',
    name: 'Carolina Marin',
    initials: 'CM',
    category: 'SINGLES',
    matches: 30,
    wins: 24,
    winRate: 80,
  },
];

const FILTERS = ['All', 'Singles', 'Doubles', 'Both'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['Singles', 'Doubles', 'Both'];

const Players = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;

  // List & Filter States
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Modal & Form States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [playingCategory, setPlayingCategory] = useState('Singles');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Dropdown Picker Modal States
  const [pickerType, setPickerType] = useState(null);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = player.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        selectedFilter === 'All'
          ? true
          : player.category.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [players, searchQuery, selectedFilter]);

  const handleOpenModal = () => {
    setFullName('');
    setGender('Male');
    setPlayingCategory('Singles');
    setPhoneNumber('');
    setIsModalVisible(true);
  };

  const handleCreatePlayer = () => {
    if (!fullName.trim()) return;

    const names = fullName.trim().split(' ');
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase();

    const newPlayer = {
      id: Date.now().toString(),
      name: fullName.trim(),
      initials,
      category: playingCategory.toUpperCase(),
      matches: 0,
      wins: 0,
      winRate: 0,
      gender,
      phone: phoneNumber.trim(),
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    setIsModalVisible(false);
  };

  const renderPlayerCard = ({ item }) => (
    <View
      style={[
        styles.playerCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.playerInfoGroup}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.bgBase }]}>
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
              {item.initials}
            </Text>
          </View>
          <Text style={[styles.playerName, { color: colors.textPrimary }]}>
            {item.name}
          </Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: colors.bgBase }]}>
          <Text style={[styles.categoryBadgeText, { color: colors.textTertiary }]}>
            {item.category}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.statsRow}>
        <Text style={[styles.statText, { color: colors.textSecondary }]}>
          {item.matches} Matches
        </Text>
        <Text style={[styles.statDot, { color: colors.textTertiary }]}>•</Text>
        <Text style={[styles.statText, { color: colors.textSecondary }]}>
          {item.wins} Wins
        </Text>
        <Text style={[styles.statDot, { color: colors.textTertiary }]}>•</Text>
        <Text style={[styles.statTextBold, { color: colors.textPrimary }]}>
          {item.winRate}% Win Rate
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
          Players
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

      {/* Search Bar & Filters */}
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
            placeholder="Search players..."
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

      {/* Players List */}
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayerCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No players found
            </Text>
          </View>
        }
      />

  

      {/* Dropdown Options Picker Modal */}
      <Modal
        visible={pickerType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPickerType(null)}
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
              {(pickerType === 'gender' ? GENDER_OPTIONS : CATEGORY_OPTIONS).map(
                (option, idx) => (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (pickerType === 'gender') {
                        setGender(option);
                      } else {
                        setPlayingCategory(option);
                      }
                      setPickerType(null);
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
                        (pickerType === 'gender'
                          ? gender === option
                          : playingCategory === option) && {
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {(pickerType === 'gender'
                      ? gender === option
                      : playingCategory === option) && (
                        <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
                      )}
                  </TouchableOpacity>
                )
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Players;

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
  playerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  cardDivider: {
    height: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 54,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '400',
  },
  statDot: {
    fontSize: 11,
  },
  statTextBold: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 20,
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
  submitButton: {},
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