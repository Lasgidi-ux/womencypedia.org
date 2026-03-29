// Mock leader data
        const mockLeader = {
            id: 1,
            name: "Dr. Amina Mohammed",
            organizationName: "African Women in Agriculture",
            country: "Nigeria",
            continent: "Africa",
            sector: "Non-Profit",
            organizationType: "NGO",
            foundingYear: 2015,
            verified: true,
            verifiedDate: "2024-01-15",
            executiveSummary: "Empowering women farmers across Africa through sustainable agriculture programs and policy advocacy.",
            institutionalOverview: "African Women in Agriculture (AWA) is a pan-African non-profit organization dedicated to empowering women farmers across the continent. Founded in 2015, we work with local communities to implement sustainable agriculture programs, provide training and resources, and advocate for policies that support women in agriculture.",
            missionStatement: "To empower women farmers in Africa through sustainable agriculture, economic independence, and policy advocacy.",
            visionStatement: "A Africa where women farmers are recognized as key drivers of food security and economic development.",
            leadershipStructure: "AWA is governed by a Board of Directors composed of 9 members, 7 of whom are women. The organization has a leadership team of 5 senior managers, all women, who oversee programs across 15 African countries. Decision-making is decentralized to regional hubs, empowering local women leaders.",
            impactMetrics: {
                employees: 245,
                womenInLeadership: 85,
                beneficiaries: 125000,
                annualBudget: 2500000
            },
            website: "https://example.org",
            email: "info@awa-africa.org"
        };

        let currentLeader = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            loadLeader();
        });

        async function loadLeader() {
            const urlParams = new URLSearchParams(window.location.search);
            const leaderId = urlParams.get('id');

            try {
                // Try to fetch from API
                if (typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/leaders/${leaderId}?populate=*`);
                    if (response.ok) {
                        const data = await response.json();
                        currentLeader = data.data;
                    } else {
                        throw new Error('API not available');
                    }
                } else {
                    // Use mock data
                    currentLeader = mockLeader;
                }
            } catch (error) {
                console.log('Using mock data');
                currentLeader = mockLeader;
            }

            renderLeader();
        }

        function renderLeader() {
            if (!currentLeader) return;

            // Update page title
            document.title = `${currentLeader.organizationName} — Womencypedia Registry`;

            // Breadcrumb
            document.getElementById('breadcrumb-org').textContent = currentLeader.organizationName;

            // Hero section
            document.getElementById('org-name').textContent = currentLeader.organizationName;
            document.getElementById('org-summary').textContent = currentLeader.executiveSummary;
            document.getElementById('org-country').textContent = currentLeader.country;
            document.getElementById('org-sector').textContent = currentLeader.sector;
            document.getElementById('org-type').textContent = currentLeader.organizationType;

            // Verified date
            if (currentLeader.verifiedDate) {
                const date = new Date(currentLeader.verifiedDate);
                document.getElementById('verified-date').textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Website link
            if (currentLeader.website) {
                document.getElementById('org-website').href = currentLeader.website;
                document.getElementById('contact-website').href = currentLeader.website;
                document.getElementById('contact-website').querySelector('span:last-child').textContent = new URL(currentLeader.website).hostname;
            }

            // Contact
            if (currentLeader.email) {
                document.getElementById('contact-email').href = `mailto:${currentLeader.email}`;
                document.getElementById('contact-email').querySelector('span:last-child').textContent = currentLeader.email;
            }

            // Overview tab
            document.getElementById('org-overview').innerHTML = `<p>${currentLeader.institutionalOverview}</p>`;
            document.getElementById('org-mission').textContent = currentLeader.missionStatement || 'Mission statement pending.';
            document.getElementById('org-vision').textContent = currentLeader.visionStatement || 'Vision statement pending.';

            // Governance tab
            document.getElementById('org-governance').innerHTML = `<p>${currentLeader.leadershipStructure}</p>`;
            document.getElementById('leadership-count').textContent = currentLeader.impactMetrics?.employees || 'N/A';
            document.getElementById('women-percent').textContent = (currentLeader.impactMetrics?.womenInLeadership || 0) + '%';

            // Impact tab
            const metrics = currentLeader.impactMetrics || {};
            document.getElementById('metric-employees').textContent = metrics.employees || 'N/A';
            document.getElementById('metric-beneficiaries').textContent = metrics.beneficiaries ?
                (metrics.beneficiaries >= 1000 ? (metrics.beneficiaries / 1000).toFixed(0) + 'K' : metrics.beneficiaries) : 'N/A';
            document.getElementById('metric-budget').textContent = metrics.annualBudget ?
                ('$' + (metrics.annualBudget >= 1000000 ? (metrics.annualBudget / 1000000).toFixed(1) + 'M' : (metrics.annualBudget / 1000).toFixed(0) + 'K')) : 'N/A';
            document.getElementById('metric-year').textContent = currentLeader.foundingYear || 'N/A';

            // Render similar orgs
            renderSimilarOrgs();
        }

        function renderSimilarOrgs() {
            const container = document.getElementById('similar-orgs');
            const similarOrgs = [
                { name: "Women in Tech Africa", country: "Ghana", sector: "Technology" },
                { name: "Female Farmers Network", country: "Kenya", sector: "Agriculture" },
                { name: "Women Entrepreneurs Hub", country: "South Africa", sector: "Private Sector" }
            ];

            container.innerHTML = similarOrgs.map(org => `
                <a href="leader-profile.html?id=${org.id || 1}" class="block p-3 bg-background-cream rounded-lg hover:bg-primary/10 transition-colors">
                    <p class="font-medium text-text-main text-sm">${org.name}</p>
                    <p class="text-xs text-text-secondary">${org.country} • ${org.sector}</p>
                </a>
            `).join('');
        }

        // Tab switching
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                const isActive = btn.dataset.tab === tabName;
                btn.classList.toggle('border-primary', isActive);
                btn.classList.toggle('text-primary', isActive);
                btn.classList.toggle('border-transparent', !isActive);
                btn.classList.toggle('text-text-secondary', !isActive);
            });

            // Show/hide content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`tab-${tabName}`).classList.remove('hidden');
        }