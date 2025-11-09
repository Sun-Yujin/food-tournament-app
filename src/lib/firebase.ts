// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdXWzPj0sqchjxXXzftRWfbUuRgIANe90",
  authDomain: "tournament-1453a.firebaseapp.com",
  projectId: "tournament-1453a",
  storageBucket: "tournament-1453a.firebasestorage.app",
  messagingSenderId: "33478334779",
  appId: "1:33478334779:web:f625507e16346b5615bf1e",
  measurementId: "G-4NVJJHSL1Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Firestore(문서형 DB) 초기화
export const db = getFirestore(app);

// Firebase Authentication (로그인 기능) 초기화
export const auth = getAuth(app);