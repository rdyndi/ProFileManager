import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClChxcL4T1Rc3b8l6Zobbj6ynAQLWPGwY",
  authDomain: "dompetpintar-d50e0.firebaseapp.com",
  projectId: "dompetpintar-d50e0",
  storageBucket: "dompetpintar-d50e0.firebasestorage.app",
  messagingSenderId: "804793025772",
  appId: "1:804793025772:web:eb3ecc3f4edd030b86d1c9",
  measurementId: "G-3BV80BW6ZN"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);