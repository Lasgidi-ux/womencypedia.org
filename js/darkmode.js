/**
 * Womencypedia — Dark Mode Toggle
 * 
 * Persists preference in localStorage. Respects OS preference on first visit.
 * Adds a toggle button to the navbar next to the language switcher.
 */

const DarkMode = {
    STORAGE_KEY: 'womencypedia_theme',

    init() {
        // Check stored preference, then OS preference
        const stored = localStorage.getItem(this.STORAGE_KEY);

        if (stored === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (stored === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // First visit: respect OS preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            }
        }

        // Render toggle button
        this.renderToggle();

        // Listen for OS theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                document.documentElement.classList.toggle('dark', e.matches);
            }
        });
    },

    toggle() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
        this.updateIcon();
    },

    updateIcon() {
        const icons = document.querySelectorAll('.dark-mode-icon');
        const isDark = document.documentElement.classList.contains('dark');
        icons.forEach(icon => {
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        });
    },

    renderToggle() {
        // Insert toggle next to language switcher or in navbar actions
        const containers = document.querySelectorAll('#dark-mode-toggle, .dark-mode-toggle-container');

        if (containers.length === 0) {
            // Auto-insert into navbar actions area
            const navActions = document.querySelector('.navbar .flex.items-center.gap-3');
            if (navActions) {
                const btn = document.createElement('button');
                btn.className = 'dark-mode-toggle size-10 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors';
                btn.setAttribute('aria-label', 'Toggle dark mode');
                btn.onclick = () => DarkMode.toggle();
                const isDark = document.documentElement.classList.contains('dark');
                btn.innerHTML = `<span class="material-symbols-outlined dark-mode-icon text-[20px]">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
                navActions.insertBefore(btn, navActions.firstChild);
            }
            return;
        }

        containers.forEach(container => {
            const isDark = document.documentElement.classList.contains('dark');
            container.innerHTML = `
                <button onclick="DarkMode.toggle()" 
                    class="dark-mode-toggle size-10 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
                    aria-label="Toggle dark mode">
                    <span class="material-symbols-outlined dark-mode-icon text-[20px]">${isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>
            `;
        });
    }
};

// Initialize BEFORE DOMContentLoaded to prevent flash
(function () {
    const stored = localStorage.getItem('womencypedia_theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
});
