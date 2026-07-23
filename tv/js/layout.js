// Layout management for GENOIN Player
(function () {
    const LAYOUT_KEY = 'genoin_layout';
    const DEFAULT_LAYOUT = 'classical';

    // Apply the layout to the body element
    function applyLayout(layoutName) {
        document.documentElement.setAttribute('data-layout', layoutName);
        document.body.setAttribute('data-layout', layoutName);
        localStorage.setItem(LAYOUT_KEY, layoutName);
        updateLayoutUI(layoutName);

        // Toggle drawer based on layout name
        const sidebar = document.getElementById('fullscreen-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (layoutName === 'cinema-mode') {
            if (sidebar) {
                sidebar.classList.add('open');
                if (toggleBtn) toggleBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
            }
        } else {
            if (sidebar) {
                sidebar.classList.remove('open');
                if (toggleBtn) toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            }
        }

        // Adjust window layout trigger events if needed
        window.dispatchEvent(new Event('resize'));
    }

    // Update active state in UI dropdowns
    function updateLayoutUI(layoutName) {
        const layoutLabels = {
            'classical': 'Classical Grid',
            'dashboard-sidebar': 'Dashboard Sidebar',
            'cinema-mode': 'Cinema Mode'
        };

        // Update active class in menu
        const menu = document.getElementById('layout-menu');
        if (menu) {
            menu.querySelectorAll('.dropdown-item').forEach(item => {
                const onclickAttr = item.getAttribute('onclick') || '';
                if (onclickAttr.includes(layoutName)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    // Expose global change layout helper
    window.changeLayout = function (event, layoutName) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        applyLayout(layoutName);
    };

    // Initialize layout on DOM load
    const savedLayout = localStorage.getItem(LAYOUT_KEY) || DEFAULT_LAYOUT;
    document.documentElement.setAttribute('data-layout', savedLayout);
    
    document.addEventListener('DOMContentLoaded', () => {
        document.body.setAttribute('data-layout', savedLayout);
        updateLayoutUI(savedLayout);

        // Auto-open drawer if page initialized in cinema mode
        if (savedLayout === 'cinema-mode') {
            const sidebar = document.getElementById('fullscreen-sidebar');
            const toggleBtn = document.getElementById('sidebar-toggle-btn');
            if (sidebar) {
                sidebar.classList.add('open');
                if (toggleBtn) toggleBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
            }
        }
    });
})();
