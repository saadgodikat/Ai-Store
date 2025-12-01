import { auth, db } from './auth.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    const form = document.getElementById('onboarding-form');
    const genderOptions = document.querySelectorAll('.gender-option');
    const genderInput = document.getElementById('gender');
    const avatarSection = document.getElementById('avatar-section');
    const avatarGrid = document.getElementById('avatar-grid');
    const refreshBtn = document.getElementById('refresh-avatars');
    const avatarInput = document.getElementById('selected-avatar');
    const nameInput = document.getElementById('full-name');

    // Check Auth
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Pre-fill name if available
            if (user.displayName && !nameInput.value) {
                nameInput.value = user.displayName;
            }
            
            // Check if already onboarded
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().username) {
                // Already has username, redirect to index
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    // Gender Selection
    genderOptions.forEach(option => {
        option.addEventListener('click', () => {
            // UI Update
            genderOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Set Value
            const gender = option.dataset.value;
            genderInput.value = gender;
            
            // Show Avatars
            avatarSection.style.display = 'block';
            generateAvatars(gender);
        });
    });

    // Refresh Avatars
    refreshBtn.addEventListener('click', () => {
        const gender = genderInput.value;
        if (gender) {
            generateAvatars(gender);
        }
    });

    // Generate Avatars using DiceBear
    function generateAvatars(gender) {
        avatarGrid.innerHTML = '';
        // Revert to v7.x which is known to be stable
        const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg';
        
        for (let i = 0; i < 8; i++) {
            const seed = Math.random().toString(36).substring(7);
            let url = `${baseUrl}?seed=${seed}`;
            
            // Simplified for debugging - just use seed first to ensure images load
            /*
            if (gender === 'male') {
                // Male traits - simplified
                url += `&top[]=shortHair&top[]=shortHairDreads01&top[]=shortHairShortCurly&top[]=shortHairTheCaesar`;
                // Facial hair chance
                if (Math.random() > 0.3) {
                     url += `&facialHair[]=beardLight&facialHair[]=beardMedium&facialHair[]=moustacheFancy`;
                }
            } else {
                // Female traits - simplified
                url += `&top[]=longHairBigHair&top[]=longHairBob&top[]=longHairCurly&top[]=longHairStraight`;
                url += `&facialHairProbability=0`;
            }
            */

            console.log('Generated Avatar URL:', url); // Debugging

            const img = document.createElement('img');
            img.src = url;
            img.className = 'avatar-option';
            img.alt = 'Avatar option'; // Add alt text
            img.onclick = () => selectAvatar(img, url);
            
            // Add error handling
            img.onerror = (e) => {
                console.error('Avatar failed to load:', url);
                console.error('Error details:', e);
                // Try a different service as fallback
                img.src = `https://ui-avatars.com/api/?name=${gender}&background=random&size=128`; 
            };
            
            img.onload = () => {
                console.log('Avatar loaded successfully:', url);
            };
            
            avatarGrid.appendChild(img);
        }
    }

    function selectAvatar(imgElement, url) {
        document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
        imgElement.classList.add('selected');
        avatarInput.value = url;
    }

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) return;
        
        const fullName = nameInput.value;
        const username = document.getElementById('username').value;
        const gender = genderInput.value;
        const avatarUrl = avatarInput.value;

        if (!gender) {
            alert('Please select a gender');
            return;
        }
        if (!avatarUrl) {
            alert('Please select an avatar');
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Profile...';

        try {
            // 1. Update Auth Profile
            await updateProfile(currentUser, {
                displayName: fullName,
                photoURL: avatarUrl
            });

            // 2. Save to Firestore
            await setDoc(doc(db, "users", currentUser.uid), {
                uid: currentUser.uid,
                displayName: fullName,
                username: username,
                gender: gender,
                photoURL: avatarUrl,
                email: currentUser.email,
                onboardingCompleted: true,
                updatedAt: new Date()
            }, { merge: true });

            // 3. Redirect
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Setup';
        }
    });
});
