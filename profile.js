import { auth, db } from './auth.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadUserRatings(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });
});

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
