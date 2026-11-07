import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { light, dark } from '../../../theme/Color';
import { get_api, patch_api } from '../../../utils/api';
import { handleEdges } from '../../../utils/edges';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Relative timestamp formatter
const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Icon identifier per notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'NEW_MATCH':
      return 'badminton';
    case 'MATCH_CREATED':
      return 'calendar-plus';
    case 'MATCH_CHALLENGE':
      return 'sword-cross';
    case 'CHALLENGE_ACCEPTED':
      return 'handshake-outline'; // or 'handshake'
    case 'CHALLENGE_DECLINED':
      return 'close-circle-outline';
    case 'MATCH_CONFIRMED':
      return 'check-decagram';
    case 'TOSS_COMPLETED':
      return 'bitcoin';
    case 'MATCH_LIVE':
      return 'access-point';
    case 'GAME_WON':
      return 'medal-outline';
    case 'MATCH_COMPLETED':
      return 'trophy';
    case 'CONNECTION_REQUEST':
      return 'account-plus';
    case 'CONNECTION_ACCEPTED':
      return 'account-check';
    case 'GENERAL':
    default:
      return 'bell-outline';
  }
};

const Notification = () => {
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme();
  const user = useSelector((state) => state.auth);

  const isDark = (user?.theme || systemColorScheme) === 'dark';
  const theme = isDark ? dark : light;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const get_notification = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (!isPullToRefresh) setLoading(true);
        const res = await get_api('/notifications', user?.token);
        if (res?.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (error) {
        // console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.token]
  );

  const read_all = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
      await patch_api('/notifications/mark-all-read', {}, user?.token);
    } catch (error) {
      // console.error('Error marking all as read:', error);
      get_notification(true);
    }
  };

  const read_single = async (id, isRead) => {
    if (isRead) return;
    try {
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await patch_api(`/notifications/${id}/read`, {}, user?.token);
    } catch (error) {
      // console.error('Error marking notification as read:', error);
    }
  };

  const handleCardPress = (item) => {
    read_single(item._id, item.isRead);

    if (item?.type === 'CONNECTION_REQUEST') {
      navigation.navigate('DrawerRoot', {
        screen: 'Friends',
        params: {
          filter: 'Request'
        }
      });
    }
    else if (item?.type === 'CONNECTION_ACCEPTED') {
      navigation.navigate('DrawerRoot', {
        screen: 'Friends',
        params: {
          filter: 'Mutual Connection'
        }
      });
    }

    else if (item?.type === 'CHALLENGE_ACCEPTED' || item?.type === 'MATCH_CHALLENGE') {
      navigation.navigate('DrawerRoot', {
        screen: 'MainTabs',
        params: {
          screen: 'Matches',
          params: { filter: 'upcoming' },
        },
      });
    }

    else if (item?.type === 'MATCH_STARTED') {
      navigation.navigate('DrawerRoot', {
        screen: 'MainTabs',
        params: {
          screen: 'Matches',
          params: { filter: 'live' },
        },
      });
    }

    else if (item?.type === 'MATCH_COMPLETED') {
      navigation.navigate('DrawerRoot', {
        screen: 'MainTabs',
        params: {
          screen: 'Matches',
          params: { filter: 'completed' },
        },
      });
    }
  };

  useEffect(() => {
    get_notification();
  }, [get_notification]);

  const onRefresh = () => {
    setRefreshing(true);
    get_notification(true);
  };

  const renderItem = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCardPress(item)}
        style={styles.card}
      >
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name={icon} color={theme?.textPrimary} size={24} />

          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.contentWrapper}>
          <Text
            style={[styles.messageText, !item.isRead && styles.unreadMessageText]}
            numberOfLines={2}
          >
            {item.body || item.title}
          </Text>
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>You're all caught up for now!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={handleEdges()}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header with Back Button, Heading, and Mark all as read */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" color={theme.textPrimary} size={22} />
          </TouchableOpacity>

          <Text style={styles.screenHeading}>Notifications</Text>

          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={read_all}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List / Loading State */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={theme.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.textPrimary}
              colors={[theme.textPrimary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Notification;

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgBase,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      marginRight: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    screenHeading: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    unreadCountBadge: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
    },
    unreadCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    markAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    centerLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 14,
      paddingBottom: 20,
      gap: 10,
    },
    listContentEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgSurface,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    avatarWrapper: {
      position: 'relative',
      marginRight: 12,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.bgBase,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarEmoji: {
      fontSize: 20,
    },
    unreadDot: {
      position: 'absolute',
      top: -1,
      left: -1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#2563EB',
      borderWidth: 1.5,
      borderColor: theme.bgSurface,
    },
    contentWrapper: {
      flex: 1,
      justifyContent: 'center',
    },
    messageText: {
      fontSize: 14,
      lineHeight: 19,
      color: theme.textPrimary,
      fontWeight: '400',
    },
    unreadMessageText: {
      fontWeight: '600',
    },
    timeText: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 3,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    emptyEmoji: {
      fontSize: 34,
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: 'center',
    },
  });