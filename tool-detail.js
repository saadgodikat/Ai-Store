import { auth, db } from './auth.js';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const toolDetailContainer = document.getElementById('tool-detail-container');
    const similarToolsGrid = document.getElementById('similar-tools-grid');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    let currentUser = null;

    // Listen for Auth State
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    // Theme Toggle Logic (Same as index)
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Get Tool ID/Name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const toolName = urlParams.get('name');

    if (!toolName) {
        window.location.href = 'index.html';
        return;
    }

    // Find Tool
    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
        toolDetailContainer.innerHTML = '<p>Tool not found.</p>';
        return;
    }

    // Render Tool Details
    renderToolDetail(tool);
    // Initial render with empty list or loading state
    renderReviews(tool.name, []); 
    fetchReviews(tool.name); // Fetch real data
    renderSimilarTools(tool);

    // Review Form Logic
    const reviewForm = document.getElementById('review-form');
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert("Please login to submit a review.");
            window.location.href = 'login.html';
            return;
        }

        const rating = document.querySelector('input[name="rating"]:checked');
        const text = document.getElementById('review-text').value;
        const submitBtn = reviewForm.querySelector('button[type="submit"]');

        if (!rating) {
            alert('Please select a rating');
            return;
        }

        // Disable button while submitting
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const review = {
            toolName: tool.name,
            toolId: tool.name, // Using name as ID for now
            rating: parseInt(rating.value),
            text: text,
            date: new Date().toLocaleDateString(),
            timestamp: serverTimestamp(),
            user: currentUser.displayName || 'Anonymous',
            userId: currentUser.uid,
            userPhoto: currentUser.photoURL
        };

        try {
            await addReview(review);
            
            // Also save to "ratings" collection for profile page
            // In a real app, you might just query reviews by userId
            // But let's add to a separate collection if we want to track "rated tools" specifically
            // For now, let's just use the reviews collection and update profile.js to query that instead?
            // Actually, profile.js queries "ratings". Let's save to "ratings" too or just use "reviews".
            // Let's stick to "reviews" for simplicity and update profile.js to query "reviews".
            
            reviewForm.reset();
            fetchReviews(tool.name); // Refresh list
        } catch (error) {
            console.error("Error adding review: ", error);
            alert("Failed to submit review. Please check your connection.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    });

    // --- Firestore Functions ---

    async function fetchReviews(toolName) {
        const reviewsList = document.getElementById('reviews-list');
        console.log("Fetching reviews for:", toolName);
        
        try {
            const q = query(
                collection(db, "reviews"),
                where("toolName", "==", toolName),
                orderBy("timestamp", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const reviews = [];
            
            console.log("Reviews found:", querySnapshot.size);

            querySnapshot.forEach((doc) => {
                reviews.push({ id: doc.id, ...doc.data() });
            });

            renderReviews(toolName, reviews);
        } catch (error) {
            console.error("Error fetching reviews: ", error);
            if (error.code === 'permission-denied' || error.code === 'api-key-not-valid') {
                 reviewsList.innerHTML = '<p class="error-msg">Database not configured. Please add API Key.</p>';
            }
        }
    }

    async function addReview(review) {
        console.log("Adding review:", review);
        try {
            const docRef = await addDoc(collection(db, "reviews"), review);
            console.log("Review written with ID: ", docRef.id);
            
            // Also save to "ratings" for profile page compatibility
            await addDoc(collection(db, "ratings"), {
                userId: review.userId,
                toolId: review.toolName,
                rating: review.rating,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    }

    async function deleteReview(reviewId, toolName) {
        try {
            // 1. Delete from 'reviews' collection
            await deleteDoc(doc(db, "reviews", reviewId));
            console.log("Review deleted from reviews collection:", reviewId);

            // 2. Delete from 'ratings' collection (for profile)
            if (currentUser) {
                const q = query(
                    collection(db, "ratings"),
                    where("userId", "==", currentUser.uid),
                    where("toolId", "==", toolName)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                    console.log("Rating deleted from ratings collection:", doc.id);
                });
            }

            fetchReviews(toolName); // Refresh list
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    }

    let currentReviewLimit = 5;

    function renderReviews(toolName, reviews) {
        const reviewsList = document.getElementById('reviews-list');
        const avgRatingEl = document.getElementById('average-rating');
        const avgStarsEl = document.getElementById('average-stars');
        const totalReviewsEl = document.getElementById('total-reviews');
        const paginationContainer = document.getElementById('review-pagination');

        // Update Summary
        if (reviews.length > 0) {
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            const avg = (total / reviews.length).toFixed(1);
            avgRatingEl.textContent = avg;
            totalReviewsEl.textContent = `(${reviews.length} reviews)`;
            
            // Render stars for average
            avgStarsEl.innerHTML = getStarHtml(Math.round(avg));
        } else {
            avgRatingEl.textContent = '0.0';
            totalReviewsEl.textContent = '(0 reviews)';
            avgStarsEl.innerHTML = getStarHtml(0);
        }

        // Render List
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
            paginationContainer.innerHTML = '';
            return;
        }

        const visibleReviews = reviews.slice(0, currentReviewLimit);

        reviewsList.innerHTML = visibleReviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-user">
                        ${r.userPhoto ? `<img src="${r.userPhoto}" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:5px;">` : '<i class="fas fa-user-circle"></i>'} 
                        ${r.user}
                    </span>
                    <span class="review-date">${r.date}</span>
                    ${currentUser && currentUser.uid === r.userId ? 
                        `<button class="delete-review-btn" data-id="${r.id}" style="margin-left:auto;background:none;border:none;color:#ff4444;cursor:pointer;"><i class="fas fa-trash"></i></button>` 
                        : ''}
                </div>
                <div class="review-rating">${getStarHtml(r.rating)}</div>
                <p class="review-text">${r.text}</p>
            </div>
        `).join('');

        // Attach delete listeners
        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this review?')) {
                    const reviewId = e.currentTarget.getAttribute('data-id');
                    await deleteReview(reviewId, toolName);
                }
            });
        });

        // Pagination Button Logic
        if (reviews.length > currentReviewLimit) {
            const remaining = reviews.length - currentReviewLimit;
            paginationContainer.innerHTML = `
                <button id="show-more-reviews" class="show-more-btn">
                    Show More Reviews (${remaining} remaining)
                </button>
            `;
            
            document.getElementById('show-more-reviews').addEventListener('click', () => {
                if (currentReviewLimit === 5) {
                    currentReviewLimit = 25; // Show next 20
                } else {
                    currentReviewLimit = reviews.length; // Show all
                }
                renderReviews(toolName, reviews);
            });
        } else {
            paginationContainer.innerHTML = '';
        }
    }

    function getStarHtml(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="fas fa-star filled"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        return html;
    }

    function renderToolDetail(tool) {
        // Default values for missing data
        const pricing = tool.pricing || 'Freemium';
        const features = tool.features || [
            'AI-powered functionality',
            'Easy to use interface',
            'Cloud-based processing',
            '24/7 Support'
        ];

        const featuresHtml = features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('');

        toolDetailContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-title-section">
                    <span class="detail-tag">${tool.category || 'AI Tool'}</span>
                    <span class="pricing-tag ${pricing.toLowerCase()}">${pricing}</span>
                    <h1>${tool.name}</h1>
                </div>
                <a href="${tool.url}" target="_blank" class="visit-btn">Visit Website <i class="fas fa-external-link-alt"></i></a>
            </div>
            
            <div class="detail-content">
                <div class="description-section">
                    <h2>About ${tool.name}</h2>
                    <p>${tool.description}</p>
                    <p>Experience the power of ${tool.name} to streamline your workflow and boost productivity. This tool offers state-of-the-art AI capabilities designed for professionals and enthusiasts alike.</p>
                </div>
                
                <div class="features-section">
                    <h2>Key Features</h2>
                    <ul class="features-list">
                        ${featuresHtml}
                    </ul>
                </div>
            </div>
        `;
    }

    function renderSimilarTools(currentTool) {
        const similarToolsSlider = document.getElementById('similar-tools-slider');
        
        // 1. Score tools based on relevance
        const scoredTools = tools.map(t => {
            if (t.name === currentTool.name) return null; // Exclude self

            let score = 0;
            // Category match (High weight)
            if (t.category === currentTool.category) score += 10;

            // Keyword matches (Medium weight)
            if (currentTool.keywords && t.keywords) {
                const sharedKeywords = t.keywords.filter(k => currentTool.keywords.includes(k));
                score += sharedKeywords.length * 2;
            }

            // Tag match (Low weight)
            if (t.tag === currentTool.tag) score += 1;

            if (score > 0) {
                return { ...t, score };
            }
            return null;
        }).filter(t => t !== null);

        // 2. Sort by score descending
        scoredTools.sort((a, b) => b.score - a.score);

        // 3. Pick top 10
        const selected = scoredTools.slice(0, 10);

        if (selected.length === 0) {
            similarToolsSlider.innerHTML = '<p>No similar tools found.</p>';
            return;
        }

        similarToolsSlider.innerHTML = selected.map(t => `
            <div class="tool-card" onclick="window.location.href='tool.html?name=${encodeURIComponent(t.name)}'">
                <div class="tool-header">
                    <span class="tool-tag">${t.category}</span>
                </div>
                <h2>${t.name}</h2>
                <p>${t.description}</p>
                <span class="tool-link">View Details</span>
            </div>
        `).join('');
    }
});
