import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import BootSplash from 'react-native-bootsplash'; // 1. Import BootSplash
import { URL } from './src/utils/api'
import { store, persistor } from './src/store/store';
import StackNavigation from './src/navigations/StackNavigation';

const App = () => {

  // 2. Create a function to hide the splash screen
  const handleBeforeLift = () => {
    BootSplash.hide({ fade: true });
  };

  const getStart = async () => {
    try {
      const res = await fetch(URL)
    } catch (error) {

    }
  }
  useEffect(() => {
    getStart();
  }, [])

  return (
    <Provider store={store}>
      <PersistGate
        loading={null} // Changed to null so nothing renders behind the splash screen while loading
        persistor={persistor}
        onBeforeLift={handleBeforeLift} // 3. Hide the splash screen right as Redux finishes loading
      >
        <SafeAreaProvider style={styles.root}>
          <StackNavigation />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;