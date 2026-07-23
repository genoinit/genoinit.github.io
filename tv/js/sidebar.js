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

let sidebarActiveTab = 'all';

window.changeSidebarTab = function (event, tabName) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    sidebarActiveTab = tabName;
    
    // Update active state in UI tab buttons
    const tabAll = document.getElementById('sidebar-tab-all');
    const tabFav = document.getElementById('sidebar-tab-fav');
    if (tabAll) tabAll.classList.toggle('active', tabName === 'all');
    if (tabFav) tabFav.classList.toggle('active', tabName === 'fav');
    
    renderSidebarChannels();
    
    // Reset selection highlight to the first item of the new tab
    const visibleItems = getVisibleSidebarItems();
    if (visibleItems.length > 0) {
        highlightSidebarItem(0);
    } else {
        sidebarHighlightedIndex = -1;
    }
};

function renderSidebarChannels() {
    const term = sidebarSearchInput.value.toLowerCase().trim();
    const tabWrapper = document.querySelector('.sidebar-tab-wrapper');
    
    let channelsToRender = [];
    
    // "while search its hide the section"
    if (term !== '') {
        // Hide the tab selector section during search
        if (tabWrapper) tabWrapper.classList.add('d-none');
        // Search across all channels
        channelsToRender = allChannelsData;
    } else {
        // Show the tab selector section when not searching
        if (tabWrapper) tabWrapper.classList.remove('d-none');
        
        if (sidebarActiveTab === 'all') {
            channelsToRender = allChannelsData;
        } else if (sidebarActiveTab === 'fav') {
            const allFavs = getAllFavorites();
            channelsToRender = allFavs.map(f => f.channel);
        }
    }
    
    // Filter by search query if any
    if (term !== '') {
        channelsToRender = channelsToRender.filter(channel => 
            channel.name.toLowerCase().includes(term)
        );
    }
    
    sidebarChannelsList.innerHTML = channelsToRender.map(channel => {
        const channelData = encodeURIComponent(JSON.stringify(channel));
        const isFav = isChannelFavorited(channel.id);
        const serverBadge = channel.urls.length > 1 ? `<span class="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-10 ms-auto extra-small" style="font-size: 0.6rem; padding: 2px 6px;"><i class="bi bi-hdd-network"></i> ${channel.urls.length}</span>` : '';
        
        // Determine correct click behavior
        const allFavs = getAllFavorites();
        const favIdx = allFavs.findIndex(f => f.channel.id === channel.id);
        const clickAction = favIdx !== -1 ? `playFromFavorites(${favIdx})` : `playFromGrid('${channelData}')`;
        
        return `
            <div class="sidebar-item ${activeChannel?.id === channel.id ? 'active' : ''}" id="sidebar-card-${channel.id}" onclick="${clickAction}">
                <button class="sidebar-fav-btn ${isFav ? 'active' : ''}" data-id="${channel.id}" onclick="toggleFavorite(event, ${channel.id})">
                    <i class="bi bi-heart-fill"></i>
                </button>
                <img src="${channel.logo || generateLetterLogo(channel.name)}" onerror="handleLogoError(this, '${channel.name.replace(/'/g, "\\'")}')">
                <div class="sidebar-item-name">${channel.name}</div>
                ${serverBadge}
            </div>
        `;
    }).join('');
    
    if (channelsToRender.length === 0) {
        sidebarChannelsList.innerHTML = '<div class="text-center p-4 text-secondary small">No channels found.</div>';
    }
}

function renderChannels(channels) {
    const allChannelsGrid = document.getElementById('all-channels-grid');
    const totalChannelsDisplay = document.getElementById('total-channels');
    
    allChannelsGrid.innerHTML = channels.map(createChannelCardHTML).join('');
    totalChannelsDisplay.textContent = channels.length;
    
    // Populate Sidebar dynamically based on active tab/search
    renderSidebarChannels();
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
    renderSidebarChannels();
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

// Close or toggle sidebar when clicking outside (on the video container)
videoContainer.addEventListener('click', (e) => {
    const isCinemaMode = document.body.getAttribute('data-layout') === 'cinema-mode';
    
    // Check if the click is on a control element or inside the sidebar
    const isControl = e.target.closest('.player-controls-bar') || 
                      e.target.closest('#fullscreen-sidebar') || 
                      e.target.closest('#screen-servers-container') ||
                      e.target.closest('#player-status-widget') ||
                      e.target.closest('#video-loader') ||
                      e.target.closest('#sidebar-toggle-btn') ||
                      e.target.tagName.toLowerCase() === 'button' ||
                      e.target.tagName.toLowerCase() === 'input';
                      
    if (isCinemaMode) {
        if (!isControl) {
            e.stopPropagation();
            toggleSidebar();
        }
    } else {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
            sidebar.classList.remove('open');
            sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            resetControlsTimeout();
        }
    }
});

// Prevent sidebar clicks from auto-hiding controls
sidebar.addEventListener('click', (e) => {
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
