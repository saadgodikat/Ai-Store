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

    // Performance: Initialize Suggestions Data (memoized)
    const suggestionData = initializeSuggestions();

    // Initial Render - Show limited results
    renderTools();

    // PERFORMANCE FIX: Debounced Search Listener
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        
        // Clear previous timer
        clearTimeout(debounceTimer);
        
        // Debounce: Wait 300ms after user stops typing
        debounceTimer = setTimeout(() => {
            renderTools();
            renderSuggestions(searchTerm);
        }, 300);
    });

    // Suggestion Keyboard Navigation
    searchInput.addEventListener('keydown', (e) => {
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
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
        }
    });

    // Category Listeners
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderTools();
        });
    });

    // Theme Toggle
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

    // PERFORMANCE: Optimized rendering with DocumentFragment
    function renderTools() {
        const startTime = performance.now();
        
        toolsGrid.innerHTML = '';
        
        // Early exit if no search term and showing all
        const hasSearch = searchTerm.length > 0;
        const hasCategory = currentCategory !== 'all';
        
        let filteredTools = [];
        
        // PERFORMANCE: Optimize filtering
        if (!hasSearch && !hasCategory) {
            // Show first 50 tools when no filters
            filteredTools = tools.slice(0, 50);
        } else {
            // Filter with early exit
            const maxResults = 100;
            for (let i = 0; i < tools.length && filteredTools.length < maxResults; i++) {
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
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
            
            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();
            
            // Show up to 50 results initially for speed
            const displayLimit = Math.min(filteredTools.length, 50);
            
            for (let i = 0; i < displayLimit; i++) {
                const tool = filteredTools[i];
                const card = document.createElement('div');
                card.className = 'tool-card';
                
                card.innerHTML = `
                    <div class="tool-header">
                        <span class="tool-tag">${tool.category || tool.tag}</span>
                    </div>
                    <h2>${tool.name}</h2>
                    <p>${tool.description}</p>
                    <a href="${tool.url}" target="_blank" class="tool-link">Visit Tool</a>
                `;
                
                fragment.appendChild(card);
            }
            
            toolsGrid.appendChild(fragment);
            
            // Show count if there are more results
            if (filteredTools.length > displayLimit) {
                const moreIndicator = document.createElement('div');
                moreIndicator.style.gridColumn = '1 / -1';
                moreIndicator.style.textAlign = 'center';
                moreIndicator.style.padding = '20px';
                moreIndicator.style.color = 'var(--text-color)';
                moreIndicator.innerHTML = `<p>Showing ${displayLimit} of ${filteredTools.length} results. Use search to narrow down.</p>`;
                toolsGrid.appendChild(moreIndicator);
            }
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
