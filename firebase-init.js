// firebase-init.js

// Konfigurasi ini sudah diisi dengan kredensial Anda.
const firebaseConfig = {
    apiKey: "AIzaSyBm2cw6dircA3IMc3yCEeCgVa5--5W6DUw",
    authDomain: "showtime-f086c.firebaseapp.com",
    databaseURL: "https://showtime-f086c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "showtime-f086c",
    storageBucket: "showtime-f086c.appspot.com",
    messagingSenderId: "31064800242",
    appId: "1:31064800242:web:8b290d03eda9bf7d95896b"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
