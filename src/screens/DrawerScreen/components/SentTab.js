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

const SentTab = ({
  data = [],
  colors,
  loading = false,
  refreshing,
  onRefresh,
  onCancel,
}) => {
  if (loading) {
    return <ConnectionSkeleton colors={colors} type="pill" count={6} />;
  }

  const formatHandle = (name) => {
    if (!name) return '@player';
    return `@${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
  };

  const renderItem = ({ item }) => {
    const target = item?.recipient || item?.player || item?.user || item;
    const fullName = target?.fullName || 'Unknown Player';
    const avatar = target?.avatar || target?.profile_image;
    const requestId = item?._id || item?.id || item?.connectionId;
    
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
            <Text style={[styles.avatarInitials, { color: colors.textPrimary }]}>
              {getInitials ? getInitials(fullName) : fullName?.charAt(0)?.toUpperCase()}
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
          <Ionicons name="paper-plane-outline" size={54} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Sent Requests
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            You haven't sent any pending connection requests.
          </Text>
        </View>
      }
    />
  );
};

export default SentTab;

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
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
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