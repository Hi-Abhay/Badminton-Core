import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MOCK_CURRENT_USER = {
  id: 'user_me',
  name: 'Alex Chen',
  username: '@alexchen_bdmtn',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  seedRating: 'A+',
};

const MOCK_CONNECTIONS = [
  {
    id: 'conn_1',
    playerA: MOCK_CURRENT_USER,
    playerB: {
      id: 'p_2',
      name: 'Viktor Axelsen',
      username: '@v_axelsen',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      seedRating: 'PRO',
    },
    relationship: 'mutual',
  },
  {
    id: 'conn_2',
    playerA: MOCK_CURRENT_USER,
    playerB: {
      id: 'p_3',
      name: 'Tai Tzu-ying',
      username: '@tai_ty',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      seedRating: 'PRO',
    },
    relationship: 'following',
  },
  {
    id: 'conn_3',
    playerA: MOCK_CURRENT_USER,
    playerB: {
      id: 'p_4',
      name: 'Marcus Gideon',
      username: '@marcus_gid',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      seedRating: 'Elite',
    },
    relationship: 'mutual',
  },
  {
    id: 'conn_4',
    playerA: MOCK_CURRENT_USER,
    playerB: {
      id: 'p_5',
      name: 'Carolina Marín',
      username: '@caro_marin',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      seedRating: 'PRO',
    },
    relationship: 'follows_you',
  },
  {
    id: 'conn_5',
    playerA: MOCK_CURRENT_USER,
    playerB: {
      id: 'p_6',
      name: 'Kento Momota',
      username: '@kento_m',
      avatarUrl:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      seedRating: 'PRO',
    },
    relationship: 'following',
  },
];

const Friends = ({ onSelectPlayer }) => {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;
  const isDark = scheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState(MOCK_CONNECTIONS);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(
      (c) =>
        c.playerB.name.toLowerCase().includes(q) ||
        c.playerB.username.toLowerCase().includes(q)
    );
  }, [connections, searchQuery]);

  const handleToggleRelationship = (connectionId) => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id !== connectionId) return c;
        if (c.relationship === 'following') {
          return { ...c, relationship: 'follows_you' };
        }
        if (c.relationship === 'mutual') {
          return { ...c, relationship: 'follows_you' };
        }
        return { ...c, relationship: 'mutual' };
      })
    );
  };

  const renderConnectionItem = ({ item }) => {
    const isMutual = item.relationship === 'mutual';
    const isFollowing = item.relationship === 'following';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bgSurface,
            borderColor: theme.borderColor,
          },
        ]}
      >
        <View style={styles.connectionStage}>
          {/* Player A Node */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelectPlayer && onSelectPlayer(item.playerA)}
            style={styles.playerNode}
          >
            <View style={[styles.avatarRing, { borderColor: theme.borderColor }]}>
              <Image source={{ uri: item.playerA.avatarUrl }} style={styles.avatar} />
              {item.playerA.seedRating && (
                <View style={[styles.ratingBadge, { backgroundColor: theme.accentBg }]}>
                  <Text style={[styles.ratingText, { color: theme.accentText }]}>
                    {item.playerA.seedRating}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.playerName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.playerA.name}
            </Text>
            <Text style={[styles.playerHandle, { color: theme.textTertiary }]} numberOfLines={1}>
              {item.playerA.username}
            </Text>
          </TouchableOpacity>

          {/* Connection Vector Track */}
          <View style={styles.trackContainer}>
            <View style={[styles.trackLine, { backgroundColor: theme.borderColor }]} />

            <View
              style={[
                styles.relationHub,
                {
                  backgroundColor: theme.bgSurface,
                  borderColor: theme.borderColor,
                },
              ]}
            >
              {isMutual ? (
                <Text style={[styles.trackIcon, { color: theme.textPrimary }]}>⇄</Text>
              ) : isFollowing ? (
                <Text style={[styles.trackIcon, { color: theme.textPrimary }]}>→</Text>
              ) : (
                <Text style={[styles.trackIcon, { color: theme.textPrimary }]}>←</Text>
              )}
            </View>

            <View
              style={[
                styles.statusTag,
                {
                  backgroundColor: isMutual ? theme.accentBg : theme.bgBase,
                  borderColor: theme.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  {
                    color: isMutual ? theme.accentText : theme.textSecondary,
                  },
                ]}
              >
                {isMutual ? 'MUTUAL' : isFollowing ? 'FOLLOWING' : 'FOLLOWS YOU'}
              </Text>
            </View>
          </View>

          {/* Player B Node */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelectPlayer && onSelectPlayer(item.playerB)}
            style={styles.playerNode}
          >
            <View style={[styles.avatarRing, { borderColor: theme.borderColor }]}>
              <Image source={{ uri: item.playerB.avatarUrl }} style={styles.avatar} />
              {item.playerB.seedRating && (
                <View style={[styles.ratingBadge, { backgroundColor: theme.accentBg }]}>
                  <Text style={[styles.ratingText, { color: theme.accentText }]}>
                    {item.playerB.seedRating}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.playerName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.playerB.name}
            </Text>
            <Text style={[styles.playerHandle, { color: theme.textTertiary }]} numberOfLines={1}>
              {item.playerB.username}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Footer Action */}
        <View style={[styles.cardFooter, { borderTopColor: theme.borderColor }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleToggleRelationship(item.id)}
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  item.relationship === 'follows_you' ? theme.accentBg : 'transparent',
                borderColor: theme.borderColor,
                borderWidth: item.relationship === 'follows_you' ? 0 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.actionButtonText,
                {
                  color:
                    item.relationship === 'follows_you'
                      ? theme.accentText
                      : theme.textSecondary,
                },
              ]}
            >
              {item.relationship === 'mutual'
                ? 'Unfollow'
                : item.relationship === 'following'
                ? 'Following'
                : 'Follow Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { borderColor: theme.borderColor, backgroundColor: theme.bgSurface },
        ]}
      >
        <Text style={styles.emptySymbol}>🏸</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        Build your badminton community
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
        Connect with players, sparring partners, and tournament rivals to share stats and track matches.
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={handleEdges()} style={[styles.safeArea, { backgroundColor: theme.bgBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgBase}
      />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
        <TouchableOpacity
          onPress={handleOpenDrawer}
          activeOpacity={0.7}
          style={[
            styles.drawerButton,
            { borderColor: theme.borderColor, backgroundColor: theme.bgSurface },
          ]}
        >
          {/* Hamburger icon for drawer */}
              <Ionicons name="chevron-back-outline" color={ theme.textPrimary} size={24} />

        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Following</Text>
          <Text style={[styles.counterText, { color: theme.textTertiary }]}>
            {connections.length} ACTIVE CONNECTIONS
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.bgSurface,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.searchIcon, { color: theme.textTertiary }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search players by name or handle..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.clearSearch, { color: theme.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Player Connections List */}
      <FlatList
        data={filteredConnections}
        keyExtractor={(item) => item.id}
        renderItem={renderConnectionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

export default Friends;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerIcon: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: -1,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  counterText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  headerSpacer: {
    width: 38,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearch: {
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  connectionStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  playerNode: {
    width: '32%',
    alignItems: 'center',
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    padding: 2,
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  playerHandle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  trackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    top: 29,
  },
  relationHub: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: 8,
  },
  trackIcon: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  statusTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptySymbol: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});