import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAsrUAcLpRYAbnqLZQI4MHUfYVJfgHDNHQ",
    authDomain: "granny-help-2561a.firebaseapp.com",
    projectId: "granny-help-2561a",
    storageBucket: "granny-help-2561a.firebasestorage.app",
    messagingSenderId: "960238208642",
    appId: "1:960238208642:web:7aea708f0ff2dfe699969b",
    measurementId: "G-W78YDJL9SN"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDB = getFirestore(firebaseApp);
const firebaseAuth = getAuth(firebaseApp);

export default firebaseApp;
export { firestoreDB, firebaseAuth };
