import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Configuración directa - TEMPORAL para que funcione en producción
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validación explícita: evita “inicializar” con undefined.
const missingFirebaseEnv = Object.entries(firebaseConfig)
  .filter(([, v]) => v == null || v === '')
  .map(([k]) => k);

if (missingFirebaseEnv.length > 0) {
  // eslint-disable-next-line no-console
  console.error('[firebase] Missing NEXT_PUBLIC_FIREBASE env vars:', missingFirebaseEnv);
  throw new Error(
    `[firebase] Missing NEXT_PUBLIC_FIREBASE env vars: ${missingFirebaseEnv.join(', ')}`
  );
}

// Inicializar Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Debug (temporal): verificar inicialización en runtime
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[firebase] initialized', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

