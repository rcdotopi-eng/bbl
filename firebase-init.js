// firebase-init.js

// 1. CONFIGURATION (Replace with your actual keys)
const firebaseConfig = {
    apiKey: "AIzaSyDWvW9e94dF03beWHYaCwxbJiU6G7utDuE",
  authDomain: "texi-online.firebaseapp.com",
  databaseURL: "https://texi-online-default-rtdb.firebaseio.com",
  projectId: "texi-online",
  storageBucket: "texi-online.firebasestorage.app",
  messagingSenderId: "1081425638649",
  appId: "1:1081425638649:web:5a8f99bd4158c1256fde28"
};

// 2. SAFETY CHECK & INITIALIZATION
window.db = null;
window.auth = null;
if (typeof firebase === 'undefined') {
    console.error("❌ CRITICAL ERROR: Firebase SDK not loaded. Check your internet or script tags.");
    alert("System Error: Could not connect to Google Services.");
} else {
    // Initialize only if SDK exists
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Define global variables safely
   window.db = firebase.database();
window.auth = firebase.auth();
    console.log("✅ Firebase Initialized Successfully");
}
