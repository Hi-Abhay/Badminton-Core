import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getInitials } from '../../TabScreens/functions/Avatar';
import ConnectionSkeleton from './ConnectionSkeleton';
import { patch_api } from '../../../utils/api';
import { useSelector } from 'react-redux';

const RequestTab = ({
  data = [],
  colors,
  loading = false,
  refreshing,
  onRefresh,
  onAccept,
  onDecline,
}) => {
  const user = useSelector(state => state.auth);

  const formatHandle = name => {
    if (!name) return '@player';
    return `@${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
  };

  if (loading) {
    return <ConnectionSkeleton colors={colors} type="circles" count={6} />;
  }

  const renderItem = ({ item }) => {
    console.log(item);

    const sender =
      item?.requester || item?.requester || item?.requester || item;
    const fullName = sender?.fullName || 'Unknown Player';
    const avatar = sender?.avatar || sender?.profile_image;
    const requestId = item?._id || item?.id || item?.connectionId;
    console.log(item);

    const handle_request = async respond => {
      const payload = {
        action: respond ? 'accept' : 'decline',
      };

      try {
        const res = await patch_api(
          `/connections/${requestId}/respond`,
          payload,
          user?.token,
        );

        const result = await res.json();

        if (res.ok && result?.success) {
          if (respond) {
            onAccept?.(item, sender);
          } else {
            onDecline?.(requestId);
          }
        } else {
          console.log('Request action failed:', result);
        }
      } catch (error) {
        console.log('Connection request error:', error);
      }
    };

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
          },
        ]}
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={[styles.avatar, { backgroundColor: colors.borderColor }]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: colors.borderColor },
            ]}
          >
            <Text
              style={[styles.avatarInitials, { color: colors.textPrimary }]}
            >
              {getInitials
                ? getInitials(fullName)
                : fullName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.infoCol}>
          <Text
            style={[styles.fullName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {fullName}
          </Text>
          <Text
            style={[styles.handle, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {formatHandle(fullName)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.success + '1A',
                borderColor: colors.success,
              },
            ]}
            onPress={() => handle_request(true)}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.danger + '1A',
                borderColor: colors.danger,
              },
            ]}
            onPress={() => handle_request(false)}
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        (item?._id || item?.id || item?.connectionId || index).toString()
      }
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.borderColor}
          colors={[colors.borderColor]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="person-add-outline"
            size={54}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Incoming Requests
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            You don't have any pending invitations right now.
          </Text>
        </View>
      }
    />
  );
};

export default RequestTab;

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  handle: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
