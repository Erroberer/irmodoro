// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAinXgjizNIaUFzE9oZgjsppB16BwTeoBc",
  authDomain: "irmodoro.firebaseapp.com",
  databaseURL: "https://irmodoro-default-rtdb.firebaseio.com",
  projectId: "irmodoro",
  storageBucket: "irmodoro.firebasestorage.app",
  messagingSenderId: "1098665973293",
  appId: "1:1098665973293:web:06b32caa16b0568c97caa4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore veritabanını başlat
export const db = getFirestore(app);

// Analytics'i başlat (opsiyonel)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;