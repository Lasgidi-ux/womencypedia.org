// Calculate real-time duration based on module content
function calculateModuleDuration(module) {
    // If explicit duration exists, use it
    if (module.duration) return module.duration;

    let estimatedMinutes = 0;

    // Estimate based on lessons
    if (Array.isArray(module.lessons) && module.lessons.length > 0) {
        // Assume 20-30 minutes per lesson
        estimatedMinutes = module.lessons.length * 25;
    } else if (module.lessons_count && typeof module.lessons_count === 'number') {
        estimatedMinutes = module.lessons_count * 25;
    } else if (module.content) {
        // Estimate based on content length (roughly 200 words per minute reading time)
        const wordCount = module.content.split(/\s+/).length;
        estimatedMinutes = Math.max(30, Math.ceil(wordCount / 200) * 60); // Minimum 30 minutes
    } else if (module.description) {
        // Fallback to description length
        const wordCount = module.description.split(/\s+/).length;
        estimatedMinutes = Math.max(15, Math.ceil(wordCount / 150) * 60); // Minimum 15 minutes
    }

    // Convert to readable format
    if (estimatedMinutes < 60) {
        return `${estimatedMinutes} min`;
    } else if (estimatedMinutes < 120) {
        return '1 hour';
    } else {
        const hours = Math.floor(estimatedMinutes / 60);
        const remainingMinutes = estimatedMinutes % 60;
        if (remainingMinutes === 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${hours}h ${remainingMinutes}m`;
        }
    }
}

// Calculate real-time lesson count based on module data
function calculateLessonCount(module) {
    // If lessons is an array, count the items
    if (Array.isArray(module.lessons)) {
        return module.lessons.length;
    }

    // If lessons_count exists, use it
    if (module.lessons_count && typeof module.lessons_count === 'number') {
        return module.lessons_count;
    }

    // If quiz exists, it might indicate lessons
    if (Array.isArray(module.quiz) && module.quiz.length > 0) {
        return module.quiz.length;
    }

    // Estimate based on content structure (rough heuristic)
    if (module.content) {
        const sections = module.content.split(/\n\s*\n/).length;
        return Math.max(1, Math.min(12, sections)); // Between 1-12 lessons
    }

    // Default fallback
    return 1;
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        showError();
        return;
    }

    // Check if StrapiAPI is available
    if (typeof StrapiAPI === 'undefined' || !StrapiAPI.educationModules) {
        console.error('StrapiAPI not available for education modules');
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

    // Meta info with real-time calculations
    const metaEl = document.getElementById('module-meta');
    const lessonCount = calculateLessonCount(module);
    const duration = calculateModuleDuration(module);
    metaEl.innerHTML = `
                <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[18px]">schedule</span>
                    ${duration}
                </span>
                <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[18px]">auto_stories</span>
                    ${lessonCount} Lesson${lessonCount !== 1 ? 's' : ''}
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
    const actualLessons = Array.isArray(module.lessons) ? module.lessons : [];
    if (actualLessons.length > 0) {
        document.getElementById('lessons-section').classList.remove('hidden');
        const lessonsList = document.getElementById('lessons-list');
        const lessonNav = document.getElementById('lesson-nav');

        lessonsList.innerHTML = actualLessons.map((lesson, i) => `
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
        lessonNav.innerHTML = actualLessons.map((lesson, i) => `
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
        // Track lesson completion
        trackLessonView(button);
    } else {
        content.classList.add('hidden');
        icon.textContent = 'expand_more';
    }
}

// Track lesson completion for certificate eligibility
function trackLessonView(button) {
    const lessonContainer = button.closest('[id^="lesson-"]');
    if (!lessonContainer) return;

    lessonContainer.classList.add('lesson-completed');

    // Check if all lessons are completed
    setTimeout(checkModuleCompletion, 100);
}

// Check if module is complete and show certificate button
function checkModuleCompletion() {
    const lessons = document.querySelectorAll('[id^="lesson-"]');
    const completedLessons = document.querySelectorAll('.lesson-completed');

    if (lessons.length > 0 && completedLessons.length === lessons.length) {
        showCertificateButton();
    }
}

// Show certificate generation button
function showCertificateButton() {
    const quizSection = document.getElementById('quiz-section');
    const certificateSection = document.getElementById('certificate-section');

    if (certificateSection) {
        certificateSection.classList.remove('hidden');
    } else if (quizSection) {
        // Add certificate section after quiz
        const certHTML = `
            <div id="certificate-section" class="mt-8 bg-gradient-to-br from-primary/10 to-accent-teal/10 rounded-2xl p-8 text-center">
                <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                </div>
                <h3 class="font-serif text-2xl font-bold text-text-main mb-2">Congratulations!</h3>
                <p class="text-text-secondary mb-6">You've completed all lessons in this module. Generate your certificate of completion.</p>
                <button onclick="generateCertificate()" class="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors">
                    <span class="material-symbols-outlined text-[20px]">workspace_premium</span>
                    Generate Certificate
                </button>
            </div>
        `;
        quizSection.insertAdjacentHTML('afterend', certHTML);
    }
}

// Generate and display certificate
function generateCertificate() {
    const moduleTitle = document.getElementById('module-title').textContent;
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get user name if logged in
    let userName = 'Valued Learner';
    if (typeof Auth !== 'undefined' && Auth.getUser()) {
        const user = Auth.getUser();
        userName = user.name || user.email || user.username || 'Valued Learner';
    }

    // Create certificate HTML
    const certificateHTML = `
        <div id="certificate-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="closeCertificate()">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="p-8">
                    <button onclick="closeCertificate()" class="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors">
                        <span class="material-symbols-outlined text-text-secondary">close</span>
                    </button>

                    <div class="certificate-content bg-gradient-to-br from-primary via-primary-hover to-accent-teal p-12 rounded-xl text-white text-center relative overflow-hidden">
                        <div class="absolute inset-0 opacity-10">
                            <div class="absolute top-8 left-8">
                                <span class="material-symbols-outlined text-8xl">workspace_premium</span>
                            </div>
                            <div class="absolute bottom-8 right-8">
                                <span class="material-symbols-outlined text-6xl">school</span>
                            </div>
                        </div>

                        <div class="relative z-10">
                            <div class="mb-8">
                                <img src="images/womencypedia-logo.png" alt="Womencypedia" class="h-16 mx-auto mb-4 brightness-0 invert">
                            </div>

                            <h1 class="font-serif text-4xl lg:text-5xl font-bold mb-4">Certificate of Completion</h1>

                            <div class="text-xl mb-8 opacity-90">
                                <p class="mb-2">This is to certify that</p>
                                <p class="font-bold text-2xl mb-2">${userName}</p>
                                <p class="mb-2">has successfully completed</p>
                                <p class="font-bold text-2xl mb-2">"${moduleTitle}"</p>
                                <p class="mb-4">in the Womencypedia Education Program</p>
                            </div>

                            <div class="flex justify-center items-center gap-8 text-lg opacity-90">
                                <div>
                                    <p class="font-bold">${currentDate}</p>
                                    <p class="text-sm">Date of Completion</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-center gap-4">
                        <button onclick="downloadCertificate()" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors">
                            <span class="material-symbols-outlined text-[20px]">download</span>
                            Download Certificate
                        </button>
                        <button onclick="shareCertificate()" class="inline-flex items-center gap-2 px-6 py-3 border border-border-light text-text-main font-bold rounded-lg hover:bg-border-light transition-colors">
                            <span class="material-symbols-outlined text-[20px]">share</span>
                            Share Certificate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', certificateHTML);
}

// Close certificate modal
function closeCertificate() {
    const modal = document.getElementById('certificate-modal');
    if (modal) {
        modal.remove();
    }
}

// Download certificate as image
function downloadCertificate() {
    const certificateElement = document.querySelector('.certificate-content');
    if (!certificateElement) return;

    // Use html2canvas or similar library if available, otherwise show message
    if (typeof html2canvas !== 'undefined') {
        html2canvas(certificateElement, {
            backgroundColor: '#ffffff',
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'womencypedia-certificate.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    } else {
        alert('Certificate download feature requires additional libraries. Please take a screenshot instead.');
    }
}

// Share certificate
function shareCertificate() {
    const moduleTitle = document.getElementById('module-title').textContent;
    const shareText = `I just completed the "${moduleTitle}" module on Womencypedia! 🏆\n\nCheck out Womencypedia.org for amazing educational content about women's history.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'Womencypedia Certificate',
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        const fullText = `${shareText}\n\n${shareUrl}`;
        navigator.clipboard.writeText(fullText).then(() => {
            alert('Certificate details copied to clipboard!');
        }).catch(() => {
            alert('Share this: ' + fullText);
        });
    }
}