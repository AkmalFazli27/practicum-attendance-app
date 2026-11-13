import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
// @ts-ignore: getReactNativePersistence disediakan oleh entry bundle React Native Firebase
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Memeriksa apakah konfigurasi Firebase telah diisi pada file .env
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('ExampleKey')
);

// Inisialisasi Firebase App (Singleton)
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firebase Auth dengan persistensi AsyncStorage untuk Native & localStorage untuk Web
let authInstance: Auth;
try {
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  // Jika initializeAuth sudah pernah dipanggil dalam lifecycle aplikasi
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;
export const db: Firestore = getFirestore(app);

