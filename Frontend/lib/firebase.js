import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBORhorAy5jWy8TElW_rMbkHNhfpoqjwOU",
    authDomain: "daman-system.firebaseapp.com",
    projectId: "daman-system",
    storageBucket: "daman-system.firebasestorage.app",
    messagingSenderId: "195543055982",
    appId: "1:195543055982:web:7a3e235745e991fa4db07f",
    databaseURL: "https://daman-system-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth };
