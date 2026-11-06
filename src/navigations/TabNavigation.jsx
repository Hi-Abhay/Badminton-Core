import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  useColorScheme,
  Animated,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import Home from '../screens/TabScreens/Home';
import Players from '../screens/TabScreens/Players';
import Teams from '../screens/TabScreens/Teams';
import Matches from '../screens/TabScreens/Matches';

const Tab = createBottomTabNavigator();

// --- Bottom Edge Fade Palettes ---
const BOTTOM_EDGE_GRADIENTS = {
  dark: [
    'rgba(0, 0, 0, 0.00)',
    'rgba(10, 10, 12, 0.20)',
    'rgba(12, 12, 14, 0.45)',
    'rgba(8, 8, 10, 0.72)',
    'rgba(0, 0, 0, 0.92)',
    '#000000',
  ],
  light: [
    'rgba(255, 255, 255, 0.00)',
    'rgba(250, 250, 252, 0.20)',
    'rgba(245, 246, 249, 0.45)',
    'rgba(237, 239, 243, 0.70)',
    'rgba(229, 231, 235, 0.92)',
    '#E5E7EB',
  ],
};

// --- Inverted Contrast Theme ---
const TAB_THEMES = {
  dark: {
    containerBg: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    activeBubbleBg: '#000000',
    activeIconColor: '#FFFFFF',
    activeLabelColor: '#FFFFFF',
    inactiveIconColor: '#71717A',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
  },
  light: {
    containerBg: '#18181B',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    activeBubbleBg: '#FFFFFF',
    activeIconColor: '#000000',
    activeLabelColor: '#000000',
    inactiveIconColor: '#A1A1AA',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
  },
};

// --- Simple Native-Driven Tab Item ---
const TabItem = ({ route, isFocused, onPress, onLongPress, tabTheme }) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0.95,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  let iconName = 'home-outline';
  switch (route.name) {
    case 'Home':
      iconName = isFocused ? 'home' : 'home-outline';
      break;
    case 'Players':
      iconName = isFocused ? 'person' : 'person-outline';
      break;
    case 'Teams':
      iconName = isFocused ? 'people' : 'people-outline';
      break;
    case 'Matches':
      iconName = isFocused ? 'trophy' : 'trophy-outline';
      break;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.touchableWrapper}
    >
      <Animated.View
        style={[
          styles.pillContainer,
          isFocused
            ? [
                styles.activePill,
                { backgroundColor: tabTheme.activeBubbleBg },
              ]
            : styles.inactivePill,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name={iconName}
          size={19}
          color={isFocused ? tabTheme.activeIconColor : tabTheme.inactiveIconColor}
        />

        {isFocused && (
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              { color: tabTheme.activeLabelColor },
            ]}
          >
            {route.name}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Custom Floating Tab Bar ---
const CustomTabBar = ({ state, navigation, tabTheme, edgeGradientColors, insets }) => {
  return (
    <View pointerEvents="box-none" style={styles.tabBarWrapper}>
      {/* Background Gradient Fade */}
      <LinearGradient
        pointerEvents="none"
        colors={edgeGradientColors}
        locations={[0, 0.2, 0.45, 0.7, 0.9, 1]}
        style={[
          styles.bottomEdgeGradient,
          { height: 110 + (insets.bottom > 0 ? insets.bottom : 14) },
        ]}
      />

      {/* Floating Bar Container */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: tabTheme.containerBg,
            borderColor: tabTheme.borderColor,
            shadowColor: tabTheme.shadowColor,
            shadowOpacity: tabTheme.shadowOpacity,
            bottom: insets.bottom > 0 ? insets.bottom + 10 : 14,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params, { merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              tabTheme={tabTheme}
            />
          );
        })}
      </View>
    </View>
  );
};

// --- Main Navigator ---
const TabNavigation = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tabTheme = isDark ? TAB_THEMES.dark : TAB_THEMES.light;
  const edgeGradientColors = isDark
    ? BOTTOM_EDGE_GRADIENTS.dark
    : BOTTOM_EDGE_GRADIENTS.light;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          tabTheme={tabTheme}
          edgeGradientColors={edgeGradientColors}
          insets={insets}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Players" component={Players} />
      <Tab.Screen name="Teams" component={Teams} />
      <Tab.Screen name="Matches" component={Matches} />
    </Tab.Navigator>
  );
};

export default TabNavigation;

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomEdgeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    position: 'absolute',
    left: 48,
    right: 48,
    height: 60,
    borderRadius: 36,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  touchableWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillContainer: {
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 16,
    gap: 7,
  },
  inactivePill: {
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});