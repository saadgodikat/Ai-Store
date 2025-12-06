import { auth, db } from './auth.js';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadUserRatings(user.uid);
            setupEditProfile(user);
        } else {
            window.location.href = 'login.html';
        }
    });
});

function setupEditProfile(user) {
    const editBtn = document.getElementById('edit-profile-btn');
    const modal = document.getElementById('edit-profile-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const form = document.getElementById('edit-profile-form');
    const nameInput = document.getElementById('edit-display-name');
    const photoInput = document.getElementById('edit-photo-url');

    // Open Modal
    editBtn.addEventListener('click', () => {
        nameInput.value = user.displayName || '';
        photoInput.value = user.photoURL || '';
        modal.classList.remove('hidden');
    });

    // Close Modal
    const closeModal = () => {
        modal.classList.add('hidden');
    };
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Initial check to hide modal on load if somehow visible
    modal.classList.add('hidden');

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = nameInput.value;
        const newPhotoURL = photoInput.value;
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            // 1. Update Auth Profile
            await updateProfile(user, {
                displayName: newName,
                photoURL: newPhotoURL
            });

            // 2. Update Firestore User Doc
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: newName,
                photoURL: newPhotoURL
            });

            // 3. Update UI
            document.getElementById('user-name').textContent = newName;
            document.getElementById('user-photo').src = newPhotoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newName);

            // Also update header profile image if it exists
            const headerProfileImg = document.querySelector('.login-link img');
            if (headerProfileImg) {
                headerProfileImg.src = newPhotoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newName);
            }

            alert('Profile updated successfully!');
            closeModal();

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    });
}

async function loadUserRatings(userId) {
    const ratingsList = document.getElementById('user-ratings-list');

    try {
        // Query ratings where userId matches
        const q = query(collection(db, "ratings"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            ratingsList.innerHTML = '<p style="color: var(--text-secondary);">No ratings yet.</p>';
            return;
        }

        ratingsList.innerHTML = ''; // Clear loading/empty state

        querySnapshot.forEach((docSnap) => {
            const ratingData = docSnap.data();
            const toolId = ratingData.toolId; // This is actually the tool name
            const rating = ratingData.rating;

            const card = document.createElement('div');
            card.className = 'tool-card';
            card.style.padding = '15px';

            card.innerHTML = `
                <div class="tool-header">
                    <span class="tool-tag">Rated: ${rating}/5</span>
                </div>
                <h3>${toolId}</h3> 
                <p>You rated this tool.</p>
                <a href="tool.html?name=${encodeURIComponent(toolId)}" class="tool-link">View Tool</a>
            `;

            ratingsList.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading ratings:", error);
        ratingsList.innerHTML = '<p style="color: red;">Error loading ratings.</p>';
    }
}
