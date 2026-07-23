// --- Video Player Logic ---
function playNextChannel() {
    if (playbackMode === 'favorites') {
        const allFavs = getAllFavorites();
        if (allFavs.length === 0) return;
        currentFavIndex = (currentFavIndex + 1) % allFavs.length;
        playFromFavorites(currentFavIndex);
        return;
    }
    if (allChannelsData.length === 0) return;
    currentChannelIndex = (currentChannelIndex + 1) % allChannelsData.length;
    const nextChannel = allChannelsData[currentChannelIndex];
    const channelData = encodeURIComponent(JSON.stringify(nextChannel));
    playStream(channelData);
}

function playPrevChannel() {
    if (playbackMode === 'favorites') {
        const allFavs = getAllFavorites();
        if (allFavs.length === 0) return;
        currentFavIndex = (currentFavIndex - 1 + allFavs.length) % allFavs.length;
        playFromFavorites(currentFavIndex);
        return;
    }
    if (allChannelsData.length === 0) return;
    currentChannelIndex = (currentChannelIndex - 1 + allChannelsData.length) % allChannelsData.length;
    const prevChannel = allChannelsData[currentChannelIndex];
    const channelData = encodeURIComponent(JSON.stringify(prevChannel));
    playStream(channelData);
}

function buildScreenServerButtons() {
    const container = document.getElementById('screen-servers-container');
    const box = document.getElementById('screen-server-pills');
    if (!container || !box) return;

    if (!activeChannel || !activeChannel.urls || activeChannel.urls.length <= 1) {
        container.classList.add('d-none');
        return;
    }

    container.classList.remove('d-none');
    box.innerHTML = '';
    activeChannel.urls.forEach((url, i) => {
        const button = document.createElement('button');
        button.className = 'screen-server-pill';
        button.id = `screen-server-pill-${i}`;
        button.innerHTML = `<i class="bi bi-circle-fill" style="font-size: 0.5rem;"></i> Server ${i + 1}`;
        button.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(failoverTimer);
            playServer(i);
        };
        box.appendChild(button);
    });
}

function updateScreenServerUIState(index, state) {
    const pill = document.getElementById(`screen-server-pill-${index}`);
    if (!pill) return;

    pill.classList.remove('testing', 'active', 'failed');
    const icon = pill.querySelector('i');
    icon.className = 'bi bi-circle-fill';

    if (state === 'testing') {
        pill.classList.add('testing');
        icon.className = 'bi bi-arrow-repeat spin';
    } else if (state === 'active') {
        pill.classList.add('active');
        icon.className = 'bi bi-check-circle-fill';
    } else if (state === 'failed') {
        pill.classList.add('failed');
        icon.className = 'bi bi-x-circle-fill';
    }
}

function playStream(encodedData) {
    const channel = JSON.parse(decodeURIComponent(encodedData));
    activeChannel = channel;
    currentChannelIndex = allChannelsData.findIndex(c => c.id === channel.id);
    const isPip = videoContainer.classList.contains('pip-mode');

    // UI Transitions: Hide Hero, Show Video & Reset Loader
    if (!isPip) {
        heroBg.style.opacity = '0';
        heroContent.style.opacity = '0';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => {
            heroBg.style.display = 'none';
            heroContent.style.display = 'none';
            videoContainer.style.display = 'block';
        }, 500);
    } else {
        videoContainer.style.display = 'block';
    }
    
    // Highlight active card (grid only)
    document.querySelectorAll('#all-channels-grid .channel-card').forEach(el => el.classList.remove('active'));
    if (playbackMode === 'server') {
        document.querySelectorAll(`#card-${channel.id}`).forEach(el => el.classList.add('active'));
    }

    // Highlight active sidebar item
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    const sidebarItem = document.getElementById(`sidebar-card-${channel.id}`);
    if (sidebarItem) sidebarItem.classList.add('active');


    // Play first server
    playServer(0);
}

