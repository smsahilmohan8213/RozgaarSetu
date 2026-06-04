import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVs4T6bmxKg4MHZQaGdcKG6XPqIsJqOJ0",
  authDomain: "rozgaarsetu-ec390.firebaseapp.com",
  databaseURL: "https://rozgaarsetu-ec390-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rozgaarsetu-ec390",
  storageBucket: "rozgaarsetu-ec390.firebasestorage.app",
  messagingSenderId: "631931227266",
  appId: "1:631931227266:web:952b866bf4c1ce753f389b"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);