import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { getInitials } from './functions/Avatar';
import { get_api } from '../../utils/api';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const FILTERS = ['All', 'Single', 'Double'];
const PAGE_LIMIT = 30;

// Skeleton Card matching the left-aligned avatar layout
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
    <View style={[styles.avatarCircle, { backgroundColor: colors.borderColor }]} />

    <View style={styles.cardContent}>
      <View style={styles.cardTopRow}>
        <View
          style={{
            width: 140,
            height: 18,
            borderRadius: 6,
            backgroundColor: colors.borderColor,
          }}
        />
        <View
          style={{
            width: 60,
            height: 22,
            borderRadius: 12,
            backgroundColor: colors.borderColor,
          }}
        />
      </View>

      <View style={styles.statsRow}>
        <View
          style={{
            width: '80%',
            height: 14,
            borderRadius: 4,
            backgroundColor: colors.borderColor,
            marginTop: 4,
          }}
        />
      </View>
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

  // Stats Cache State: { [userId]: { completedMatches, totalWon, winRate } }
  const [playerStats, setPlayerStats] = useState({});

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

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

  // Fetch Stats Batch 
  const fetchStatsForPlayers = useCallback(
    async (playerList) => {
      const currentUserId = user?.user?._id || user?._id;

      playerList.forEach(async (p) => {
        const playerId = p._id || p.id;
        if (!playerId || playerStats[playerId]) return;

        try {
          const isCurrentUser = playerId === currentUserId;
          const endpoint = isCurrentUser
            ? '/matches/my-stats'
            : `/matches/stats/${playerId}`;

          const statsRes = await get_api(endpoint, user?.token);

          if (statsRes?.success && statsRes?.stats) {
            setPlayerStats((prev) => ({
              ...prev,
              [playerId]: statsRes.stats,
            }));
          }
        } catch (err) {
          // console.error(`Error fetching stats for user ${playerId}:`, err);
        }
      });
    },
    [user?.token, user?.user?._id, user?._id, playerStats]
  );

  // Fetch Players
  const fetchPlayers = useCallback(
    async (pageToFetch = 1, isRefresh = false, search = searchQuery) => {
      try {
        if (pageToFetch === 1 && !isRefresh) {
          setInitialLoading(true);
        }

        const encodedSearch = encodeURIComponent(search.trim());
        const res = await get_api(
          `/users/allPlayer?page=${pageToFetch}&limit=${PAGE_LIMIT}&search=${encodedSearch}`,
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

          if (res.hasMore !== undefined) {
            setHasMore(res.hasMore);
          } else {
            setHasMore(newPlayers.length === PAGE_LIMIT);
          }

          // Trigger stats fetch for the newly retrieved players
          fetchStatsForPlayers(newPlayers);
        }
      } catch (error) {
        // console.error('Fetch players error:', error);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [user?.token, searchQuery, fetchStatsForPlayers]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchPlayers(1, false, '');
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchPlayers(1, true, searchQuery);
  };

  const handleLoadMore = () => {
    if (initialLoading || loadingMore || refreshing || !hasMore) return;
    setLoadingMore(true);
    fetchPlayers(page + 1, false, searchQuery);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const category = player.role || player.category || '';
      return selectedFilter === 'All'
        ? true
        : category.toLowerCase() === selectedFilter.toLowerCase();
    });
  }, [players, selectedFilter]);

  const renderPlayerCard = ({ item }) => {
    const playerId = item._id || item.id;
    const name = item.fullName || item.name || 'Unknown';
    const category = (item.role || item.category || 'SINGLE').toUpperCase();
    const stats = playerStats[playerId];

    return (
      <TouchableOpacity
        style={[
          styles.playerCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PlayerProfile', { item, stats })}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.bgBase }]}>
          {item?.profile_image || item?.avatar ? (
            <Image
              source={{ uri: item.profile_image || item.avatar }}
              style={{ width: 52, height: 52, borderRadius: 26 }}
            />
          ) : (
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
              {getInitials(name)}
            </Text>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.bgBase }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.textTertiary }]}>
                {category}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {stats ? (
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {stats.completedMatches ?? 0} Matches  •  {stats.totalWon ?? 0} Wins  •
                <Text style={[styles.statTextBold, { color: colors.textPrimary }]}>
                  {'  '}{stats.winRate ?? '0%'} Win Rate
                </Text>
              </Text>
            ) : (
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                Loading stats...
              </Text>
            )}
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
            onSubmitEditing={() => {
              setHasMore(true);
              fetchPlayers(1, true, searchQuery); // Trigger search explicitly on Return/Enter key
            }}
            returnKeyType="search"
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statTextBold: {
    fontWeight: '800',
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
});