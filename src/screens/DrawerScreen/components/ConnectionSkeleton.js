import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ConnectionSkeleton = ({ colors, type = 'circles', count = 6 }) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
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

    return () => pulse.stop();
  }, [pulseAnim]);

  const skeletonColor = colors.borderColor;

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.card,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              opacity: pulseAnim,
            },
          ]}
        >
          {/* Avatar Skeleton */}
          <View style={[styles.avatar, { backgroundColor: skeletonColor }]} />

          {/* Name & Username Skeleton */}
          <View style={styles.infoCol}>
            <View
              style={[
                styles.titleBar,
                {
                  backgroundColor: skeletonColor,
                  width: idx % 2 === 0 ? '60%' : '48%',
                },
              ]}
            />
            <View style={[styles.subtitleBar, { backgroundColor: skeletonColor }]} />
          </View>

          {/* Action Buttons Skeleton */}
          {type === 'pill' ? (
            <View style={[styles.pillBtn, { backgroundColor: skeletonColor }]} />
          ) : (
            <View style={styles.actionsRow}>
              <View style={[styles.actionCircle, { backgroundColor: skeletonColor }]} />
              <View style={[styles.actionCircle, { backgroundColor: skeletonColor }]} />
            </View>
          )}
        </Animated.View>
      ))}
    </View>
  );
};

export default ConnectionSkeleton;

const styles = StyleSheet.create({
  container: {
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
  infoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
    gap: 8,
  },
  titleBar: {
    height: 14,
    borderRadius: 6,
  },
  subtitleBar: {
    height: 10,
    width: '35%',
    borderRadius: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pillBtn: {
    width: 64,
    height: 28,
    borderRadius: 14,
  },
});