function playServer(index) {
    if (!activeChannel || !activeChannel.urls || activeChannel.urls.length === 0) {
        showGlobalPlayerError();
        return;
    }

    if (index >= activeChannel.urls.length) {
        showGlobalPlayerError();
        return;
    }

    activeServerIndex = index;
    const url = activeChannel.urls[index];

    // Hide quality selector initially until manifest is parsed
    const qContainer = document.getElementById('quality-selector-container');
    if (qContainer) qContainer.style.display = 'none';

    // Rebuild pills if playing server 0 (new channel)
    if (index === 0) {
        buildScreenServerButtons();
    }

    // Update pills UI states
    for (let i = 0; i < activeChannel.urls.length; i++) {
        if (i === index) {
            updateScreenServerUIState(i, 'testing');
        } else {
            const pill = document.getElementById(`screen-server-pill-${i}`);
            if (pill && !pill.classList.contains('failed')) {
                pill.className = 'screen-server-pill';
                pill.querySelector('i').className = 'bi bi-circle-fill';
            }
        }
    }

    // Loader display setup
    videoLoader.style.display = 'block'; 
    loadingSpinner.style.display = 'inline-block';
    loaderText.innerText = activeChannel.urls.length > 1 
        ? `Connecting to Server ${index + 1}...` 
        : "Connecting...";
    loaderText.classList.remove('text-danger');

    // Update Control Bar Info
    playingTitle.textContent = activeChannel.name;
    playingLogo.src = activeChannel.logo || generateLetterLogo(activeChannel.name);
    playingLogo.style.display = 'block';

    // Clean previous players
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.classList.add('fade-out');

    // Timeout for failover
    clearTimeout(failoverTimer);
    failoverTimer = setTimeout(() => {
        console.warn(`Server ${index + 1} timed out loading.`);
        handleFailover();
    }, 7500);

    // HLS Video Integration
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        hlsInstance = new Hls({
            maxMaxBufferLength: 8,
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 1
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(e => console.log("Autoplay blocked:", e));
            updatePlayPauseUI();
            updateQualityMenu();
        });

        hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                console.warn(`Hls.js fatal error: ${data.details}`);
                handleFailover();
            }
        });
    } 
    // Native fallback
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function () {
            video.play().catch(e => {});
            updatePlayPauseUI();
        });
    }
}

function handleFailover() {
    clearTimeout(failoverTimer);
    updateScreenServerUIState(activeServerIndex, 'failed');

    const nextIndex = activeServerIndex + 1;
    if (nextIndex < activeChannel.urls.length) {
        console.log(`Failing over to Server ${nextIndex + 1}`);
        playServer(nextIndex);
    } else {
        showGlobalPlayerError();
    }
}

function showGlobalPlayerError() {
    clearTimeout(failoverTimer);
    videoLoader.style.display = 'block';
    loadingSpinner.style.display = 'none';
    loaderText.innerText = "All Servers Offline / Unavailable";
    loaderText.classList.add('text-danger');
    video.classList.remove('fade-out');
    
    if (activeChannel && activeChannel.urls) {
        for (let i = 0; i < activeChannel.urls.length; i++) {
            updateScreenServerUIState(i, 'failed');
        }
    }
}

// Catch native video errors
video.addEventListener('error', () => {
    console.log("HTML Video native error triggered.");
    handleFailover();
});

// --- Loader & Playback Events ---
video.addEventListener('waiting', () => {
    videoLoader.style.display = 'block';
});

video.addEventListener('playing', () => {
    clearTimeout(failoverTimer);
    videoLoader.style.display = 'none';
    loaderText.innerText = "Connecting..."; 
    loaderText.classList.remove('text-danger');
    updatePlayPauseUI();
    updateScreenServerUIState(activeServerIndex, 'active');
    video.classList.remove('fade-out');
});

video.addEventListener('canplay', () => {
    videoLoader.style.display = 'none';
    video.classList.remove('fade-out');
});

video.addEventListener('pause', updatePlayPauseUI);

// --- Custom Player Controls UI ---
function updatePlayPauseUI() {
    if (video.paused) {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    } else {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }
}

playPauseBtn.addEventListener('click', () => {
    if (video.paused) { video.play(); } 
    else { video.pause(); }
    updatePlayPauseUI();
});

prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playPrevChannel();
});

nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playNextChannel();
});

muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    if (video.muted || video.volume === 0) {
        muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        volumeSlider.value = 0;
    } else {
        muteBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        volumeSlider.value = video.volume;
    }
});

volumeSlider.addEventListener('input', (e) => {
    video.volume = e.target.value;
    video.muted = false;
    if (video.volume == 0) { muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>'; } 
    else if (video.volume < 0.5) { muteBtn.innerHTML = '<i class="bi bi-volume-down-fill"></i>'; } 
    else { muteBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>'; }
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) { videoContainer.requestFullscreen(); }
        else if (videoContainer.webkitRequestFullscreen) { videoContainer.webkitRequestFullscreen(); } // Safari
        else if (videoContainer.msRequestFullscreen) { videoContainer.msRequestFullscreen(); } // IE11
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); }
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
        else if (document.msExitFullscreen) { document.msExitFullscreen(); }
    }
});

// --- FULLSCREEN AUTO-HIDE LOGIC ---
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
    const stickyWrapper = document.getElementById('sticky-player-wrapper');
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        videoContainer.classList.add('is-fullscreen');
        // Ensure PiP classes are removed so we get full controls
        videoContainer.classList.remove('pip-mode');
        stickyWrapper.classList.remove('pip-active');
        resetControlsTimeout();
    } else {
        videoContainer.classList.remove('is-fullscreen');
        videoContainer.classList.remove('hide-controls');
        sidebar.classList.remove('open');
        sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        
        // Restore PiP if we are still scrolled down
        if (window.scrollY > 450 && videoContainer.style.display === 'block') {
            videoContainer.classList.add('pip-mode');
            stickyWrapper.classList.add('pip-active');
        }
        
        clearTimeout(controlsTimeout);
    }
}

videoContainer.addEventListener('mousemove', () => {
    if (videoContainer.classList.contains('is-fullscreen')) {
        videoContainer.classList.remove('hide-controls');
        resetControlsTimeout();
    }
});

function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    // Don't auto-hide if sidebar is open
    if (sidebar.classList.contains('open')) return;
    
    controlsTimeout = setTimeout(() => {
        if (videoContainer.classList.contains('is-fullscreen')) {
            videoContainer.classList.add('hide-controls');
        }
    }, 3000); 
}

