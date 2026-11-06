import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export async function requestUserPermission() {
  if (Platform.OS === 'android') {
    // Android 13+ (API level 33+) requires runtime permission
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Granted by default on Android 12 and below
  }

  if (Platform.OS === 'ios') {
    // Request permission on iOS
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  }

  return false;
}

export async function getFCMToken() {
  try {
    const hasPermission = await requestUserPermission();

    if (!hasPermission) {
      console.warn('Push notification permission denied.');
      return null;
    }

    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
}