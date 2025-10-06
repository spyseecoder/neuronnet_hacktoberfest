// firebase.js - initializes Firebase app and exports Realtime Database helpers
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, get } from 'firebase/database';

// Put your Firebase config in environment variables (REACT_APP_FIREBASE_*)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Helpful developer message when DB URL is missing (avoids cryptic Firebase warning)
if (!firebaseConfig.databaseURL) {
  console.warn('Missing env: REACT_APP_FIREBASE_DATABASE_URL.\nSet this in your .env file with your Realtime Database URL, for example:\nREACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app');
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, set, push, update, get };