// --- Volume UI Helper ---
function updateVolumeUI() {
    volumeSlider.value = video.muted ? 0 : video.volume;
    if (video.muted || video.volume == 0) {
        muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
    } else if (video.volume < 0.5) {
        muteBtn.innerHTML = '<i class="bi bi-volume-down-fill"></i>';
    } else {
        muteBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
    }
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    const isFullscreen = videoContainer.classList.contains('is-fullscreen');
    const isSidebarOpen = sidebar.classList.contains('open');
    const keyLower = e.key.toLowerCase();
    const hasModifier = e.ctrlKey || e.altKey;

    // Don't capture keys when typing in search inputs, EXCEPT:
    // 1. Arrow navigation / Enter / Escape when sidebar is open
    // 2. Ctrl/Alt + S/L shortcuts (toggles and defocuses panels)
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
        if (isSidebarOpen && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter')) {
            // Let it pass through to navigate sidebar below
        } else if (e.key === 'Escape') {
            // Let Escape pass through to close sidebar
        } else if (hasModifier && (keyLower === 's' || keyLower === 'l')) {
            // Let Ctrl/Alt + S/L pass through to handle toggle/defocus
        } else {
            return;
        }
    }

    // Only activate shortcuts when video is visible (playing) OR if key is 's'/'S' (to focus homepage search)
    if (videoContainer.style.display !== 'block' && keyLower !== 's') return;

    // Show controls on any keypress in fullscreen
    if (isFullscreen) {
        videoContainer.classList.remove('hide-controls');
        resetControlsTimeout();
    }

    switch (e.key) {
        // --- Play / Pause ---
        case ' ':
        case 'k':
        case 'K':
            e.preventDefault();
            if (video.paused) video.play();
            else video.pause();
            updatePlayPauseUI();
            break;

        // --- Volume Up / Sidebar Navigate Up ---
        case 'ArrowUp':
            e.preventDefault();
            if (isSidebarOpen) {
                highlightSidebarItem(sidebarHighlightedIndex - 1);
            } else {
                video.volume = Math.min(1, video.volume + 0.05);
                video.muted = false;
                updateVolumeUI();
            }
            break;

        // --- Volume Down / Sidebar Navigate Down ---
        case 'ArrowDown':
            e.preventDefault();
            if (isSidebarOpen) {
                highlightSidebarItem(sidebarHighlightedIndex + 1);
            } else {
                video.volume = Math.max(0, video.volume - 0.05);
                video.muted = false;
                updateVolumeUI();
            }
            break;

        // --- Select channel (Enter) ---
        case 'Enter':
            if (isSidebarOpen) {
                e.preventDefault();
                const visibleItems = getVisibleSidebarItems();
                if (sidebarHighlightedIndex >= 0 && sidebarHighlightedIndex < visibleItems.length) {
                    visibleItems[sidebarHighlightedIndex].click();
                }
            }
            break;

        // --- Next Channel ---
        case 'ArrowRight':
        case 'n':
        case 'N':
            e.preventDefault();
            playNextChannel();
            break;

        // --- Previous Channel ---
        case 'ArrowLeft':
        case 'p':
        case 'P':
            e.preventDefault();
            playPrevChannel();
            break;

        // --- Fullscreen Toggle ---
        case 'f':
        case 'F':
            e.preventDefault();
            fullscreenBtn.click();
            break;

        // --- Mute Toggle ---
        case 'm':
        case 'M':
            e.preventDefault();
            video.muted = !video.muted;
            updateVolumeUI();
            break;

        // --- Sidebar Toggle (fullscreen only) ---
        case 'l':
        case 'L':
            if (isFullscreen) {
                e.preventDefault();
                if (isSidebarOpen) {
                    // Defocus search input and close sidebar
                    sidebarSearchInput.blur();
                    sidebar.classList.remove('open');
                    sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
                    resetControlsTimeout();
                } else {
                    toggleSidebar();
                }
            }
            break;

        // --- Search Channel Shortcut ---
        case 's':
        case 'S':
            e.preventDefault();
            if (isFullscreen) {
                if (!isSidebarOpen) {
                    toggleSidebar();
                } else {
                    // If sidebar is open, defocus and close sidebar
                    sidebarSearchInput.blur();
                    sidebar.classList.remove('open');
                    sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
                    resetControlsTimeout();
                }
            } else {
                const homepageSearch = document.getElementById('channel-search');
                if (homepageSearch) {
                    if (document.activeElement === homepageSearch) {
                        homepageSearch.blur();
                    } else {
                        homepageSearch.focus();
                        homepageSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
            break;

        // --- Close sidebar / exit fullscreen ---
        case 'Escape':
            if (isFullscreen && sidebar.classList.contains('open')) {
                e.preventDefault();
                sidebar.classList.remove('open');
                sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
                resetControlsTimeout();
            }
            break;

        // --- Number keys 0-9: set volume to 0%-90% ---
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            e.preventDefault();
            video.volume = parseInt(e.key) / 10;
            video.muted = false;
            updateVolumeUI();
            break;

        // --- Toggle Keyboard Help Modal ---
        case '?':
        case '/':
            e.preventDefault();
            const modalEl = document.getElementById('shortcutsModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                modalInstance.toggle();
            }
            break;
    }
});

function startWidgetClock() {
    const timeDisplay = document.getElementById('widget-time');
    if (!timeDisplay) return;
    
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const hoursStr = String(hours).padStart(2, '0');
        timeDisplay.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// Playlist Fetch and Selector Init
async function fetchAndParseM3U(url) {
    try {
        // Show loader and clear grid
        document.getElementById('loader').style.display = 'flex';
        document.getElementById('all-channels-grid').innerHTML = '';
        sidebarChannelsList.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
        allChannelsData = []; 

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const textData = await response.text();
        
        const channelsMap = {};

        if (url.endsWith('.json') || textData.trim().startsWith('[') || textData.trim().startsWith('{')) {
            const data = JSON.parse(textData);
            let arrayData = [];
            if (Array.isArray(data)) {
                arrayData = data;
            } else if (data.channels && Array.isArray(data.channels)) {
                arrayData = data.channels;
            } else {
                Object.values(data).forEach(val => {
                    if (Array.isArray(val)) {
                        arrayData.push(...val);
                    } else if (val && typeof val === 'object' && val.url) {
                        arrayData.push(val);
                    }
                });
            }
            
            for (const ch of arrayData) {
                if (!ch.url) continue;

                // Grouping logic: Clean region and server tags
                const name = ch.name || ch.channel_name || 'Unknown Channel';
                const logo = ch.logo || ch.image || '';
                const group = ch.group || '';
                const chUrl = ch.url;

                let cleanedName = name.replace(/\s*[-_\[(]+(bd|in|vip|sd|hd|hq|digital|clean)[\])]*\s*$/i, '').trim();
                cleanedName = cleanedName.replace(/\s*[-_\[(]+(server\s*)?\d+[\])]*\s*$/i, '').trim();
                
                const key = cleanedName.toLowerCase();
                
                if (!channelsMap[key]) {
                    channelsMap[key] = {
                        id: getStableId(cleanedName),
                        name: cleanedName,
                        logo: logo,
                        group: group,
                        urls: []
                    };
                }
                
                // Add URL if not already present
                if (!channelsMap[key].urls.includes(chUrl)) {
                    channelsMap[key].urls.push(chUrl);
                }
                
                // Preserve logo if new entry has one and map doesn't
                if (logo && !channelsMap[key].logo) {
                    channelsMap[key].logo = logo;
                }
            }
        } else {
            const lines = textData.split('\n');
            let currentChannel = { name: '', logo: '', url: '', group: '' };

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                if (line.startsWith('#EXTINF:')) {
                    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                    currentChannel.logo = logoMatch ? logoMatch[1] : '';
                    
                    const groupMatch = line.match(/group-title="([^"]+)"/);
                    currentChannel.group = groupMatch ? groupMatch[1] : '';
                    
                    const nameSplit = line.split(',');
                    currentChannel.name = nameSplit.length > 1 ? nameSplit[1].trim() : 'Unknown Channel';
                } 
                else if (line.startsWith('http')) {
                    currentChannel.url = line;
                    
                    // Grouping logic: Clean region and server tags
                    let cleanedName = currentChannel.name.replace(/\s*[-_\[(]+(bd|in|vip|sd|hd|hq|digital|clean)[\])]*\s*$/i, '').trim();
                    cleanedName = cleanedName.replace(/\s*[-_\[(]+(server\s*)?\d+[\])]*\s*$/i, '').trim();
                    
                    const key = cleanedName.toLowerCase();
                    
                    if (!channelsMap[key]) {
                        channelsMap[key] = {
                            id: getStableId(cleanedName),
                            name: cleanedName,
                            logo: currentChannel.logo,
                            group: currentChannel.group,
                            urls: []
                        };
                    }
                    
                    // Add URL if not already present
                    if (!channelsMap[key].urls.includes(currentChannel.url)) {
                        channelsMap[key].urls.push(currentChannel.url);
                    }
                    
                    // Preserve logo if new entry has one and map doesn't
                    if (currentChannel.logo && !channelsMap[key].logo) {
                        channelsMap[key].logo = currentChannel.logo;
                    }
                    
                    currentChannel = { name: '', logo: '', url: '', group: '' }; 
                }
            }
        }
        
        allChannelsData = Object.values(channelsMap);
        document.getElementById('loader').style.display = 'none';
        renderChannels(allChannelsData);
        renderFavorites();

    } catch (error) {
        console.error('Error fetching playlist:', error);
        document.getElementById('loader').innerHTML = `<p class="text-danger">Failed to load channels. Check CORS or URL.</p>`;
        sidebarChannelsList.innerHTML = '<div class="text-center p-4 text-danger small">Failed to load channels.</div>';
    }
}

