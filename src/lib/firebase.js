import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-96a2a.firebaseapp.com",
  projectId: "react-chat-96a2a",
  storageBucket: "react-chat-96a2a.firebasestorage.app",
  messagingSenderId: "317044555224",
  appId: "1:317044555224:web:83105b3ace7211dcb706ad",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
