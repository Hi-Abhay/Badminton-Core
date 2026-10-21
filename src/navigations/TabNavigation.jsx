import React, { useEffect, useRef } from 'react';
import { StyleSheet, Platform, useColorScheme, Animated, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Home from '../screens/TabScreens/Home';
import Players from '../screens/TabScreens/Players';
import Teams from '../screens/TabScreens/Teams';
import Matches from '../screens/TabScreens/Matches';
import { light, dark } from '../theme/Color';

const Tab = createBottomTabNavigator();

// --- 1. Custom Animated Icon Component ---
const AnimatedTabIcon = ({ focused, iconName, theme }) => {
  const animValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: focused ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  // Spring animations for icon and background bubble
  const iconScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const bubbleScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const bubbleOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Dark Mode:  Bubble = White (#FFFFFF), Icon = Black (#000000)
  // Light Mode: Bubble = Black (#000000), Icon = White (#FFFFFF)
  const bubbleBgColor = theme.accentBg;
  const currentIconColor = focused ? theme.accentText : theme.textTertiary;

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBgColor,
            opacity: bubbleOpacity,
            transform: [{ scale: bubbleScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons name={iconName} size={20} color={currentIconColor} />
      </Animated.View>
    </View>
  );
};

// --- 2. Main Tab Navigation ---
const TabNavigation = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.textPrimary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarHideOnKeyboard: true,
        animation: 'shift',
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.bgSurface,
            borderColor: theme.borderColor,
            bottom: insets.bottom > 0 ? insets.bottom : 15,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused }) => {
          let iconName = 'home-outline';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Players':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Teams':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Matches':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
          }

          return (
            <AnimatedTabIcon
              focused={focused}
              iconName={iconName}
              theme={theme}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Players" component={Players} options={{ tabBarLabel: 'Players' }} />
      <Tab.Screen name="Teams" component={Teams} options={{ tabBarLabel: 'Teams' }} />
      <Tab.Screen name="Matches" component={Matches} options={{ tabBarLabel: 'Matches' }} />
    </Tab.Navigator>
  );
};

export default TabNavigation;

// --- 3. Styles ---
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginHorizontal: 20,
    borderRadius: 35,
    height: 64,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 32,
  },
  bubble: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderRadius: 14,
  },
});