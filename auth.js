// auth.js - Handles Firebase Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJAqWKIjyrmJnFG4ye2GN3zEtZJtj9hU8",
  authDomain: "aistore-e71ef.firebaseapp.com",
  projectId: "aistore-e71ef",
  storageBucket: "aistore-e71ef.firebasestorage.app",
  messagingSenderId: "593613588722",
  appId: "1:593613588722:web:2adc1cf4d1295d255fa86b",
  measurementId: "G-RSJBT64WHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const authState = {
    user: null,
    isLoggedIn: false
};

// Login Function
async function login() {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
            // User exists and has completed onboarding
            console.log("User logged in:", user);
            window.location.href = 'index.html';
        } else {
            // New user or incomplete profile -> Redirect to Onboarding
            console.log("New user, redirecting to onboarding");
            // We still save basic info first
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                lastLogin: new Date()
            }, { merge: true });
            
            window.location.href = 'onboarding.html';
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login failed: " + error.message);
        // Re-enable button on error
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
        }
    }
}

// Logout Function
async function logout() {
    try {
        await signOut(auth);
        console.log("User logged out");
        window.location.reload();
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        authState.user = user;
        authState.isLoggedIn = true;
        updateUIForLogin(user);
    } else {
        authState.user = null;
        authState.isLoggedIn = false;
        updateUIForLogout();
    }
});

// UI Updates
async function updateUIForLogin(user) {
    // Fetch extended user data from Firestore
    let userData = user;
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userData = { ...user, ...userDoc.data() };
        }
    } catch (e) {
        console.error("Error fetching user data:", e);
    }

    const loginBtns = document.querySelectorAll('.login-link');
    loginBtns.forEach(btn => {
        // Safe check for photoURL
        const photo = userData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User');
        btn.innerHTML = `<img src="${photo}" style="width: 24px; height: 24px; border-radius: 50%; vertical-align: middle; margin-right: 5px;"> Profile`;
        btn.href = 'profile.html';
    });

    // Profile page specific
    const userName = document.getElementById('user-name');
    if (userName) {
        userName.textContent = userData.displayName || 'User';
        document.getElementById('user-email').textContent = userData.email;
        document.getElementById('user-photo').src = userData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User');
        
        const usernameEl = document.getElementById('user-username');
        if (usernameEl && userData.username) {
            usernameEl.textContent = '@' + userData.username;
        }
        
        const genderEl = document.getElementById('user-gender');
        if (genderEl && userData.gender) {
            genderEl.textContent = userData.gender;
        }
        
        const profileContent = document.getElementById('profile-content');
        const loadingState = document.getElementById('loading-state');
        
        if (profileContent) profileContent.classList.remove('hidden');
        if (loadingState) loadingState.classList.add('hidden');
    }
}

function updateUIForLogout() {
    const loginBtns = document.querySelectorAll('.login-link');
    loginBtns.forEach(btn => {
        btn.textContent = 'Login';
        btn.href = 'login.html';
    });
    
    // Redirect if on profile page
    if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'login.html';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', login);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

export { auth, db };
