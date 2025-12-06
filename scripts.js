// Tools are now loaded from tools-data.js

document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.getElementById('tools-grid');
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const noResults = document.getElementById('no-results');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    let currentCategory = 'all';
    let searchTerm = '';
    let selectedSuggestionIndex = -1;
    let debounceTimer = null;

    let currentPage = 1;
    const itemsPerPage = 50;

    // Theme Logic
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Initialize theme on load - PRIORITY
    initTheme();

    // Theme Toggle Listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // Performance: Initialize Suggestions Data (memoized)
    // Only if we have search capability
    let suggestionData = null;
    if (searchInput) {
        suggestionData = initializeSuggestions();
    }

    // Initial Render - Show limited results
    // Only if we have a grid to render to
    if (toolsGrid) {
        // Hydration: renderTools will clear the static fallback
        renderTools();
    }

    // PERFORMANCE FIX: Debounced Search Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();

            // Clear previous timer
            clearTimeout(debounceTimer);

            // Debounce: Wait 300ms after user stops typing
            debounceTimer = setTimeout(() => {
                currentPage = 1; // Reset to first page on search
                renderTools();
                renderSuggestions(searchTerm);
            }, 300);
        });

        // Suggestion Keyboard Navigation
        searchInput.addEventListener('keydown', (e) => {
            if (!searchSuggestions) return;

            const items = searchSuggestions.querySelectorAll('.suggestion-item');
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                updateActiveSuggestion(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                updateActiveSuggestion(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    items[selectedSuggestionIndex].click();
                }
            } else if (e.key === 'Escape') {
                searchSuggestions.classList.add('hidden');
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (searchSuggestions && !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.classList.add('hidden');
            }
        });
    }

    // Category Listeners
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                currentPage = 1; // Reset to first page on category change
                renderTools();
            });
        });
    }

    // PERFORMANCE: Only compute once on load
    function initializeSuggestions() {
        const categories = new Set();
        const keywords = new Set();

        // Limit to first 1000 names to prevent lag
        const names = [];
        let nameCount = 0;

        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];

            // Add Category
            if (tool.category && tool.category !== 'other') {
                categories.add(tool.category);
            }

            // Add Keywords (limit to most common)
            if (tool.keywords && tool.keywords.length > 0) {
                tool.keywords.slice(0, 3).forEach(k => keywords.add(k));
            }

            // Add Name (limited)
            if (nameCount < 1000) {
                names.push(tool.name);
                nameCount++;
            }
        }

        return {
            categories: Array.from(categories).sort(),
            keywords: Array.from(keywords).sort(),
            names: names.sort()
        };
    }

    // PERFORMANCE: Optimized suggestion rendering
    function renderSuggestions(query) {
        if (!query || query.length < 2) {
            searchSuggestions.classList.add('hidden');
            return;
        }

        const matches = [];
        const maxSuggestions = 6; // Reduced from 8

        // Early exit optimization
        let foundCount = 0;

        // 1. Match Categories (fast)
        for (let i = 0; i < suggestionData.categories.length && foundCount < maxSuggestions; i++) {
            if (suggestionData.categories[i].includes(query)) {
                matches.push({ type: 'category', text: suggestionData.categories[i], icon: 'fa-folder' });
                foundCount++;
            }
        }

        // 2. Match Keywords (limited)
        for (let i = 0; i < suggestionData.keywords.length && foundCount < maxSuggestions; i++) {
            const k = suggestionData.keywords[i];
            if (k.includes(query) && !matches.find(m => m.text === k)) {
                matches.push({ type: 'keyword', text: k, icon: 'fa-tag' });
                foundCount++;
            }
        }

        // 3. Match Names (limited)
        for (let i = 0; i < suggestionData.names.length && foundCount < maxSuggestions; i++) {
            const name = suggestionData.names[i];
            if (name.toLowerCase().includes(query) && !matches.find(m => m.text === name)) {
                matches.push({ type: 'tool', text: name, icon: 'fa-robot' });
                foundCount++;
            }
        }

        if (matches.length > 0) {
            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();
            searchSuggestions.innerHTML = '';

            matches.forEach((match, index) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.dataset.index = index;
                div.innerHTML = `
                    <i class="fas ${match.icon} suggestion-icon"></i>
                    <span class="suggestion-text">${match.text}</span>
                    <span class="suggestion-type">${match.type}</span>
                `;

                div.addEventListener('click', () => {
                    searchInput.value = match.text;
                    searchTerm = match.text.toLowerCase();
                    searchSuggestions.classList.add('hidden');
                    clearTimeout(debounceTimer);
                    currentPage = 1; // Reset to first page
                    renderTools();
                });

                fragment.appendChild(div);
            });

            searchSuggestions.appendChild(fragment);
            searchSuggestions.classList.remove('hidden');
            selectedSuggestionIndex = -1;
        } else {
            searchSuggestions.classList.add('hidden');
        }
    }

    function updateActiveSuggestion(items) {
        items.forEach(item => item.classList.remove('active'));
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
            items[selectedSuggestionIndex].classList.add('active');
            items[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // Pagination Rendering
    function renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) return;

        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTools();
                window.scrollTo({ top: document.getElementById('tools-grid').offsetTop - 100, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Page Numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'pagination-btn';
            firstPageBtn.textContent = '1';
            firstPageBtn.addEventListener('click', () => {
                currentPage = 1;
                renderTools();
                window.scrollTo({ top: document.getElementById('tools-grid').offsetTop - 100, behavior: 'smooth' });
            });
            paginationContainer.appendChild(firstPageBtn);

            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.className = 'pagination-dots';
                dots.textContent = '...';
                paginationContainer.appendChild(dots);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderTools();
                window.scrollTo({ top: document.getElementById('tools-grid').offsetTop - 100, behavior: 'smooth' });
            });
            paginationContainer.appendChild(pageBtn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.className = 'pagination-dots';
                dots.textContent = '...';
                paginationContainer.appendChild(dots);
            }

            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'pagination-btn';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.addEventListener('click', () => {
                currentPage = totalPages;
                renderTools();
                window.scrollTo({ top: document.getElementById('tools-grid').offsetTop - 100, behavior: 'smooth' });
            });
            paginationContainer.appendChild(lastPageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTools();
                window.scrollTo({ top: document.getElementById('tools-grid').offsetTop - 100, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // PERFORMANCE: Optimized rendering with DocumentFragment
    function renderTools() {
        if (!toolsGrid) return; // Guard clause for pages without tools grid

        const startTime = performance.now();

        // Clear content (including static fallback)
        toolsGrid.innerHTML = '';

        // Early exit if no search term and showing all
        const hasSearch = searchTerm.length > 0;
        const hasCategory = currentCategory !== 'all';

        let filteredTools = [];

        // PERFORMANCE: Optimize filtering
        if (!hasSearch && !hasCategory) {
            // Use all tools
            filteredTools = tools;
        } else {
            // Filter
            for (let i = 0; i < tools.length; i++) {
                const tool = tools[i];

                // Category check (fast)
                if (hasCategory && tool.category !== currentCategory) {
                    continue;
                }

                // Search check
                if (hasSearch) {
                    const searchLower = searchTerm;
                    const nameMatch = tool.name.toLowerCase().includes(searchLower);
                    const descMatch = tool.description.toLowerCase().includes(searchLower);
                    const keywordMatch = tool.keywords && tool.keywords.some(k => k.includes(searchLower));

                    if (nameMatch || descMatch || keywordMatch) {
                        filteredTools.push(tool);
                    }
                } else {
                    filteredTools.push(tool);
                }
            }
        }

        if (filteredTools.length === 0) {
            // Only show no results if we actually tried to filter and found nothing
            // OR if the dataset itself is empty (rare)
            noResults.classList.remove('hidden');
            document.getElementById('pagination-container').innerHTML = ''; // Clear pagination
        } else {
            noResults.classList.add('hidden');

            // Pagination Logic
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedTools = filteredTools.slice(startIndex, endIndex);

            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < paginatedTools.length; i++) {
                const tool = paginatedTools[i];
                const card = document.createElement('div');
                card.className = 'tool-card';

                card.innerHTML = `
                    <div class="tool-header">
                        <span class="tool-tag">${tool.category || tool.tag}</span>
                    </div>
                    <h2>${tool.name}</h2>
                    <p>${tool.description}</p>
                    <a href="tool.html?name=${encodeURIComponent(tool.name)}" class="tool-link">View Details</a>
                `;

                fragment.appendChild(card);

                // Make card clickable (except the button to avoid double event)
                card.style.cursor = 'pointer';
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('tool-link')) {
                        window.location.href = `tool.html?name=${encodeURIComponent(tool.name)}`;
                    }
                });
            }

            toolsGrid.appendChild(fragment);

            // Render Pagination
            renderPagination(filteredTools.length);
        }

        // Optional: Log performance
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            console.log(`Render took ${(endTime - startTime).toFixed(2)}ms`);
        }
    }

    // Scroll Effect
    const header = document.querySelector('header');
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
});