function initPlaylistSelector() {
    const menu = document.getElementById('playlist-menu');
    const sidebarMenu = document.getElementById('sidebar-playlist-menu');
    const serverNameDisplay = document.getElementById('current-server-name');
    const sidebarServerNameDisplay = document.getElementById('sidebar-current-server-name');
    
    const menuHTML = PLAYLISTS.map((playlist, index) => `
        <li><a class="dropdown-item ${index === 0 ? 'active' : ''}" href="#" onclick="changeServer(event, ${index})">
            <i class="bi bi-hdd-network me-2"></i> ${playlist.name}
        </a></li>
    `).join('');

    menu.innerHTML = menuHTML;
    if (sidebarMenu) sidebarMenu.innerHTML = menuHTML;

    window.changeServer = (event, index) => {
        event.preventDefault();
        event.stopPropagation();
        currentPlaylistIndex = index;
        playbackMode = 'server';
        currentFavIndex = -1;
        updatePlaybackModeUI();
        const selected = PLAYLISTS[index];
        
        // Remember if sidebar was open (fullscreen mode)
        const sidebarWasOpen = sidebar.classList.contains('open');
        
        // Close Bootstrap dropdowns programmatically
        document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(toggle => {
            const dp = bootstrap.Dropdown.getInstance(toggle);
            if (dp) dp.hide();
        });

        // Update UI
        serverNameDisplay.textContent = selected.name;
        if (sidebarServerNameDisplay) sidebarServerNameDisplay.textContent = selected.name;
        
        document.querySelectorAll('#playlist-menu .dropdown-item, #sidebar-playlist-menu .dropdown-item').forEach((el, i) => {
            if (el.textContent.trim() === selected.name) el.classList.add('active');
            else el.classList.remove('active');
        });

        // Clear search and fetch
        searchInput.value = '';
        sidebarSearchInput.value = '';
        fetchAndParseM3U(selected.url).then(() => {
            // Re-ensure sidebar stays open after channels reload
            if (sidebarWasOpen) {
                sidebar.classList.add('open');
                sidebarToggleBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
                
                // Highlight the active channel or first channel after server change
                const visibleItems = getVisibleSidebarItems();
                const activeItemIndex = visibleItems.findIndex(item => item.classList.contains('active'));
                if (activeItemIndex !== -1) {
                    highlightSidebarItem(activeItemIndex);
                } else if (visibleItems.length > 0) {
                    highlightSidebarItem(0);
                }
            }
        });
    };
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initPlaylistSelector();
    fetchAndParseM3U(PLAYLISTS[0].url);
    startWidgetClock();
    
    // Set default volume
    video.volume = 0.3;
    
    // Enable horizontal scroll with mouse wheel for Favorites
    const favoritesRow = document.getElementById('favorites-row');
    favoritesRow.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            const canScrollRight = favoritesRow.scrollLeft < (favoritesRow.scrollWidth - favoritesRow.clientWidth - 1);
            const canScrollLeft = favoritesRow.scrollLeft > 0;

            if ((evt.deltaY > 0 && canScrollRight) || (evt.deltaY < 0 && canScrollLeft)) {
                evt.preventDefault();
                favoritesRow.scrollLeft += evt.deltaY;
            }
        }
    }, { passive: false });

    // Enable horizontal drag-to-scroll for Favorites row
    let isDown = false;
    let startX;
    let scrollLeft;
    let hasMoved = false;

    favoritesRow.addEventListener('mousedown', (e) => {
        isDown = true;
        hasMoved = false;
        favoritesRow.classList.add('dragging');
        startX = e.pageX - favoritesRow.offsetLeft;
        scrollLeft = favoritesRow.scrollLeft;
    });

    favoritesRow.addEventListener('mouseleave', () => {
        isDown = false;
        favoritesRow.classList.remove('dragging');
    });

    favoritesRow.addEventListener('mouseup', () => {
        isDown = false;
        favoritesRow.classList.remove('dragging');
    });

    favoritesRow.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - favoritesRow.offsetLeft;
        const walk = (x - startX) * 2; // scroll speed multiplier
        if (Math.abs(walk) > 5) {
            hasMoved = true;
        }
        favoritesRow.scrollLeft = scrollLeft - walk;
    });

    // Prevent trigger click on drag scroll release
    favoritesRow.addEventListener('click', (e) => {
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // Auto-close open dropdowns when clicking outside or opening another dropdown
    document.addEventListener('click', (e) => {
        const target = e.target;
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        
        openDropdowns.forEach(menu => {
            const dropdownContainer = menu.closest('.dropdown');
            const toggle = dropdownContainer?.querySelector('[data-bs-toggle="dropdown"]');
            
            // Check if settings dropdown with auto-close outside (allow click inside settings menu)
            if (toggle && toggle.id === 'settingsDropdown' && menu.contains(target)) {
                return;
            }
            
            // Close if clicking outside the dropdown container
            if (dropdownContainer && !dropdownContainer.contains(target)) {
                if (toggle && typeof bootstrap !== 'undefined') {
                    const dp = bootstrap.Dropdown.getInstance(toggle);
                    if (dp) dp.hide();
                }
            }
        });
    });

    // Programmatically close other dropdowns when a dropdown is toggled open
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(otherBtn => {
                if (otherBtn !== btn) {
                    const inst = bootstrap.Dropdown.getInstance(otherBtn);
                    if (inst) inst.hide();
                }
            });
        });
    });

    // PI-P Scroll Logic
    const stickyWrapper = document.getElementById('sticky-player-wrapper');
    
    window.addEventListener('scroll', () => {
        // Only trigger PiP if video is actually playing/visible AND not in fullscreen
        if (videoContainer.style.display === 'block' && !document.fullscreenElement && !document.webkitFullscreenElement) {
            // Trigger when the player is mostly scrolled out of view
            if (window.scrollY > 450) {
                videoContainer.classList.add('pip-mode');
                stickyWrapper.classList.add('pip-active');
            } else {
                videoContainer.classList.remove('pip-mode');
                stickyWrapper.classList.remove('pip-active');
            }
        }
    });
});

