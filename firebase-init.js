// Import fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// GANTI DENGAN KREDENSIAL FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBm2cw6dircA3IMc3yCEeCgVa5--5W6DUw",
  authDomain: "showtime-f086c.firebaseapp.com",
  databaseURL: "https://showtime-f086c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "showtime-f086c",
  storageBucket: "showtime-f086c.firebasestorage.app",
  messagingSenderId: "31064800242",
  appId: "1:31064800242:web:8b290d03eda9bf7d95896b"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
