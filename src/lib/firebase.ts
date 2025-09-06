import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Configuración directa - TEMPORAL para que funcione en producción
const firebaseConfig = {
    apiKey: "AIzaSyDFOR_9CTWIitgM5EYRg34YHKS134lX5tw",
    authDomain: "rphubs.firebaseapp.com",
    databaseURL: "https://rphubs-default-rtdb.firebaseio.com",
    projectId: "rphubs",
    storageBucket: "rphubs.appspot.com",
    messagingSenderId: "555326551319",
    appId: "1:555326551319:web:779b92eee7bd404f2a7352"
};

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