const PLAYLISTS = [
    { name: 'Genoin Server', url: 'https://raw.githubusercontent.com/genoinit/genoinit.github.io/refs/heads/main/playlist/genoin.m3u' },		
    { name: 'FIFA', url: 'https://raw.githubusercontent.com/genoinit/genoinit.github.io/refs/heads/main/playlist/fifa.m3u' },
];

let hlsInstance = null;
let allChannelsData = [];
let currentChannelIndex = -1;
let favoritesData = JSON.parse(localStorage.getItem('genoin_favorites_v3')) || {};
let currentPlaylistIndex = 0;
let playbackMode = 'server'; // 'server' or 'favorites'
let currentFavIndex = -1;
let sidebarHighlightedIndex = -1;
let activeChannel = null;
let activeServerIndex = 0;
let failoverTimer = null;
let controlsTimeout;

// Player DOM Elements
const video = document.getElementById('main-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const videoContainer = document.getElementById('video-container');
const videoLoader = document.getElementById('video-loader');
const loadingSpinner = document.getElementById('loading-spinner');
const loaderText = document.getElementById('loader-text');

// Sidebar Elements
const sidebar = document.getElementById('fullscreen-sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarChannelsList = document.getElementById('sidebar-channels-list');
const sidebarSearchInput = document.getElementById('sidebar-search-input');

// UI Elements
const heroBg = document.getElementById('hero-bg');
const heroContent = document.getElementById('hero-content');
const playingTitle = document.getElementById('playing-title');
const playingLogo = document.getElementById('playing-logo');
const searchInput = document.getElementById('channel-search');

// --- Letter Logo Generator ---
const LOGO_COLORS = [
    '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
    '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
    '#00897B', '#43A047', '#7CB342', '#C0CA33',
    '#F4511E', '#6D4C41', '#546E7A', '#FF7043',
    '#AB47BC', '#29B6F6'
];

function getLogoColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function generateLetterLogo(name) {
    const word = (name || '?').trim().split(/\s+/)[0];
    const bg = getLogoColor(name || 'X');
    // Scale font size based on word length to fit within 150px width
    let fontSize = 36;
    if (word.length >= 8) fontSize = 18;
    else if (word.length >= 6) fontSize = 22;
    else if (word.length >= 4) fontSize = 28;
    else if (word.length >= 2) fontSize = 32;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="80" viewBox="0 0 150 80">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${bg};stop-opacity:1"/>
                <stop offset="100%" style="stop-color:${bg};stop-opacity:0.7"/>
            </linearGradient>
        </defs>
        <rect width="150" height="80" rx="8" fill="url(#g)"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
              font-family="Roboto,sans-serif" font-weight="700" font-size="${fontSize}"
              fill="white" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${word}</text>
    </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function handleLogoError(img, channelName) {
    img.onerror = null;
    img.src = generateLetterLogo(channelName);
}
