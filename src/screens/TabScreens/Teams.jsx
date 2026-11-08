import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  Animated,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { get_api, patch_api, post_api } from '../../utils/api';
import { useSelector } from 'react-redux';
import { maskEmail } from './components/CreateMatch';
import { useNavigation } from '@react-navigation/native';

const FILTERS = ['All', 'Double', 'Club'];

// Reusable Skeleton Card mirroring the new team card layout
const TeamCardSkeleton = ({ colors, pulseAnim }) => {
  const placeholderBg = colors.borderColor || '#333333';

  return (
    <View style={[styles.teamCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
      <View style={styles.cardTopRow}>
        <View style={styles.avatarsWrapper}>
          <Animated.View style={[styles.skeletonAvatar, { backgroundColor: placeholderBg, opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonAvatar, styles.avatarSecond, { backgroundColor: placeholderBg, opacity: pulseAnim }]} />
        </View>

        <View style={styles.teamHeaderInfo}>
          <Animated.View style={[styles.skeletonLine, { width: '65%', height: 16, marginBottom: 8, backgroundColor: placeholderBg, opacity: pulseAnim }]} />
          <Animated.View style={[styles.skeletonLine, { width: '35%', height: 12, backgroundColor: placeholderBg, opacity: pulseAnim }]} />
        </View>

        <Animated.View style={[styles.skeletonLine, { width: 14, height: 14, borderRadius: 7, backgroundColor: placeholderBg, opacity: pulseAnim }]} />
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.borderColor }]} />

      <Animated.View style={[styles.skeletonLine, { width: '80%', height: 13, backgroundColor: placeholderBg, opacity: pulseAnim }]} />
    </View>
  );
};

