document.addEventListener('DOMContentLoaded', function () {
            const mapContainer = document.getElementById('global-map');
            if (!mapContainer) return;

            // Security: helper function to escape HTML inside popups
            function escapeHTML(str) {
                if (!str) return '';
                return String(str).replace(/[&<>'"]/g,
                    tag => ({
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        "'": '&#39;',
                        '"': '&quot;'
                    }[tag] || tag)
                );
            }

            // Guard: check if Leaflet loaded
            if (typeof L === 'undefined') {
                console.warn('Leaflet not loaded — map disabled (check network)');
                mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#5A5454;font-size:14px;">Map unavailable offline</div>';
                return;
            }

            // Initialize map centered on the world
            const map = L.map('global-map').setView([20, 0], 2);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(map);

            // Define region coordinates and biography counts
            const regions = {
                africa: { lat: 1.5, lng: 20, count: 1200, zoom: 3 },
                asia: { lat: 30, lng: 100, count: 850, zoom: 3 },
                europe: { lat: 50, lng: 10, count: 980, zoom: 4 },
                'middle-east': { lat: 30, lng: 45, count: 620, zoom: 5 },
                'north-america': { lat: 40, lng: -100, count: 720, zoom: 3 },
                'south-america': { lat: -15, lng: -60, count: 480, zoom: 3 },
                oceania: { lat: -25, lng: 135, count: 320, zoom: 4 },
                antarctica: { lat: -80, lng: 0, count: 45, zoom: 3 }
            };

            // Add markers for each region
            Object.entries(regions).forEach(([region, data]) => {
                const marker = L.marker([data.lat, data.lng]).addTo(map);

                const escapedRegion = escapeHTML(region.replace('-', ' '));
                marker.bindPopup(`
                    <div class="text-center">
                        <h4 class="font-serif font-bold text-text-main mb-2 capitalize">${escapedRegion}</h4>
                        <p class="text-sm text-text-secondary mb-3">${escapeHTML(data.count)} biographies</p>
                        <a href="browse.html?region=${encodeURIComponent(region)}" class="inline-block px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary-hover transition-colors">
                            Explore ${escapedRegion}
                        </a>
                    </div>
                `);
            });

            // Add zoom controls
            document.getElementById('zoom-africa')?.addEventListener('click', () => {
                map.setView([regions.africa.lat, regions.africa.lng], regions.africa.zoom);
            });

            document.getElementById('zoom-asia')?.addEventListener('click', () => {
                map.setView([regions.asia.lat, regions.asia.lng], regions.asia.zoom);
            });

            document.getElementById('zoom-europe')?.addEventListener('click', () => {
                map.setView([regions.europe.lat, regions.europe.lng], regions.europe.zoom);
            });

            document.getElementById('reset-view')?.addEventListener('click', () => {
                map.setView([20, 0], 2);
            });

            // Add some sample biography markers (only if biographies data is available)
            if (typeof biographies !== 'undefined' && Array.isArray(biographies)) {
                biographies.forEach(bio => {
                    if (bio.region === 'Africa') {
                        const marker = L.circleMarker([1.5 + (Math.random() - 0.5) * 10, 20 + (Math.random() - 0.5) * 20], {
                            color: '#D67D7D',
                            fillColor: '#D67D7D',
                            fillOpacity: 0.6,
                            radius: 6
                        }).addTo(map);

                        marker.bindPopup(`
                        <div class="max-w-xs">
                            <h4 class="font-serif font-bold text-text-main mb-1">${escapeHTML(bio.name)}</h4>
                            <p class="text-xs text-text-secondary mb-2">${escapeHTML(bio.era)} • ${escapeHTML(bio.region)}</p>
                            <p class="text-sm text-text-secondary mb-3">${escapeHTML(bio.introduction.substring(0, 100))}...</p>
                            <a href="biography.html?id=${escapeHTML(bio.id)}" class="inline-block px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary-hover transition-colors"><span data-i18n="readBiography">Read Biography</span></a>
                        </div>
                    `);
                    }
                });
            }
        });