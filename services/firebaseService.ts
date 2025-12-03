import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyClChxcL4T1Rc3b8l6Zobbj6ynAQLWPGwY",
  authDomain: "dompetpintar-d50e0.firebaseapp.com",
  projectId: "dompetpintar-d50e0",
  storageBucket: "dompetpintar-d50e0.firebasestorage.app",
  messagingSenderId: "804793025772",
  appId: "1:804793025772:web:eb3ecc3f4edd030b86d1c9",
  measurementId: "G-3BV80BW6ZN"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Services
export const db = firebase.firestore();
export const auth = firebase.auth();
export default firebase;