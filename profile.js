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
        const currentPhoto = user.photoURL || '';
        photoInput.value = currentPhoto;

        // Generate Avatar Grid
        generateAvatarGrid(currentPhoto, photoInput);

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

function generateAvatarGrid(currentPhoto, inputElement) {
    const grid = document.getElementById('avatar-selection-grid');
    grid.innerHTML = '';

    // Helper to create avatar element
    const createAvatarEl = (url, isCurrent = false) => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';

        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar-option';
        if (url === inputElement.value) img.classList.add('selected');

        img.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            img.classList.add('selected');
            inputElement.value = url;
        };

        wrapper.appendChild(img);

        if (isCurrent) {
            const label = document.createElement('span');
            label.className = 'current-avatar-label';
            label.textContent = 'Current';
            wrapper.appendChild(label);
        }

        return wrapper;
    };

    // 1. Add Current Avatar (if exists and is a URL)
    if (currentPhoto) {
        grid.appendChild(createAvatarEl(currentPhoto, true));
    }

    // 2. Generate Random Avatars (DiceBear)
    const seeds = ['Felix', 'Aneka', 'Mittens', 'Bubba', 'Snowball', 'Whiskers'];
    // You can use random strings or predefined seeds
    for (let i = 0; i < 5; i++) {
        const seed = Math.random().toString(36).substring(7);
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        // Prevent duplicate current avatar if it matches format
        if (url !== currentPhoto) {
            grid.appendChild(createAvatarEl(url));
        }
    }
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
