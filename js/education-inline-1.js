// Fallback static education modules
        const fallbackModules = [
            {
                slug: 'introduction-interpretive-biography',
                title: 'Introduction to Interpretive Biography',
                description: 'Learn the foundational principles of writing interpretive biographies that go beyond facts to reveal the symbolic significance of women\'s lives.',
                duration: '4 Hours',
                lessons: 12,
                moduleNumber: 1,
                icon: 'school',
                color: 'primary'
            },
            {
                slug: 'research-methods-womens-history',
                title: 'Research Methods for Women\'s History',
                description: 'Master the techniques for researching women\'s stories across archives, oral traditions, and secondary sources.',
                duration: '5 Hours',
                lessons: 15,
                moduleNumber: 2,
                icon: 'auto_stories',
                color: 'accent-teal'
            },
            {
                slug: 'cultural-context-grounding',
                title: 'Cultural Context & Grounding',
                description: 'Learn to interpret women\'s lives within their own cultural frameworks, avoiding Western-centric assumptions.',
                duration: '6 Hours',
                lessons: 18,
                moduleNumber: 3,
                icon: 'public',
                color: 'accent-gold'
            },
            {
                slug: 'ethical-storytelling-practices',
                title: 'Ethical Storytelling Practices',
                description: 'Understand trauma-informed approaches, cultural sensitivity, and ethical considerations in biographical writing.',
                duration: '4 Hours',
                lessons: 12,
                moduleNumber: 4,
                icon: 'psychology',
                color: 'primary'
            },
            {
                slug: 'analyzing-symbolic-power',
                title: 'Analyzing Symbolic Power',
                description: 'Develop skills to identify and interpret the symbolic power of women across different historical and cultural contexts.',
                duration: '5 Hours',
                lessons: 14,
                moduleNumber: 5,
                icon: 'lightbulb',
                color: 'primary'
            },
            {
                slug: 'comparative-biography-analysis',
                title: 'Comparative Biography Analysis',
                description: 'Learn to compare and contrast women\'s lives across regions, eras, and cultural contexts to reveal broader patterns.',
                duration: '6 Hours',
                lessons: 16,
                moduleNumber: 6,
                icon: 'compare_arrows',
                color: 'accent-gold'
            },
            {
                slug: 'writing-interpretive-biography',
                title: 'Writing Interpretive Biography',
                description: 'Put everything together and learn to write compelling interpretive biographies with cultural grounding.',
                duration: '5 Hours',
                lessons: 15,
                moduleNumber: 7,
                icon: 'edit_note',
                color: 'primary'
            }
        ];

        // HTML escape helper for XSS prevention
        function escapeHtml(text) {
            if (text == null) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Render module card
        function renderModuleCard(module, index) {
            const colors = {
                'primary': { bg: 'bg-primary/10', text: 'text-primary', btn: 'bg-primary/10 text-primary hover:bg-primary/20' },
                'accent-teal': { bg: 'bg-accent-teal/10', text: 'text-accent-teal', btn: 'bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20' },
                'accent-gold': { bg: 'bg-accent-gold/10', text: 'text-accent-gold', btn: 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20' }
            };
            const c = colors[module.color] || colors['primary'];

            const moduleNumber = module.moduleNumber || (index + 1);
            const title = escapeHtml(module.title || '');
            const description = escapeHtml(module.description || '');
            const duration = escapeHtml(module.duration || '4 Hours');
            const lessons = module.lessons || 12;
            const icon = escapeHtml(module.icon || 'school');
            const slug = encodeURIComponent(module.slug || '');

            return `
                <div class="bg-white rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-lg transition-all">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="size-12 rounded-full ${c.bg} flex items-center justify-center">
                            <span class="material-symbols-outlined ${c.text} text-2xl">${icon}</span>
                        </div>
                        <span class="${c.text} text-xs font-bold uppercase tracking-wider">Module ${moduleNumber}</span>
                    </div>
                    <h3 class="font-serif text-xl font-bold text-text-main mb-3" data-i18n="education.moduletitle">${title}</h3>
                    <p class="text-text-secondary text-sm leading-relaxed mb-4">${description}</p>
                    <div class="flex items-center justify-between text-sm text-text-secondary mb-4">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">schedule</span> ${duration}
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">auto_stories</span> ${lessons} Lessons
                        </span>
                    </div>
                    <a href="education-module-${moduleNumber}.html?slug=${slug}"
                        class="inline-flex items-center justify-center h-10 px-6 ${c.btn} font-bold rounded-lg transition-colors gap-2 w-full">
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        View Module
                    </a>
                </div>
            `;
        }

        // Render modules from API data
        function renderModules(modules) {
            const grid = document.getElementById('modules-grid');
            if (!grid) return;

            grid.innerHTML = modules.map((module, index) => renderModuleCard(module, index)).join('');

            // Hide loading, show grid
            document.getElementById('modules-loading').classList.add('hidden');
            grid.classList.remove('hidden');
        }

        // Show fallback static modules
        function showFallbackModules() {
            const fallback = document.getElementById('modules-fallback');
            if (!fallback) return;

            // Hide loading, show fallback
            document.getElementById('modules-loading').classList.add('hidden');
            fallback.classList.remove('hidden');
        }

        // Load education modules from Strapi API
        async function loadEducationModules() {
            try {
                // Try Strapi API first
                if (typeof StrapiAPI !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await StrapiAPI.educationModules.getAll();
                    if (response && response.entries && response.entries.length > 0) {
                        renderModules(response.entries);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Strapi API not available, using fallback:', error.message);
            }

            // If API fails, use fallback
            showFallbackModules();
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function () {
            loadEducationModules();
        });