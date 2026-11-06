// services/googleAuth.js
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '993194885332-cpvoa2krgk8b70ipb50241l9vuuck5fq.apps.googleusercontent.com',
});

// Clears the cached Google account so the account chooser appears every time.
async function clearGoogleSession() {
  try {
    await GoogleSignin.signOut();
  } catch (e) {
    // ignore: nothing to sign out of
  }
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  // IMPORTANT: clear the cached account BEFORE every sign-in,
  // otherwise the second tap silently reuses the last account.
  await clearGoogleSession();

  const result = await GoogleSignin.signIn();

  // Newer library versions return { type: 'cancelled' } instead of throwing
  if (result?.type === 'cancelled') {
    const cancelled = new Error('Sign-in cancelled');
    cancelled.code = 'SIGN_IN_CANCELLED';
    throw cancelled;
  }

  // Compatible with both response shapes
  const idToken = result.data?.idToken ?? result.idToken;

  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }

  const googleCredential = GoogleAuthProvider.credential(idToken);

  const userCredential = await signInWithCredential(
    getAuth(),
    googleCredential,
  );

  return userCredential.user;
}

export async function signOutGoogle() {
  await clearGoogleSession();
  try {
    await getAuth().signOut();
  } catch (e) {
    // ignore
  }
}