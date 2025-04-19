import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAR1lUOnAEdbQaSAD_03wJ4PrXuJQobxn4",
  authDomain: "tidy-tag.firebaseapp.com",
  projectId: "tidy-tag",
  storageBucket: "tidy-tag.firebasestorage.app",
  messagingSenderId: "49781905841",
  appId: "1:49781905841:web:60d743f7ea065000cb0590",
  measurementId: "G-HCTPL5406E"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app

