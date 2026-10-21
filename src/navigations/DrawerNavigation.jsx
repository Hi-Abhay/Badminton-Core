import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import TabNavigation from './TabNavigation';
import Friends from '../screens/DrawerScreen/Friends';
import Profile from '../screens/DrawerScreen/Profile';
import Setting from '../screens/DrawerScreen/Setting'
import { light, dark } from '../theme/Color';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const { colors, navigation } = props;

  const handleLogout = () => {
    // Insert authentication logout / session clearance logic here
    navigation.closeDrawer();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurface }]}>
      {/* Top Profile Section */}
      <View style={styles.profileSection}>
        <View style={[styles.avatarWrapper, { borderColor: colors.borderColor }]}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
          Alex Chen
        </Text>
        <Text style={[styles.userEmail, { color: colors.textTertiary }]} numberOfLines={1}>
          alex.chen@badmintoncore.com
        </Text>
      </View>

      {/* Partition Line */}
      <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

      {/* Screen Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerItemsScroll}
        showsVerticalScrollIndicator={false}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Bottom Partition Line */}
      <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

      {/* Logout Action */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigation = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} colors={colors} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.bgSurface,
          width: 290,
        },
        drawerActiveTintColor: colors.accentText,
        drawerActiveBackgroundColor: colors.accentBg,
        drawerInactiveTintColor: colors.textSecondary,
        drawerItemStyle: {
          borderRadius: 50,
          paddingHorizontal: 6,
          marginVertical: 4,
        },
        drawerLabelStyle: {
          fontWeight: '700',
          fontSize: 14.5,
          marginLeft: -8,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={TabNavigation}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Friends"
        component={Friends}
        options={{
          drawerLabel: 'Connections',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="link-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={Profile}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Setting"
        component={Setting}
        options={{
          drawerLabel: 'Setting',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 18,
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    padding: 2,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  divider: {
    height: 1,
    marginHorizontal: 18,
  },
  drawerItemsScroll: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
});