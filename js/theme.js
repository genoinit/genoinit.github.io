// Theme management for GENOIN Player
(function () {
    const THEME_KEY = 'genoin_theme';
    const DEFAULT_THEME = 'default';

    // Apply the theme to the body element
    function applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem(THEME_KEY, themeName);
        updateThemeUI(themeName);
    }

    // Update active state in UI dropdowns & footer selector
    function updateThemeUI(themeName) {
        const themeLabels = {
            'default': 'Default (Blue)',
            'orange-black': 'Neon Orange',
            'purple': 'Midnight Purple',
            'emerald': 'Emerald Mint',
            'cyberpunk': 'Cyberpunk Crimson',
            'sunset': 'Sunset Gold',
            'aurora': 'Aurora Borealis',
            'sakura': 'Electric Sakura',
            'solar': 'Solar Flare'
        };

        const themeNameElements = [
            document.getElementById('current-theme-name'),
            document.getElementById('sidebar-current-theme-name')
        ];

        themeNameElements.forEach(el => {
            if (el) el.textContent = themeLabels[themeName] || 'Default';
        });

        // Update active class in dropdown menus (quote-agnostic check)
        const selectMenuClasses = (menuId) => {
            const menu = document.getElementById(menuId);
            if (!menu) return;
            menu.querySelectorAll('.dropdown-item').forEach(item => {
                const onclickAttr = item.getAttribute('onclick') || '';
                if (onclickAttr.includes(themeName)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        selectMenuClasses('theme-menu');
        selectMenuClasses('sidebar-theme-menu');

        // Update active class in footer quick selector buttons (quote-agnostic check)
        const footerMenu = document.getElementById('footer-theme-selector');
        if (footerMenu) {
            footerMenu.querySelectorAll('button').forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick') || '';
                if (onclickAttr.includes(themeName)) {
                    btn.classList.add('active');
                    btn.style.background = 'var(--accent-primary)';
                    btn.style.color = '#ffffff';
                    btn.style.boxShadow = '0 0 12px var(--glow-color)';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'transparent';
                    btn.style.color = 'rgba(255, 255, 255, 0.6)';
                    btn.style.boxShadow = 'none';
                }
            });
        }
    }

    // Expose global change theme helper
    window.changeTheme = function (event, themeName) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        applyTheme(themeName);
    };

    // Initialize theme on script load
    const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', savedTheme);

    document.addEventListener('DOMContentLoaded', () => {
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeUI(savedTheme);
    });
})();
