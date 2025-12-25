import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxxGX9AnyzT-CPDFetszJoOyJZ3SEGSkI",
  authDomain: "knowledge-fest.firebaseapp.com",
  projectId: "knowledge-fest",
  storageBucket: "knowledge-fest.firebasestorage.app",
  messagingSenderId: "826635813322",
  appId: "1:826635813322:web:928e2e9b87442697eacf33",
  measurementId: "G-FECWRGE030"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistence
// This allows the app to store data locally and sync when connection returns
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Firebase Authentication
const auth = getAuth(app);

export { app, db, auth };