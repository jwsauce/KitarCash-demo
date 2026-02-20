
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZcsmaKr8TOQ7Tqwa65z4gh6ZCpdlYhlk",
  authDomain: "kitarcash.firebaseapp.com",
  projectId: "kitarcash",
  storageBucket: "kitarcash.firebasestorage.app",
  messagingSenderId: "929687561236",
  appId: "1:929687561236:web:d85694e588600e866cf301"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth and storage instances to be used in other parts of the app
export const auth = getAuth(app);
export const storage = getStorage(app);
