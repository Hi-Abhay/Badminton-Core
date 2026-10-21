import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DrawerNavigation from './DrawerNavigation';
import CreateMatch from '../screens/TabScreens/components/CreateMatch';
import ScoreCard from '../screens/TabScreens/components/ScoreCard';
import History from '../screens/TabScreens/components/History';
import PlayerProfile from '../screens/TabScreens/components/PlayerProfile';
import Toss from '../screens/TabScreens/components/Toss';
import Live from '../screens/TabScreens/components/Live';
import Setting from '../screens/DrawerScreen/Setting';
import Notification from '../screens/TabScreens/components/Notification'

import Register from '../screens/Auth/Register'
import Login from '../screens/Auth/Login'
import ForgotPassword from '../screens/Auth/ForgotPassword'
import Confirmation from '../screens/Auth/Confirmation'
import { light, dark } from '../theme/Color';
import Onboarding from '../screens/LoadingScreens/Onboarding';

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.textPrimary,
      background: theme.bgBase,
      card: theme.bgSurface,
      text: theme.textPrimary,
      border: theme.borderColor,
      notification: theme.accentBg,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgSurface}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.bgBase,
          },
        }}
      >
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        {/* Main entry point containing the Drawer */}
        <Stack.Screen name="DrawerRoot" component={DrawerNavigation} />
        {/* Modal / Fullscreen stack routes */}
        <Stack.Screen name="Notification" component={Notification} />
        <Stack.Screen name="CreateMatch" component={CreateMatch} />
        <Stack.Screen name="ScoreCard" component={ScoreCard} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="PlayerProfile" component={PlayerProfile} />
        <Stack.Screen name="Toss" component={Toss} />
        <Stack.Screen name="Live" component={Live} />
        <Stack.Screen name="Setting" component={Setting} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigation;