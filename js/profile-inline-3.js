// Handle hash-based navigation (e.g., profile.html#settings)
        document.addEventListener('DOMContentLoaded', function () {
            // Check for hash in URL and switch to that tab
            const hash = window.location.hash.replace('#', '');
            if (hash && hash === 'settings') {
                // Use setTimeout to ensure DOM is fully loaded
                setTimeout(function () {
                    if (typeof showTab === 'function') {
                        showTab('settings');
                    }
                }, 100);
            }
        });