// --- HLS Quality Selector Functions ---
function updateQualityMenu() {
    const qualityMenu = document.getElementById('quality-menu');
    const container = document.getElementById('quality-selector-container');
    if (!qualityMenu || !container) return;

    if (!hlsInstance || !hlsInstance.levels || hlsInstance.levels.length <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'inline-block';

    const levels = hlsInstance.levels;
    let html = `<li><a class="dropdown-item ${hlsInstance.loadLevel === -1 ? 'active' : ''}" href="#" onclick="changeQuality(event, -1)">Auto Quality</a></li>`;
    
    levels.forEach((level, index) => {
        let name = level.name;
        if (!name) {
            if (level.height) {
                name = `${level.height}p`;
            } else if (level.bitrate) {
                name = `${Math.round(level.bitrate / 1000)}kbps`;
            } else {
                name = `Level ${index + 1}`;
            }
        }
        
        html += `<li><a class="dropdown-item ${hlsInstance.loadLevel === index ? 'active' : ''}" id="quality-item-${index}" href="#" onclick="changeQuality(event, ${index})">${name}</a></li>`;
    });

    qualityMenu.innerHTML = html;
}

window.changeQuality = function (event, index) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!hlsInstance) return;

    hlsInstance.currentLevel = index;
    hlsInstance.loadLevel = index;

    const qualityMenu = document.getElementById('quality-menu');
    if (qualityMenu) {
        qualityMenu.querySelectorAll('.dropdown-item').forEach((item, i) => {
            const isAuto = i === 0;
            const targetIdx = isAuto ? -1 : i - 1;
            if (targetIdx === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Close the dropdown menu manually after click
    const dropdownToggle = document.getElementById('qualityBtn');
    if (dropdownToggle && typeof bootstrap !== 'undefined') {
        const dp = bootstrap.Dropdown.getInstance(dropdownToggle);
        if (dp) dp.hide();
    }
};
