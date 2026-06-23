# GENOIN - Live TV IPTV Streaming Player

GENOIN is a next-generation, premium IPTV streaming player built with a modern, high-performance interface. Featuring a sleek Google TV-inspired dark theme, dynamic Picture-in-Picture (PiP) scroll behavior, automatic stream failovers, and robust keyboard navigation, it offers a complete television streaming hub right in your browser.

---

## 📁 Project Directory Structure

The project has been refactored into a clean, modular structure for easier maintenance and optimization:

```text
├── css/
│   └── styles.css          # Glassmorphism theme, animations, grid, and layout CSS
├── js/
│   ├── config.js           # Server playlists, global state variables, and logo utilities
│   ├── favorites.js        # LocalStorage favorites manager and UI sync logic
│   ├── sidebar.js          # Sidebar channel navigation drawer and search filter logic
│   └── player.js           # HLS player, controls, failover routing, and hotkeys
├── images/                 # Asset folder for logo resources and cover banners
├── playlist/               # Playlists resource directory
├── index.html              # Main application markup page
└── README.md               # Project documentation
```

---

## 🚀 Key Features

### 1. Modern Glassmorphism & Parallax Interface
* **Premium Theme**: Curated colors (`#0f1014` dark backing) and custom typography (Google Fonts Outfit, Roboto, and Orbitron).
* **Smooth Animations**: Pulse effects, shifting text glows, and micro-interactions on hover/select states.
* **Cinematic Backdrop**: Parallax image scroll that dynamically fades away into the video screen on playback.

### 2. Stream Playback & HLS Integration
* Powered by [Hls.js](https://github.com/video-dev/hls.js/) for smooth live HTTP Live Streaming (`.m3u8`) playback in standard modern browsers.
* Native HTML5 playback fallback for Safari and compatible mobile browsers.

### 3. Smart Failover & Server Selector
* If a channel is listed with multiple alternate URLs, the player automatically groups them and presents **Server Toggle Pills** on-screen.
* **Auto Failover**: If a stream link goes offline or fails to connect within **7.5 seconds**, the player automatically falls back and tests the next server URL in line without interrupting your search flow.

### 4. Automatic Picture-in-Picture (PiP) Mode
* When a stream is active, scrolling down the page causes the player to transition into a floating Picture-in-Picture widget in the bottom-right corner.
* The mini-player retains simplified navigation controls, volume slide, and clock layouts, and docks back cleanly when you scroll back to the top.

### 5. Multi-Server Playlists
* Includes out-of-the-box servers:
  1. *Genoin Server*
  2. *FIFA NEW*
  3. *FIFA 26*
  4. *NEW*
* Choose playlists using the server dropdown selector on the top-right navbar or sidebar drawer.

### 6. Interactive Favorites Row
* Save favorite channels using the heart icon on any channel card.
* Saved items are stored locally using browser `localStorage`.
* An auto-updating favorites row is featured at the top of your catalog page, with support for mouse-wheel horizontal scrolling.

### 7. Full Keyboard Navigation
A complete set of keyboard shortcuts are available when the player is running:

| Key Binding | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `ArrowUp` | Increase Volume by 5% (or navigate up in the sidebar) |
| `ArrowDown` | Decrease Volume by 5% (or navigate down in the sidebar) |
| `ArrowRight` / `N` | Play Next Channel |
| `ArrowLeft` / `P` | Play Previous Channel |
| `Enter` | Select & Play highlighted sidebar channel |
| `F` | Toggle Fullscreen |
| `M` | Mute / Unmute Volume |
| `L` | Toggle Sidebar Drawer (Fullscreen only) |
| `S` | Focus Search box |
| `0` - `9` | Set Volume level increments (0% to 90%) |
| `Escape` | Close sidebar drawer / Exit fullscreen |

---

## 🛠️ Technology Stack

1. **HTML5**: Structured semantic interface.
2. **CSS3**: Vanilla layout utilizing HSL design palettes, responsive media query breakpoints, and hardware-accelerated animations.
3. **Bootstrap 5.3**: Layout grids, dropdown modals, and Bootstrap Icons.
4. **JavaScript (ES6)**: Vanilla script operations (split into modular, organized files).
5. **Hls.js**: Streaming player parser engine library.

---

## 🚀 How to Run Locally

Because the project is built using native web modules and dependencies, you can launch it with simple local hosting.

### Option A: VS Code Live Server (Recommended)
1. Open the project folder in VS Code.
2. Click **Go Live** at the bottom-right status bar.
3. The page will launch automatically at `http://127.0.0.1:5500/`.

### Option B: Local Python HTTP Server
1. Open your terminal in the project directory.
2. Run the following command:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your web browser.

---

## ✍️ Authors & Credits

* **Saidur Rahman** - *Lead Design & Developer*
* Core icons provided by **Bootstrap Icons** & typography by **Google Fonts**.
