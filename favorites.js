// Get favorites for the current server (array of channel objects)
function getCurrentFavorites() {
    const key = PLAYLISTS[currentPlaylistIndex].url;
    return favoritesData[key] || [];
}

function setCurrentFavorites(favs) {
    const key = PLAYLISTS[currentPlaylistIndex].url;
    favoritesData[key] = favs;
    localStorage.setItem('genoin_favorites_v3', JSON.stringify(favoritesData));
}

// Check if a channel ID is favorited on the current server
function isChannelFavorited(channelId) {
    return getCurrentFavorites().some(c => c.id === channelId);
}

// Get ALL favorites across every server
function getAllFavorites() {
    const all = [];
    for (const playlist of PLAYLISTS) {
        const favs = favoritesData[playlist.url] || [];
        if (favs.length > 0) {
            favs.forEach(channel => {
                all.push({ channel, serverName: playlist.name, serverIndex: PLAYLISTS.indexOf(playlist) });
            });
        }
    }
    return all;
}

// --- Playback Mode (Server vs Favorites) ---
function updatePlaybackModeUI() {
    const badge = document.getElementById('fav-mode-badge');
    if (playbackMode === 'favorites') {
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

function playFromFavorites(favIndex) {
    const allFavs = getAllFavorites();
    if (favIndex < 0 || favIndex >= allFavs.length) return;
    playbackMode = 'favorites';
    currentFavIndex = favIndex;
    updatePlaybackModeUI();
    const { channel } = allFavs[favIndex];
    const encodedData = encodeURIComponent(JSON.stringify(channel));
    playStream(encodedData);

    // Highlight active favorite card
    document.querySelectorAll('#favorites-row .channel-card').forEach(el => el.classList.remove('active'));
    const favCards = document.querySelectorAll('#favorites-row .channel-card');
    if (favCards[favIndex]) favCards[favIndex].classList.add('active');
}

function playFromGrid(encodedData) {
    playbackMode = 'server';
    currentFavIndex = -1;
    updatePlaybackModeUI();
    document.querySelectorAll('#favorites-row .channel-card').forEach(el => el.classList.remove('active'));
    playStream(encodedData);
}

function removeFavoriteItem(event, serverIndex, channelId) {
    event.stopPropagation();
    const key = PLAYLISTS[serverIndex].url;
    let favs = favoritesData[key] || [];
    favs = favs.filter(c => c.id !== channelId);
    favoritesData[key] = favs;
    localStorage.setItem('genoin_favorites_v3', JSON.stringify(favoritesData));

    // Update main grid heart button if on the same server
    if (serverIndex === currentPlaylistIndex) {
        document.querySelectorAll(`#all-channels-grid .fav-btn[data-id="${channelId}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
    }

    renderFavorites();

    // Adjust favorites mode index if needed
    if (playbackMode === 'favorites') {
        const allFavs = getAllFavorites();
        if (allFavs.length === 0) {
            playbackMode = 'server';
            currentFavIndex = -1;
            updatePlaybackModeUI();
        } else if (currentFavIndex >= allFavs.length) {
            currentFavIndex = allFavs.length - 1;
        }
    }
}

function toggleFavorite(event, channelId) {
    event.stopPropagation();
    const favs = getCurrentFavorites();
    const index = favs.findIndex(c => c.id === channelId);
    if (index === -1) {
        // Find the full channel object and store it
        const channelObj = allChannelsData.find(c => c.id === channelId);
        if (channelObj) favs.push({...channelObj});
    } else {
        favs.splice(index, 1);
    }
    setCurrentFavorites(favs);
    
    // Update UI
    document.querySelectorAll(`.fav-btn[data-id="${channelId}"]`).forEach(btn => {
        btn.classList.toggle('active');
    });
    renderFavorites();

    // Adjust favorites playback index if needed
    if (playbackMode === 'favorites') {
        const allFavs = getAllFavorites();
        if (allFavs.length === 0) {
            playbackMode = 'server';
            currentFavIndex = -1;
            updatePlaybackModeUI();
        } else if (currentFavIndex >= allFavs.length) {
            currentFavIndex = allFavs.length - 1;
        }
    }
}

// Remove a favorite from a different server (cross-server unfavorite)
function removeCrossServerFav(event, serverIndex, channelId) {
    event.stopPropagation();
    const key = PLAYLISTS[serverIndex].url;
    let favs = favoritesData[key] || [];
    favs = favs.filter(c => c.id !== channelId);
    favoritesData[key] = favs;
    localStorage.setItem('genoin_favorites_v3', JSON.stringify(favoritesData));
    renderFavorites();
}

function renderFavorites() {
    const favoritesContainer = document.getElementById('favorites-container');
    const favoritesRow = document.getElementById('favorites-row');
    
    const allFavs = getAllFavorites();
    
    if (allFavs.length > 0) {
        favoritesContainer.classList.remove('d-none');
        favoritesRow.innerHTML = allFavs.map(({ channel, serverName, serverIndex }, favIdx) => 
            createFavoriteCardHTML(channel, serverName, serverIndex, favIdx)
        ).join('');
    } else {
        favoritesContainer.classList.add('d-none');
    }
}
