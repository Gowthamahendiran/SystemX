import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZ10sCa6Ll7ehfqaoR4l5LXjKlIO6VbiM",
  authDomain: "daily-tracker-e9434.firebaseapp.com",
  projectId: "daily-tracker-e9434",
  storageBucket: "daily-tracker-e9434.firebasestorage.app",
  messagingSenderId: "195780612703",
  appId: "1:195780612703:web:a33a04f6d0080c807a41ea",
  measurementId: "G-3Y69LCFHCR",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
