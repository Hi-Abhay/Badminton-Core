import 'react-native-gesture-handler';
import React, { useState, useCallback } from 'react';
import { StatusBar, useColorScheme, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigation from './src/navigations/StackNavigation';

const App = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'light' ? 'light' : 'dark';
  const backgroundColor = theme === 'dark' ? '#000000' : '#F4F4F5';
  const barStyle = theme === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar barStyle={barStyle} backgroundColor={backgroundColor} />
          <StackNavigation />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;