const Teams = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const user = useSelector((state) => state.auth);
  const navigation = useNavigation();
  const my_id = user?._id || user?.id;

  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [friends, setFriends] = useState([]);

  // Stats Cache State: { [teamId]: { completedMatches, totalWon, winRate } }
  const [teamStats, setTeamStats] = useState({});

  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamType, setTeamType] = useState('Double');
  const [selectedPlayer2, setSelectedPlayer2] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSelectingPlayer, setIsSelectingPlayer] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let pulseLoop;
    if (isLoadingTeams && !isRefreshing && !isFetchingMore) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(0.35);
    }
    return () => { if (pulseLoop) pulseLoop.stop(); };
  }, [isLoadingTeams, isRefreshing, isFetchingMore]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const fetchStatsForTeams = useCallback(
    async (teamList) => {
      teamList.forEach(async (t) => {
        const teamId = t._id || t.id;
        if (!teamId) return;
        try {
          const statsRes = await get_api(`/matches/team-stats/${teamId}`, user?.token);

          if (statsRes?.success && statsRes?.stats) {
            setTeamStats((prev) => ({
              ...prev,
              [teamId]: statsRes.stats,
            }));
          }
        } catch (err) {
          console.log(`Error fetching stats for team ${teamId}:`, err);
        }
      });
    },
    [user?.token]
  );

  const fetchTeams = async (reset = false) => {
    if (reset) {
      if (!isRefreshing) setIsLoadingTeams(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      let url = `/teams?limit=10`;
      const currentCursor = reset ? null : nextCursor;

      if (currentCursor) url += `&cursor=${currentCursor}`;
      if (selectedFilter !== 'All') url += `&teamType=${selectedFilter.toLowerCase()}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await get_api(url, user?.token);

      if (res?.success) {
        const newTeams = res.teams || [];
        setTeams(reset ? newTeams : [...teams, ...newTeams]);
        setNextCursor(res.nextCursor);
        setHasNextPage(res.hasNextPage);

        fetchStatsForTeams(newTeams);
      }
    } catch (error) {
      console.log('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchTeams(true);
  }, [selectedFilter]);

  useEffect(() => {
    get_connections();
  }, []);

  const get_connections = async () => {
    try {
      const res = await get_api('/connections', user?.token);
      if (res?.success) setFriends(res?.friends || []);
    } catch (error) {
      console.log('Error fetching connections:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTeams(true);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingMore && !isLoadingTeams) {
      fetchTeams(false);
    }
  };

  const handleOpenModal = () => {
    setTeamName(''); setTeamCode(''); setTeamType('Double');
    setSelectedPlayer2(null); setFriendSearch(''); setIsSelectingPlayer(false);
    slideAnim.setValue(0); setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    Keyboard.dismiss(); setIsModalVisible(false);
    slideAnim.setValue(0); setIsSelectingPlayer(false);
  };

  const goToSelectPlayer = () => {
    setIsSelectingPlayer(true);
    Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const goToForm = () => {
    Keyboard.dismiss(); setIsSelectingPlayer(false);
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setFriendSearch(''));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !selectedPlayer2) return;

    const generatedCode = teamCode.trim() ? teamCode.trim().toUpperCase() : teamName.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
    const payload = { teamName: teamName.trim(), teamType: teamType.toLowerCase(), player2: selectedPlayer2.id, teamCode: generatedCode };

    try {
      const res = await post_api(`/teams`, payload, user?.token);
      if (res?.success) {
        fetchTeams(true);
        handleCloseModal();
      }
    } catch (error) {
      console.log('Error creating team:', error);
    }
  };

  const respond = async (id, isAccept) => {
    const body = {
      action: isAccept ? 'ACCEPT' : 'DECLINE'
    };
    try {
      const res = await patch_api(`/teams/${id}/respond`, body, user?.token);
      if (res.success) {
        fetchTeams(true);
      } else {
        Alert.alert('Error', res.message || 'Failed to respond to invitation.');
      }
    } catch (error) {
      console.log('Error responding to team invite:', error);
    }
  };

  const filteredFriends = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();
    return friends.filter((item) => {
      const player = item?.player;
      if (!player) return false;
      if (user?._id && player._id === user._id) return false;
      if (user?.fullName && player.fullName === user.fullName) return false;
      const name = (player.fullName || '').toLowerCase();
      const email = (player.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [friends, friendSearch, user]);

  const topSafePadding = Platform.OS === 'ios' ? 60 : 40;
  const defaultSheetHeight = Math.min(screenHeight * 0.8, 620);
  const availableScreenHeight = screenHeight - keyboardHeight - topSafePadding;
  const currentSheetHeight = keyboardHeight > 0 ? Math.min(defaultSheetHeight, availableScreenHeight) : defaultSheetHeight;

  // Helper to render circular player avatar with golden border
  const renderAvatarItem = (player, isSecond = false) => {
    return (
      <View style={[styles.avatarRing, isSecond && styles.avatarSecond]}>
        {player?.profile_image ? (
          <Image source={{ uri: player.profile_image }} style={styles.pairAvatar} />
        ) : (
          <View style={[styles.pairAvatarPlaceholder, { backgroundColor: colors.bgBase }]}>
            <Text style={[styles.pairAvatarInitial, { color: colors.textPrimary }]}>
              {(player?.fullName || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTeamCard = ({ item }) => {
    const tId = item?._id || item?.id;
    const tName = item?.teamName || 'Unknown Team';
    const tCode = item?.teamCode;
    const rawType = item?.teamType || 'Double';
    const formattedType = rawType.toLowerCase() === 'double' ? 'Doubles' : rawType.charAt(0).toUpperCase() + rawType.slice(1);

    const stats = teamStats[tId];
    const isPendingForMe = item?.player2Status === 'pending' && item?.player2?._id === my_id;

    const winRateStr = stats?.winRate
      ? (stats.winRate.toString().includes('%') ? stats.winRate : `${stats.winRate}%`)
      : '0%';
    console.log(item);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.teamCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}
        onPress={() => navigation.navigate('TeamProfile', { item: item, stats: stats })}
      >
        {/* Top Section: Avatars, Title & Type, Chevron */}
        <View style={styles.cardTopRow}>
          <View style={styles.avatarsWrapper}>
            {renderAvatarItem(item?.player1, false)}
            {renderAvatarItem(item?.player2, true)}
          </View>

          <View style={styles.teamHeaderInfo}>
            <Text style={[styles.teamNameText, { color: colors.textPrimary }]} numberOfLines={1}>
              {tName}{tCode ? ` (${tCode})` : ''}
            </Text>
            <Text style={[styles.teamSubtitle, { color: colors.textTertiary }]}>
              • {formattedType}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>

        {/* Subtle Divider */}
        <View style={[styles.cardDivider, { backgroundColor: colors.borderColor }]} />

        {/* Bottom Section: Summary Stats */}
        <View style={styles.cardBottomRow}>
          <Text style={[styles.statsSummaryText, { color: colors.textTertiary }]}>
            {stats
              ? `${stats.totalWon ?? 0} Wins,  ${stats.completedMatches ?? 0} Matches,  ${winRateStr} Win Rate`
              : 'Loading stats...'}
          </Text>
        </View>

        {/* Pending Invitation Action Row */}
        {isPendingForMe && (
          <View style={[styles.inviteActionRow, { borderTopColor: colors.borderColor }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.inviteButton,
                styles.declineButton,
                { borderColor: colors.borderColor, backgroundColor: colors.bgSurface }
              ]}
              onPress={() => respond(item._id, false)}
            >
              <Text style={[styles.inviteButtonText, { color: colors.textPrimary }]}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.inviteButton,
                styles.acceptButton,
                { backgroundColor: '#FFFFFF', borderColor: '#E4E4E7', borderWidth: 1 }
              ]}
              onPress={() => respond(item._id, true)}
            >
              <Text style={[styles.inviteButtonText, { color: '#000000' }]}>Join Team</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgBase }]} edges={handleEdges()}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Teams</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenModal} style={[styles.headerAddButton, { borderColor: colors.borderColor, backgroundColor: colors.bgSurface }]}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchTeams(true)}
            returnKeyType="search"
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
                  { backgroundColor: isActive ? colors.accentBg : colors.bgSurface, borderColor: isActive ? colors.accentBg : colors.borderColor },
                ]}
              >
                <Text style={[styles.filterPillText, { color: isActive ? colors.accentText : colors.textPrimary }]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoadingTeams && !isRefreshing ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((id) => <TeamCardSkeleton key={id} colors={colors} pulseAnim={pulseAnim} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          renderItem={renderTeamCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textPrimary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No teams found</Text>
            </View>
          }
        />
      )}

      {/* CREATE TEAM MODAL */}
      <Modal visible={isModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => isSelectingPlayer ? goToForm() : handleCloseModal()}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBg, paddingBottom: keyboardHeight }]}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={[styles.bottomSheet, { backgroundColor: colors.bgSurface, height: currentSheetHeight }]}>
                <View style={styles.dragHandle} />
                <Animated.View style={[styles.sliderContainer, { width: screenWidth * 2, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -screenWidth] }) }] }]}>

                  {/* PAGE 1: FORM */}
                  <View style={[styles.pageWrapper, { width: screenWidth }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Team</Text>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formScrollContent}>
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>TEAM TYPE</Text>
                        <View style={[styles.segmentedControl, { borderColor: colors.borderColor, backgroundColor: colors.bgBase }]}>
                          {['Double', 'Club'].map((type) => {
                            const isActive = teamType === type;
                            return (
                              <TouchableOpacity key={type} activeOpacity={0.8} onPress={() => setTeamType(type)} style={[styles.segmentButton, isActive && { backgroundColor: colors.bgSurface, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2 }]}>
                                <Text style={[styles.segmentText, { color: isActive ? colors.textPrimary : colors.textTertiary }]}>{type}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>TEAM NAME *</Text>
                        <TextInput value={teamName} onChangeText={setTeamName} placeholder="e.g. Sat-Chi Smashers" placeholderTextColor={colors.textTertiary} style={[styles.textInput, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, color: colors.textPrimary }]} />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>TEAM CODE (3-4 LETTERS)</Text>
                        <TextInput value={teamCode} onChangeText={setTeamCode} placeholder="SCS" placeholderTextColor={colors.textTertiary} maxLength={4} autoCapitalize="characters" style={[styles.textInput, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, color: colors.textPrimary }]} />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>PLAYER 1 *</Text>
                        <View style={[styles.dropdownSelector, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                          <Text style={[styles.dropdownSelectedText, { color: colors.textPrimary }]}>{user?.fullName || 'Myself'}</Text>
                        </View>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>PLAYER 2 *</Text>
                        <TouchableOpacity activeOpacity={0.7} onPress={goToSelectPlayer} style={[styles.dropdownSelector, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                          <Text style={[styles.dropdownSelectedText, { color: selectedPlayer2 ? colors.textPrimary : colors.textTertiary }]}>{selectedPlayer2 ? selectedPlayer2.name : 'Select Second Partner'}</Text>
                          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.modalActionRow}>
                        <TouchableOpacity activeOpacity={0.7} onPress={handleCloseModal} style={[styles.actionButton, styles.cancelButton, { borderColor: colors.borderColor, backgroundColor: colors.bgSurface }]}>
                          <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.85} onPress={handleCreateTeam} disabled={!teamName.trim() || !selectedPlayer2} style={[styles.actionButton, { backgroundColor: colors.accentBg, opacity: teamName.trim() && selectedPlayer2 ? 1 : 0.6 }]}>
                          <Text style={[styles.actionButtonText, { color: colors.accentText }]}>Create Team</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>

                  {/* PAGE 2: SELECT PARTNER */}
                  <View style={[styles.pageWrapper, { width: screenWidth }]}>
                    <View style={styles.inlineSearchHeader}>
                      <TouchableOpacity onPress={goToForm} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={[styles.modalTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Select Partner</Text>
                    </View>
                    <View style={[styles.friendSearchBar, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                      <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
                      <TextInput value={friendSearch} onChangeText={setFriendSearch} placeholder="Search by name or email..." placeholderTextColor={colors.textTertiary} style={[styles.friendSearchInput, { color: colors.textPrimary }]} />
                      {friendSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setFriendSearch('')}>
                          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <FlatList
                      data={filteredFriends}
                      keyExtractor={(item, index) => item?.player?._id || item?.connectionId || index.toString()}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.friendListContent}
                      ListEmptyComponent={<View style={styles.noFriendsContainer}><Text style={[styles.noFriendsText, { color: colors.textTertiary }]}>No connections found</Text></View>}
                      renderItem={({ item, index }) => {
                        const player = item?.player;
                        const isSelected = selectedPlayer2?.id === player?._id;
                        return (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => { setSelectedPlayer2({ id: player._id, name: player.fullName, email: player.email }); goToForm(); }}
                            style={[styles.friendRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderColor }]}
                          >
                            <View style={styles.friendInfoLeft}>
                              {player?.profile_image ? (
                                <Image source={{ uri: player.profile_image }} style={styles.avatar} />
                              ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgBase }]}><Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>{(player?.fullName || '?')[0].toUpperCase()}</Text></View>
                              )}
                              <View style={styles.friendTextCol}>
                                <Text style={[styles.friendName, { color: colors.textPrimary }]}>{player?.fullName}</Text>
                                <Text style={[styles.friendEmail, { color: colors.textTertiary }]}>{maskEmail(player?.email)}</Text>
                              </View>
                            </View>
                            {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.accentText || colors.textPrimary} />}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Teams;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerAddButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchFilterContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBar: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  searchInput: { fontSize: 15, fontWeight: '400', padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterPillText: { fontSize: 13.5, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 90 },

  /* Team Card Styles */
  teamCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsWrapper: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#EAB308',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  avatarSecond: {
    marginLeft: -12,
  },
  pairAvatar: { width: '100%', height: '100%' },
  pairAvatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  pairAvatarInitial: { fontSize: 14, fontWeight: '700' },

  teamHeaderInfo: { flex: 1, justifyContent: 'center' },
  teamNameText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  teamSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    width: '100%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsSummaryText: { fontSize: 13.5, fontWeight: '500', letterSpacing: -0.1 },

  /* Invitation Action Row */
  inviteActionRow: { flexDirection: 'row', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  inviteButton: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  declineButton: { borderWidth: 1 },
  acceptButton: { borderWidth: 0 },
  inviteButtonText: { fontSize: 13.5, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14 },
  skeletonLine: { borderRadius: 6 },
  skeletonAvatar: { width: 38, height: 38, borderRadius: 19 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, width: '100%', overflow: 'hidden' },
  dragHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D4D4D8', alignSelf: 'center', marginBottom: 14 },
  sliderContainer: { flex: 1, flexDirection: 'row' },
  pageWrapper: { flex: 1, paddingHorizontal: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  formScrollContent: { paddingBottom: 28 },
  inputLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  textInput: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14.5 },
  dropdownSelector: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownSelectedText: { fontSize: 14.5, fontWeight: '500' },
  segmentedControl: { flexDirection: 'row', height: 44, borderRadius: 12, borderWidth: 1, padding: 3 },
  segmentButton: { flex: 1, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  inlineSearchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: { marginRight: 12, padding: 4 },
  friendSearchBar: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  friendSearchInput: { flex: 1, fontSize: 14.5, padding: 0 },
  friendListContent: { flexGrow: 1, paddingBottom: 28 },
  friendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  friendInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '700' },
  friendTextCol: { flex: 1 },
  friendName: { fontSize: 14.5, fontWeight: '600' },
  friendEmail: { fontSize: 12, marginTop: 1 },
  noFriendsContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  noFriendsText: { fontSize: 14 },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 8 },
  actionButton: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { borderWidth: 1 },
  actionButtonText: { fontSize: 14.5, fontWeight: '700' },
});