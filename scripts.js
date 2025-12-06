// Tools are now loaded from tools-data.js

document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.getElementById('tools-grid');
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const noResults = document.getElementById('no-results');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const paginationContainer = document.getElementById('pagination-container');

    let currentCategory = 'all';
    let searchTerm = '';
    let currentPage = 1;
    const itemsPerPage = 50;

    let filteredTools = [...tools]; // Initialize with all tools

    // --- Theme Logic ---
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

    initTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // --- Core Logic: Filtering & Rendering ---

    function applyFilters() {
        // 1. Filter by Category
        let list = tools;
        if (currentCategory !== 'all') {
            list = list.filter(tool => (tool.category || '').toLowerCase() === currentCategory.toLowerCase());
        }

        // 2. Filter by Search Term (Name & Description)
        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase();
            list = list.filter(tool =>
                tool.name.toLowerCase().includes(query) ||
                (tool.description && tool.description.toLowerCase().includes(query))
            );
        }

        filteredTools = list;
        currentPage = 1; // Reset to page 1 on filter change
        renderTools();
    }

    function renderTools() {
        if (!toolsGrid) return;

        // 1. Clear Container
        toolsGrid.innerHTML = '';
        paginationContainer.innerHTML = '';

        // 2. Check Empty State
        if (filteredTools.length === 0) {
            noResults.style.display = 'block'; // Show empty message explicitly
            return;
        } else {
            noResults.style.display = 'none'; // Hide empty message explicitly
        }

        // 3. Pagination Logic
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTools = filteredTools.slice(startIndex, endIndex);

        // 4. Render Cards
        const fragment = document.createDocumentFragment();

        paginatedTools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';

            // Use specific class names requested for styling
            card.innerHTML = `
                <span class="tool-category">${tool.category || 'Tool'}</span>
                <h3 class="tool-name">${tool.name}</h3>
                <p class="tool-description">${tool.description}</p>
                <a class="tool-link" href="tool.html?name=${encodeURIComponent(tool.name)}">
                    View Details <i class="fas fa-arrow-right" style="font-size: 0.8em;"></i>
                </a>
            `;

            // Make entire card clickable for better UX
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
                // Prevent redirection if clicking the link directly (let the link handle it)
                if (!e.target.closest('a')) {
                    window.location.href = `tool.html?name=${encodeURIComponent(tool.name)}`;
                }
            };

            fragment.appendChild(card);
        });

        toolsGrid.appendChild(fragment);

        // 5. Render Pagination
        renderPagination(filteredTools.length);
    }

    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;

        // Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTools(); scrollToTop(); } };
        paginationContainer.appendChild(prevBtn);

        // Page Numbers (Simplified logic for cleaner code)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        if (startPage > 1) {
            const first = createPageBtn(1);
            paginationContainer.appendChild(first);
            if (startPage > 2) paginationContainer.appendChild(createDots());
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createPageBtn(i));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationContainer.appendChild(createDots());
            paginationContainer.appendChild(createPageBtn(totalPages));
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTools(); scrollToTop(); } };
        paginationContainer.appendChild(nextBtn);
    }

    function createPageBtn(page) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${page === currentPage ? 'active' : ''}`;
        btn.textContent = page;
        btn.onclick = () => { currentPage = page; renderTools(); scrollToTop(); };
        return btn;
    }

    function createDots() {
        const span = document.createElement('span');
        span.className = 'pagination-dots';
        span.textContent = '...';
        return span;
    }

    function scrollToTop() {
        const gridTop = toolsGrid.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: gridTop, behavior: 'smooth' });
    }

    // --- Search & Event Listeners ---

    // Initial Load
    renderTools(); // Show all tools immediately

    // Search Input
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchTerm = e.target.value.trim();
                applyFilters();
            }, 300);
        });
    }

    // Category Buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyFilters();
        });
    });

    // Scroll Header Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

});
