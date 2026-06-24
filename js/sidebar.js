function createChannelCardHTML(channel) {
    const isFav = isChannelFavorited(channel.id);
    const channelData = encodeURIComponent(JSON.stringify(channel));
    return `
        <div class="channel-card" id="card-${channel.id}" data-name="${channel.name.toLowerCase()}" onclick="playFromGrid('${channelData}')">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${channel.id}" onclick="toggleFavorite(event, ${channel.id})">
                <i class="bi bi-heart-fill"></i>
            </button>
            <div class="channel-logo-container">
                <img src="${channel.logo || generateLetterLogo(channel.name)}" alt="${channel.name}" loading="lazy" onerror="handleLogoError(this, '${channel.name.replace(/'/g, "\\'")}')">
            </div>
            <div class="channel-info position-relative">
                <div class="channel-title">${channel.name}</div>
                <div class="d-flex align-items-center justify-content-between mt-1">
                    <small class="text-success"><i class="bi bi-record-circle-fill me-1" style="font-size: 0.6rem;"></i>Live</small>
                    ${channel.urls.length > 1 ? `<span class="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-10" style="font-size: 0.6rem; padding: 2px 6px; border-radius: 4px;"><i class="bi bi-hdd-network me-1"></i>${channel.urls.length} Servers</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function createFavoriteCardHTML(channel, serverName, serverIndex, favIdx) {
    return `
        <div class="channel-card" data-name="${channel.name.toLowerCase()}" onclick="playFromFavorites(${favIdx})">
            <button class="fav-btn active" data-id="${channel.id}" data-server="${serverIndex}" onclick="removeFavoriteItem(event, ${serverIndex}, ${channel.id})">
                <i class="bi bi-heart-fill"></i>
            </button>
            <div class="channel-logo-container">
                <img src="${channel.logo || generateLetterLogo(channel.name)}" alt="${channel.name}" loading="lazy" onerror="handleLogoError(this, '${channel.name.replace(/'/g, "\\'")}')">
            </div>
            <div class="channel-info position-relative">
                <div class="channel-title">${channel.name}</div>
                <div class="d-flex align-items-center justify-content-between mt-1">
                    <span class="server-badge" style="max-width: 60%;"><i class="bi bi-server"></i>${serverName}</span>
                    ${channel.urls.length > 1 ? `<span class="badge bg-primary bg-opacity-15 text-white border border-primary border-opacity-10" style="font-size: 0.55rem; padding: 1px 4px; border-radius: 4px;"><i class="bi bi-hdd-network"></i> ${channel.urls.length}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderChannels(channels) {
    const allChannelsGrid = document.getElementById('all-channels-grid');
    const totalChannelsDisplay = document.getElementById('total-channels');
    
    allChannelsGrid.innerHTML = channels.map(createChannelCardHTML).join('');
    totalChannelsDisplay.textContent = channels.length;
    
    // Populate Sidebar
    sidebarChannelsList.innerHTML = channels.map(channel => {
        const channelData = encodeURIComponent(JSON.stringify(channel));
        const serverBadge = channel.urls.length > 1 ? `<span class="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-10 ms-auto extra-small" style="font-size: 0.6rem; padding: 2px 6px;"><i class="bi bi-hdd-network"></i> ${channel.urls.length}</span>` : '';
        return `
            <div class="sidebar-item" id="sidebar-card-${channel.id}" onclick="playFromGrid('${channelData}')">
                <img src="${channel.logo || generateLetterLogo(channel.name)}" onerror="handleLogoError(this, '${channel.name.replace(/'/g, "\\'")}')">
                <div class="sidebar-item-name">${channel.name}</div>
                ${serverBadge}
            </div>
        `;
    }).join('');
}

// --- Sidebar Logic ---
function getVisibleSidebarItems() {
    return Array.from(sidebarChannelsList.querySelectorAll('.sidebar-item:not(.d-none)'));
}

function highlightSidebarItem(index) {
    const visibleItems = getVisibleSidebarItems();
    if (visibleItems.length === 0) return;

    // Remove previous highlight
    visibleItems.forEach(item => item.classList.remove('keyboard-highlight'));

    // Clamp index
    if (index < 0) index = 0;
    if (index >= visibleItems.length) index = visibleItems.length - 1;

    sidebarHighlightedIndex = index;
    const itemToHighlight = visibleItems[index];
    itemToHighlight.classList.add('keyboard-highlight');

    // Scroll item into view smoothly
    itemToHighlight.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    sidebarToggleBtn.innerHTML = isOpen ? '<i class="bi bi-chevron-left"></i>' : '<i class="bi bi-chevron-right"></i>';
    
    if (isOpen) {
        clearTimeout(controlsTimeout);
        sidebarSearchInput.focus({ preventScroll: true });
        
        // Highlight active channel or first channel
        const visibleItems = getVisibleSidebarItems();
        const activeItemIndex = visibleItems.findIndex(item => item.classList.contains('active'));
        if (activeItemIndex !== -1) {
            highlightSidebarItem(activeItemIndex);
        } else if (visibleItems.length > 0) {
            highlightSidebarItem(0);
        }
    } else {
        resetControlsTimeout();
        sidebarSearchInput.value = '';
        filterSidebarChannels('');
        
        // Clear highlight
        const visibleItems = getVisibleSidebarItems();
        visibleItems.forEach(item => item.classList.remove('keyboard-highlight'));
        sidebarHighlightedIndex = -1;
    }
}

function filterSidebarChannels(term) {
    const items = sidebarChannelsList.querySelectorAll('.sidebar-item');
    items.forEach(item => {
        const name = item.querySelector('.sidebar-item-name').textContent.toLowerCase();
        if (name.includes(term.toLowerCase())) {
            item.classList.remove('d-none');
        } else {
            item.classList.add('d-none');
        }
    });
}

sidebarSearchInput.addEventListener('input', (e) => {
    filterSidebarChannels(e.target.value);
    // Highlight the first visible item after filtering
    const visibleItems = getVisibleSidebarItems();
    if (visibleItems.length > 0) {
        highlightSidebarItem(0);
    } else {
        sidebarHighlightedIndex = -1;
    }
});

sidebarToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
});

closeSidebarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.remove('open');
    sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
    resetControlsTimeout();
});

// Close sidebar when clicking outside (on the video container)
videoContainer.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
        sidebar.classList.remove('open');
        sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        resetControlsTimeout();
    }
});

// Prevent sidebar clicks from closing it or auto-hiding
sidebar.addEventListener('click', (e) => {
    e.stopPropagation();
    resetControlsTimeout();
});

// --- Live Search / Filtering Logic ---
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const favoritesContainer = document.getElementById('favorites-container');
    const allChannelsTitle = document.getElementById('all-channels-title');
    const allCards = document.querySelectorAll('#all-channels-grid .channel-card');

    if (searchTerm.length > 0) {
        favoritesContainer.classList.add('d-none');
        allChannelsTitle.textContent = `Search Results for "${e.target.value}"`;
    } else {
        if (getAllFavorites().length > 0) favoritesContainer.classList.remove('d-none');
        allChannelsTitle.textContent = 'All Live Channels';
    }

    allCards.forEach(card => {
        const channelName = card.getAttribute('data-name');
        if (channelName.includes(searchTerm)) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
});
