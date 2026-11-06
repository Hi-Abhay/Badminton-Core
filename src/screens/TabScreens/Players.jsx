import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  useColorScheme,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { getInitials } from './functions/Avatar';
import { get_api } from '../../utils/api';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const FILTERS = ['All', 'Single', 'Double'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['Single', 'Double', 'Both'];
const PAGE_LIMIT = 30;

// Reusable Skeleton Card with Pulsing Animation
const SkeletonCard = ({ colors, pulseOpacity }) => (
  <Animated.View
    style={[
      styles.playerCard,
      {
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderColor,
        opacity: pulseOpacity,
      },
    ]}
  >
    <View style={styles.cardTopRow}>
      <View style={styles.playerInfoGroup}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.borderColor }]} />
        <View
          style={{
            width: 130,
            height: 16,
            borderRadius: 6,
            backgroundColor: colors.borderColor,
          }}
        />
      </View>
      <View
        style={{
          width: 65,
          height: 22,
          borderRadius: 8,
          backgroundColor: colors.borderColor,
        }}
      />
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.statsRow}>
      <View
        style={{
          width: '65%',
          height: 14,
          borderRadius: 4,
          backgroundColor: colors.borderColor,
        }}
      />
    </View>
  </Animated.View>
);

const Players = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const user = useSelector((state) => state.auth);
  const navigation = useNavigation();

  // Data & Pagination States
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [gender, setGender] = useState('Male');
  const [playingCategory, setPlayingCategory] = useState('Singles');
  const [pickerType, setPickerType] = useState(null);

  // Pulse animation for skeleton
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let pulse;
    if (initialLoading) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    }
    return () => {
      if (pulse) pulse.stop();
    };
  }, [initialLoading, pulseAnim]);

  // Fetch Players from Backend
  const fetchPlayers = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      try {
        if (pageToFetch === 1 && !isRefresh) {
          setInitialLoading(true);
        }

        const res = await get_api(
          `/users/allPlayer?page=${pageToFetch}&limit=${PAGE_LIMIT}`,
          user?.token
        );

        if (res?.success) {
          const newPlayers = res.players || [];

          if (isRefresh || pageToFetch === 1) {
            setPlayers(newPlayers);
          } else {
            setPlayers((prev) => [...prev, ...newPlayers]);
          }

          setPage(pageToFetch);

          // SAFEST HAS-MORE CHECK:
          // If the API returns fewer items than the limit, we've hit the end.
          if (res.hasMore !== undefined) {
            setHasMore(res.hasMore);
          } else {
            setHasMore(newPlayers.length === PAGE_LIMIT);
          }
        }
      } catch (error) {
        console.error('Fetch players error:', error);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [user?.token]
  );

  useEffect(() => {
    fetchPlayers(1);
  }, [fetchPlayers]);

  // Pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchPlayers(1, true);
  };

  // Scroll to bottom pagination
  const handleLoadMore = () => {
    if (initialLoading || loadingMore || refreshing || !hasMore) {
      return; // Prevent duplicate API calls
    }

    setLoadingMore(true);
    fetchPlayers(page + 1);
  };

  // Filtered Players View
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const name = player.fullName || player.name || '';
      const category = player.role || player.category || '';

      const matchesSearch = name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        selectedFilter === 'All'
          ? true
          : category.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [players, searchQuery, selectedFilter]);

  const renderPlayerCard = ({ item }) => {
    const name = item.fullName || item.name || 'Unknown';
    const category = (item.role || item.category || 'SINGLE').toUpperCase();
    
    return (
      <TouchableOpacity
        style={[
          styles.playerCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PlayerProfile', { item })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.playerInfoGroup}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.bgBase }]}>
              {item?.profile_image ? (
                <Image source={{ uri: item.profile_image }} style={{ width: 42, height: 42, borderRadius: 21 }} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
                  {getInitials(name)}
                </Text>
              )}
            </View>
            <Text style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <View style={[styles.categoryBadge, { backgroundColor: colors.bgBase }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.textTertiary }]}>
              {category}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Players</Text>
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
                    backgroundColor: isActive ? colors.textPrimary : colors.bgSurface,
                    borderColor: isActive ? colors.textPrimary : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isActive ? colors.bgBase : colors.textPrimary },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List or Skeleton Loading */}
      {initialLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <SkeletonCard key={key} colors={colors} pulseOpacity={pulseAnim} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          renderItem={renderPlayerCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} 
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No players found
              </Text>
            </View>
          }
        />
      )}

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
    overflow: 'hidden',
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
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