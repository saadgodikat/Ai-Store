// Firebase Configuration
// REPLACE THE VALUES BELOW WITH YOUR FIREBASE PROJECT DETAILS
const firebaseConfig = {
    apiKey: "AIzaSyCJAqWKIjyrmJnFG4ye2GN3zEtZJtj9hU8",
    authDomain: "aistore-e71ef.firebaseapp.com",
    projectId: "aistore-e71ef",
    storageBucket: "aistore-e71ef.firebasestorage.app",
    messagingSenderId: "593613588722",
    appId: "1:593613588722:web:2adc1cf4d1295d255fa86b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
