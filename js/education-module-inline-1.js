document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        showError();
        return;
    }

    try {
        const module = await StrapiAPI.educationModules.getBySlug(slug);

        if (!module) {
            showError();
            return;
        }

        renderModule(module);
        await loadModuleNavigation(module);
    } catch (error) {
        console.error('Failed to load education module:', error);
        showError();
    }
});

function renderModule(module) {
    // Update page title
    document.title = `${module.title} — Womencypedia Education`;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && module.description) {
        metaDesc.setAttribute('content', module.description);
    }

    // Hero
    document.getElementById('module-badge').textContent = `MODULE ${module.order || ''}`;
    document.getElementById('module-title').textContent = module.title;
    document.getElementById('module-description').textContent = module.description || '';

    // Cover image
    if (module.coverImage?.url) {
        const heroImg = document.getElementById('module-hero-image');
        heroImg.style.backgroundImage = `url(${StrapiAPI.getMediaURL(module.coverImage.url)})`;
        heroImg.style.opacity = '0.3';
    }

    // Meta info
    const metaEl = document.getElementById('module-meta');
    const lessons = module.lessons || [];
    metaEl.innerHTML = `
                <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[18px]">auto_stories</span>
                    ${lessons.length} Lesson${lessons.length !== 1 ? 's' : ''}
                </span>
                <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[18px]">workspace_premium</span>
                    Certificate
                </span>
            `;

    // Level badge
    if (module.level) {
        document.getElementById('module-level').textContent = module.level.toUpperCase();
    }

    // Body content
    const bodyEl = document.getElementById('module-body');
    if (module.content) {
        bodyEl.innerHTML = module.content;
    }

    // Lessons
    if (lessons.length > 0) {
        document.getElementById('lessons-section').classList.remove('hidden');
        const lessonsList = document.getElementById('lessons-list');
        const lessonNav = document.getElementById('lesson-nav');

        lessonsList.innerHTML = lessons.map((lesson, i) => `
                    <div id="lesson-${i + 1}" class="bg-white rounded-xl border border-border-light overflow-hidden">
                        <button onclick="toggleUnit(this)" class="w-full flex items-center justify-between p-6 text-left hover:bg-lavender-soft/10 transition-colors">
                            <div class="flex items-center gap-4">
                                <span class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">${i + 1}</span>
                                <div>
                                    <h3 class="font-serif text-lg font-bold text-text-main" data-i18n="education_module.lessontitleLessonI1">${lesson.title || `Lesson ${i + 1}`}</h3>
                                    ${lesson.duration ? `<p class="text-sm text-text-secondary mt-1">${lesson.duration}</p>` : ''}
                                </div>
                            </div>
                            <span class="material-symbols-outlined text-text-secondary">expand_more</span>
                        </button>
                        <div class="hidden px-6 pb-6 pt-0">
                            <div class="pl-14 prose prose-sm max-w-none text-text-secondary">
                                ${lesson.content || lesson.description || '<p>Lesson content loading from CMS...</p>'}
                            </div>
                        </div>
                    </div>
                `).join('');

        // Lesson nav sidebar
        lessonNav.innerHTML = lessons.map((lesson, i) => `
                    <a href="#lesson-${i + 1}"
                        class="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                        <span class="size-8 rounded-full ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-border-light text-text-secondary'} flex items-center justify-center text-sm font-bold">${i + 1}</span>
                        <span class="text-sm ${i === 0 ? 'text-text-main' : 'text-text-secondary'}">${lesson.title || `Lesson ${i + 1}`}</span>
                    </a>
                `).join('');
    }

    // Quiz
    const quiz = module.quiz;
    if (quiz && Array.isArray(quiz) && quiz.length > 0) {
        document.getElementById('quiz-section').classList.remove('hidden');
        const quizContainer = document.getElementById('quiz-container');

        quizContainer.innerHTML = quiz.map((q, i) => `
                    <div class="bg-white rounded-xl border border-border-light p-6">
                        <h4 class="font-serif text-lg font-bold text-text-main mb-4">${i + 1}. ${q.question}</h4>
                        <div class="space-y-3">
                            ${(q.options || []).map((opt, j) => `
                                <label class="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:border-primary/30 cursor-pointer transition-colors">
                                    <input type="radio" name="quiz-${i}" value="${j}" class="accent-primary">
                                    <span class="text-sm text-text-main">${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
    }

    // Related biographies
    const related = module.relatedBiographies;
    if (related && Array.isArray(related) && related.length > 0) {
        document.getElementById('related-section').classList.remove('hidden');
        const relatedContainer = document.getElementById('related-biographies');

        relatedContainer.innerHTML = related.map(bio => {
            const attrs = bio.attributes || bio;
            const imgUrl = attrs.image?.url ? StrapiAPI.getMediaUrl(attrs.image.url) : null;
            return `
                        <a href="biography.html?slug=${attrs.slug || bio.id}" class="group bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg transition-shadow">
                            <div class="h-40 overflow-hidden bg-primary/5">
                                ${imgUrl ? `<img src="${imgUrl}" alt="${attrs.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` :
                    `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-primary/20">person</span></div>`}
                            </div>
                            <div class="p-4">
                                <h4 class="font-serif font-bold text-text-main group-hover:text-primary transition-colors">${attrs.name || 'Unknown'}</h4>
                                <p class="text-sm text-text-secondary mt-1">${attrs.region || ''} ${attrs.era ? '• ' + attrs.era : ''}</p>
                            </div>
                        </a>
                    `;
        }).join('');
    }

    // Show content, hide loading
    document.getElementById('module-loading').classList.add('hidden');
    document.getElementById('module-content').classList.remove('hidden');
}

async function loadModuleNavigation(currentModule) {
    try {
        const allModules = await StrapiAPI.educationModules.getAll({
            sort: 'order',
            sortOrder: 'asc',
            pageSize: 50
        });

        if (allModules.entries && allModules.entries.length > 1) {
            const currentIndex = allModules.entries.findIndex(m =>
                m.slug === currentModule.slug || m.id === currentModule.id
            );

            const navSection = document.getElementById('module-navigation');
            navSection.classList.remove('hidden');

            if (currentIndex > 0) {
                const prev = allModules.entries[currentIndex - 1];
                const prevLink = document.getElementById('prev-module');
                prevLink.href = `education-module.html?slug=${prev.slug}`;
                prevLink.querySelector('span:last-child').textContent = prev.title;
                prevLink.classList.remove('hidden');
                prevLink.classList.add('flex');
            }

            if (currentIndex < allModules.entries.length - 1) {
                const next = allModules.entries[currentIndex + 1];
                const nextLink = document.getElementById('next-module');
                nextLink.href = `education-module.html?slug=${next.slug}`;
                nextLink.querySelector('span:first-child').textContent = next.title;
                nextLink.classList.remove('hidden');
                nextLink.classList.add('flex');
            }
        }
    } catch (error) {
        console.warn('Could not load module navigation:', error);
    }
}

function showError() {
    document.getElementById('module-loading').classList.add('hidden');
    document.getElementById('module-error').classList.remove('hidden');
}

function toggleUnit(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.material-symbols-outlined:last-child');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.textContent = 'expand_less';
    } else {
        content.classList.add('hidden');
        icon.textContent = 'expand_more';
    }
}