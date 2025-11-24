import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// KONFIG DOMPETPINTAR PUNYAMU
const firebaseConfig = {
  apiKey: "AIzaSyClChxcL4T1Rc3b8l6Zobbj6ynAQLWPGwY",
  authDomain: "dompetpintar-d50e0.firebaseapp.com",
  projectId: "dompetpintar-d50e0",
  storageBucket: "dompetpintar-d50e0.firebasestorage.app",
  messagingSenderId: "804793025772",
  appId: "1:804793025772:web:eb3ecc3f4edd030b86d1c9",
  measurementId: "G-3BV80BW6ZN",
};

// Biar nggak double init kalau dipanggil beberapa kali
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore instance yang dipakai storage.ts
export const db = getFirestore(app);
