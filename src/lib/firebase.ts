import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// SSR/ビルド時はFirebaseを初期化しない（IndexedDBが存在しないため）
function getApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export const auth = typeof window !== 'undefined' ? getAuth(getApp()) : null!;
export const googleProvider = new GoogleAuthProvider();

// クライアントではIndexedDB永続化、サーバー側では通常のFirestoreインスタンス
export const db = typeof window !== 'undefined'
  ? initializeFirestore(getApp(), { localCache: persistentLocalCache() })
  : getFirestore(getApp());
