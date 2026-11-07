import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  useColorScheme,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';
import { get_api, WS_BASE_URL } from '../../utils/api';

// Native WebSocket server endpoint


const FILTERS = ['All', 'Unread', 'Online'];

// Formatter: Today -> "11:42 AM", Yesterday -> "Yesterday", Older -> "Oct 24"
const formatChatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ========================================================
// REUSABLE PULSING SKELETON CARD (Zero External Dependencies)
// ========================================================
const SkeletonCard = ({ colors }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const skeletonBaseColor = colors.borderColor;

  return (
    <View
      style={[
        styles.chatCard,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderColor,
        },
      ]}
    >
      {/* Avatar Skeleton */}
      <Animated.View
        style={[
          styles.avatarSkeleton,
          { backgroundColor: skeletonBaseColor, opacity: pulseAnim },
        ]}
      />

      {/* Text Details Skeleton */}
      <View style={styles.chatDetails}>
        <View style={styles.topRow}>
          <Animated.View
            style={[
              styles.skeletonBar,
              { width: '42%', height: 14, backgroundColor: skeletonBaseColor, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBar,
              { width: '16%', height: 11, backgroundColor: skeletonBaseColor, opacity: pulseAnim },
            ]}
          />
        </View>

        <View style={styles.bottomRow}>
          <Animated.View
            style={[
              styles.skeletonBar,
              { width: '68%', height: 12, backgroundColor: skeletonBaseColor, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBadge,
              { backgroundColor: skeletonBaseColor, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const Chats = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();

  const auth = useSelector((state) => state?.auth);
  const currentUserId = auth?.user?._id || auth?.user?.id || auth?.id || auth?._id;
  const token = auth?.token;

  const [conversationList, setConversationList] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isFirstMount = useRef(true);
  const wsRef = useRef(null);

  // ========================================================
  // 1. DUAL FETCH: FIRST VISIT SKELETON vs SILENT BACKGROUND SYNC
  // ========================================================
  const fetchChats = useCallback(
    async (mode = 'silent') => {
      if (!token) return;

      if (mode === 'initial') {
        setInitialLoading(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      }
      // 'silent' mode sets no loading indicators, leaving the UI completely undisturbed

      try {
        const res = await get_api('/chats', token);
        if (res?.success && Array.isArray(res?.conversations)) {
          setConversationList(res.conversations);
          setTotalUnread(res.totalUnread || 0);
        }
      } catch (error) {
        // console.error('Fetch chats error:', error);
      } finally {
        if (mode === 'initial') setInitialLoading(false);
        if (mode === 'refresh') setRefreshing(false);
      }
    },
    [token]
  );

  // First-time mount: show Skeleton shimmer
  useEffect(() => {
    fetchChats('initial');
  }, [fetchChats]);

  // Subsequent focus (e.g. popping back from Converstation screen): silent background refresh
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      fetchChats('silent');
    }, [fetchChats])
  );

  // ========================================================
  // 2. REAL-TIME WEBSOCKET SYNC
  // ========================================================
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, message, conversationId } = data;

        if (type === 'new_message' && message) {
          setConversationList((prev) => {
            const targetId = String(conversationId || message.conversationId);
            const exists = prev.find((c) => String(c._id) === targetId);

            if (exists) {
              console.log(1);
              
              const updated = {
                ...exists,
                lastMessage: message,
                unreadCount: (exists.unreadCount || 0) + 1,
                updatedAt: message.createdAt || new Date().toISOString(),
              };
              return [updated, ...prev.filter((c) => String(c._id) !== targetId)];
            }
            fetchChats('silent');
            return prev;
          });
        } else if (type === 'messages_read') {
          fetchChats('silent');
        }
      } catch (err) {
        // console.error('Chats WS error:', err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, fetchChats]);

  // ========================================================
  // 3. SEARCH & PILL FILTERS
  // ========================================================
  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return conversationList.filter((chat) => {
      const otherUser = chat?.otherUser || {};
      const name = (otherUser.fullName || otherUser.name || '').toLowerCase();
      const lastMsgText = (chat?.lastMessage?.text || '').toLowerCase();

      const matchesSearch = !query || name.includes(query) || lastMsgText.includes(query);

      let matchesFilter = true;
      if (selectedFilter === 'Unread') matchesFilter = (chat?.unreadCount || 0) > 0;
      if (selectedFilter === 'Online') matchesFilter = !!otherUser.isOnline;

      return matchesSearch && matchesFilter;
    });
  }, [conversationList, searchQuery, selectedFilter]);

  // ========================================================
  // 4. RENDER CONVERSATION ITEM
  // ========================================================
  const renderChatItem = ({ item }) => {
    const otherUser = item?.otherUser || {};
    const lastMsg = item?.lastMessage || {};
    const unreadCount = item?.unreadCount || 0;
    const hasUnread = unreadCount > 0;

    const senderId = typeof lastMsg.sender === 'object' ? lastMsg.sender?._id : lastMsg.sender;
    const isSentByMe = senderId && String(senderId) === String(currentUserId);
    const isRead = lastMsg.status === 'read';
    const isDelivered = lastMsg.status === 'delivered';

    const avatarUrl = otherUser.profile_image || otherUser.avatar;
    const partnerName = otherUser.fullName || otherUser.name || 'Player';
    const chatTime = formatChatTime(lastMsg.createdAt || item.updatedAt);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() =>
          navigation?.navigate('Converstation', {
            conversationId: item._id,
            partner: otherUser,
            user: { player: otherUser },
            recipientId: otherUser._id,
          })
        }
        style={[
          styles.chatCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
          },
        ]}
      >
        {/* Opponent Avatar with Online Indicator */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.bgBase, borderColor: colors.borderColor },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                {partnerName[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {otherUser.isOnline && (
            <View
              style={[
                styles.onlineIndicator,
                {
                  backgroundColor: colors.success,
                  borderColor: colors.bgSurface,
                },
              ]}
            />
          )}
        </View>

        {/* Message Details */}
        <View style={styles.chatDetails}>
          <View style={styles.topRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.playerName,
                { color: colors.textPrimary },
                hasUnread && styles.unreadBold,
              ]}
            >
              {partnerName}
            </Text>
            <Text
              style={[
                styles.timeText,
                { color: hasUnread ? colors.textPrimary : colors.textTertiary },
                hasUnread && styles.unreadBold,
              ]}
            >
              {chatTime}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.messageWithTick}>
              {isSentByMe && (
                <Ionicons
                  name={isRead || isDelivered ? 'checkmark-done' : 'checkmark'}
                  size={15}
                  color={isRead ? '#38BDF8' : colors.textTertiary}
                  style={styles.sentTick}
                />
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.lastMessageText,
                  {
                    color: hasUnread ? colors.textPrimary : colors.textSecondary,
                  },
                  hasUnread && styles.unreadMessage,
                ]}
              >
                {lastMsg.text || (lastMsg.mediaType === 'image' ? '📷 Photo' : 'No messages yet')}
              </Text>
            </View>

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.accentBg }]}>
                <Text style={[styles.unreadBadgeText, { color: colors.accentText }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={handleEdges ? handleEdges() : ['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.bgBase }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity
          onPress={() => navigation?.openDrawer?.()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Chats</Text>
          {totalUnread > 0 && (
            <View style={[styles.headerCountBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.headerCountText, { color: colors.accentText }]}>
                {totalUnread}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
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
                    { color: isActive ? colors.accentText : colors.textSecondary },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chats List or Shimmer Skeletons */}
      {initialLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <SkeletonCard key={key} colors={colors} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChats('refresh')}
              tintColor={colors.textPrimary}
              colors={[colors.textPrimary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {searchQuery
                  ? `No conversations matching "${searchQuery}"`
                  : selectedFilter === 'Unread'
                    ? 'No unread messages'
                    : selectedFilter === 'Online'
                      ? 'No players currently online'
                      : 'No conversations yet'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Chats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
  },
  chatDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerName: {
    fontSize: 15.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  unreadBold: {
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageWithTick: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sentTick: {
    marginRight: 4,
  },
  lastMessageText: {
    fontSize: 13.5,
    flex: 1,
    fontWeight: '400',
  },
  unreadMessage: {
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Skeleton UI styles
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  skeletonBar: {
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});