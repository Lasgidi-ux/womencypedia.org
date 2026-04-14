// No static fallback - modules are loaded dynamically from Strapi

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

// Calculate real-time duration based on module content
function calculateModuleDuration(module) {
    // If explicit duration exists, use it
    if (module.duration) return module.duration;

    let lessonCount = calculateLessonCount(module);
    let estimatedMinutes = 0;

    // Estimate based on lessons
    if (lessonCount > 0) {
        // Assume 20-30 minutes per lesson
        estimatedMinutes = lessonCount * 25;
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

    // If lessons is a JSON string, try to parse it
    if (typeof module.lessons === 'string') {
        try {
            const parsed = JSON.parse(module.lessons);
            if (Array.isArray(parsed)) {
                return parsed.length;
            }
        } catch (e) {
            // If parsing fails, treat as single lesson
        }
    }

    // If lessons is an object with lessons array
    if (module.lessons && typeof module.lessons === 'object' && Array.isArray(module.lessons.lessons)) {
        return module.lessons.lessons.length;
    }

    // If lessons_count exists, use it
    if (module.lessons_count && typeof module.lessons_count === 'number') {
        return module.lessons_count;
    }

    // If quiz exists, it might indicate lessons
    if (Array.isArray(module.quiz) && module.quiz.length > 0) {
        return module.quiz.length;
    }

    // If quiz is JSON string
    if (typeof module.quiz === 'string') {
        try {
            const parsed = JSON.parse(module.quiz);
            if (Array.isArray(parsed)) {
                return parsed.length;
            }
        } catch (e) {
            // Ignore parsing errors
        }
    }

    // Estimate based on content structure (rough heuristic)
    if (module.content) {
        const sections = module.content.split(/\n\s*\n/).length;
        return Math.max(1, Math.min(12, sections)); // Between 1-12 lessons
    }

    // Default fallback
    return 1;
}

// Render featured module card from dynamic data
function renderFeaturedModuleCard(module) {
    const title = escapeHtml(module.title || module.name || '');
    const description = escapeHtml(module.description || module.summary || '');
    const duration = calculateModuleDuration(module);
    const lessons = calculateLessonCount(module);
    const slug = encodeURIComponent(module.slug || '');
    const learningObjectives = module.learningObjectives || [];

    return `
        <div class="grid lg:grid-cols-2">
            <div class="bg-gradient-to-br from-primary to-primary-hover p-8 lg:p-12 flex flex-col justify-center">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white w-fit mb-6">
                    <span class="material-symbols-outlined text-[16px]">workspace_premium</span>
                    <span class="text-xs font-bold uppercase tracking-wider">Featured Course</span>
                </div>
                <h3 class="font-serif text-2xl lg:text-3xl font-bold text-white mb-4">${title}</h3>
                <p class="text-white/90 leading-relaxed mb-6">${description}</p>
                <div class="flex flex-wrap gap-4 text-white/80 text-sm">
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">schedule</span> ${duration}
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">auto_stories</span> ${lessons} Lessons
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">emoji_events</span> Certificate
                    </span>
                </div>
            </div>
            <div class="p-8 lg:p-12">
                <h4 class="font-serif text-lg font-bold text-text-main mb-4">What You'll Learn</h4>
                <ul class="space-y-3 mb-8">
                    ${learningObjectives.slice(0, 4).map(obj => `
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                            <span class="text-text-secondary">${escapeHtml(obj)}</span>
                        </li>
                    `).join('')}
                </ul>
                <a href="education-module.html?slug=${slug}"
                    class="inline-flex items-center justify-center h-12 px-8 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors gap-2 w-full lg:w-auto">
                    <span class="material-symbols-outlined text-[20px]">play_circle</span>
                    Start Learning
                </a>
            </div>
        </div>
    `;
}

// Render module card from dynamic data
function renderModuleCard(module, index, progress = null) {
    const colors = {
        'primary': { bg: 'bg-primary/10', text: 'text-primary', btn: 'bg-primary/10 text-primary hover:bg-primary/20' },
        'accent-teal': { bg: 'bg-accent-teal/10', text: 'text-accent-teal', btn: 'bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20' },
        'accent-gold': { bg: 'bg-accent-gold/10', text: 'text-accent-gold', btn: 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20' }
    };

    // Map Strapi data to display format
    const title = escapeHtml(module.title || module.name || '');
    const description = escapeHtml(module.description || module.summary || '');
    const duration = calculateModuleDuration(module);
    const lessons = calculateLessonCount(module);
    const moduleNumber = module.order || module.module_number || (index + 1);
    const slug = encodeURIComponent(module.slug || '');

    // Determine color based on module order or type
    let color = 'primary';
    if (moduleNumber % 3 === 1) color = 'accent-teal';
    else if (moduleNumber % 3 === 2) color = 'accent-gold';
    const c = colors[color];

    // Determine icon based on module content or default
    const icon = escapeHtml(module.icon || 'school');

    // Check completion status
    const isCompleted = progress && progress.completed;
    const progressPercent = progress ? progress.progress : 0;

    let buttonHTML;
    if (isCompleted) {
        buttonHTML = `
            <button onclick="generateCertificate(${JSON.stringify(module).replace(/"/g, '&quot;')})"
                class="inline-flex items-center justify-center h-10 px-6 bg-green-100 text-green-700 font-bold rounded-lg transition-colors gap-2 w-full hover:bg-green-200">
                <span class="material-symbols-outlined text-[18px]">emoji_events</span>
                Get Certificate
            </button>
        `;
    } else if (progressPercent > 0) {
        buttonHTML = `
            <a href="education-module.html?slug=${slug}"
                class="inline-flex items-center justify-center h-10 px-6 ${c.btn} font-bold rounded-lg transition-colors gap-2 w-full">
                <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                Continue (${progressPercent}%)
            </a>
        `;
    } else {
        buttonHTML = `
            <a href="education-module.html?slug=${slug}"
                class="inline-flex items-center justify-center h-10 px-6 ${c.btn} font-bold rounded-lg transition-colors gap-2 w-full">
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                Start Module
            </a>
        `;
    }

    return `
                <div class="bg-white rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-lg transition-all">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="size-12 rounded-full ${c.bg} flex items-center justify-center">
                            <span class="material-symbols-outlined ${c.text} text-2xl">${icon}</span>
                        </div>
                        <span class="${c.text} text-xs font-bold uppercase tracking-wider">Module ${moduleNumber}</span>
                    </div>
                    <h3 class="font-serif text-xl font-bold text-text-main mb-3">${title}</h3>
                    <p class="text-text-secondary text-sm leading-relaxed mb-4">${description}</p>
                    <div class="flex items-center justify-between text-sm text-text-secondary mb-4">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">schedule</span> ${duration}
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">auto_stories</span> ${lessons} Lesson${lessons !== 1 ? 's' : ''}
                        </span>
                    </div>
                    ${progressPercent > 0 ? `<div class="w-full bg-gray-200 rounded-full h-2 mb-4"><div class="bg-${color === 'primary' ? 'primary' : color === 'accent-teal' ? 'accent-teal' : 'accent-gold'} h-2 rounded-full" style="width: ${progressPercent}%"></div></div>` : ''}
                    ${buttonHTML}
                </div>
            `;
}

// Render modules from API data
function renderModules(modules, progressData = {}) {
    const grid = document.getElementById('modules-grid');
    if (!grid) return;

    grid.innerHTML = modules.map((module, index) => {
        const progress = progressData[module.id];
        return renderModuleCard(module, index, progress);
    }).join('');

    // Hide loading, show grid
    document.getElementById('modules-loading').classList.add('hidden');
    grid.classList.remove('hidden');
}



// Show error state with retry option
function showError(message = 'Unable to load education modules. Please try again.') {
    const loading = document.getElementById('modules-loading');
    const grid = document.getElementById('modules-grid');

    if (loading) loading.classList.add('hidden');
    if (grid) {
        grid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <span class="material-symbols-outlined text-6xl text-text-secondary/40 mb-4">school</span>
                        <h3 class="font-serif text-2xl font-bold text-text-main mb-3">Content Unavailable</h3>
                        <p class="text-text-secondary mb-6">${escapeHtml(message)}</p>
                        <button onclick="loadEducationModules()" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                            <span class="material-symbols-outlined text-[18px]">refresh</span>
                            Try Again
                        </button>
                    </div>
                `;
        grid.classList.remove('hidden');
    }
}

// Load featured education module from Strapi API
async function loadFeaturedModule() {
    const section = document.getElementById('featured-module-section');
    const card = document.getElementById('featured-module-card');
    const title = document.getElementById('featured-title');
    const description = document.getElementById('featured-description');

    try {
        if (typeof StrapiAPI === 'undefined') {
            // Silently skip if API not available - featured module is optional
            return;
        }

        const response = await StrapiAPI.educationModules.getAll({
            filters: { featured: true },
            sort: 'order',
            pageSize: 1
        });

        if (response && response.entries && response.entries.length > 0) {
            const featuredModule = response.entries[0];
            renderFeaturedModule(featuredModule);

            // Update section title and description
            if (title) title.textContent = escapeHtml(featuredModule.title || featuredModule.name || 'Featured Education Module');
            if (description) description.textContent = escapeHtml(featuredModule.description || featuredModule.summary || 'Dynamic content loaded from Strapi.');

            // Show the section
            if (section) section.classList.remove('hidden');
        }
        // If no featured module, section stays hidden
    } catch (error) {
        

        // Retry with exponential backoff for network errors (optional content, fewer retries)
        const maxRetries = 2;
        if (typeof loadFeaturedModule.retryCount === 'undefined') {
            loadFeaturedModule.retryCount = 0;
        }

        if (loadFeaturedModule.retryCount < maxRetries && (error.name === 'NetworkError' || error.message.includes('fetch'))) {
            const delay = Math.pow(2, loadFeaturedModule.retryCount) * 1000;

            loadFeaturedModule.retryCount++;
            setTimeout(() => {
                loadFeaturedModule();
            }, delay);
            return;
        }

        // Featured module is optional, so don't show error - just keep section hidden
    }
}

// Render featured module
function renderFeaturedModule(module) {
    const card = document.getElementById('featured-module-card');
    if (!card) return;

    card.innerHTML = renderFeaturedModuleCard(module);
}

// Load education modules from Strapi API with retry mechanism
async function loadEducationModules(retryCount = 0) {
    console.log('🔍 [Education] Starting loadEducationModules, retry:', retryCount);
    const grid = document.getElementById('modules-grid');
    const loading = document.getElementById('modules-loading');
    const maxRetries = 3;

    try {
        console.log('🔍 [Education] Checking StrapiAPI availability:', typeof StrapiAPI);
        if (typeof StrapiAPI === 'undefined') {
            throw new Error('API client not available');
        }

        // Show loading state
        if (loading) loading.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        console.log('🔍 [Education] Calling StrapiAPI.educationModules.getAll...');
        const response = await StrapiAPI.educationModules.getAll({
            sort: 'order',
            pageSize: 50
        });

        console.log('🔍 [Education] API Response received:', response);

        // Load user progress if user is logged in
        let progressData = {};
        try {
            if (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) {
                const progressResponse = await StrapiAPI.userProgress.getAll();
                if (progressResponse && progressResponse.entries) {
                    progressResponse.entries.forEach(progress => {
                        if (progress.educationModule && progress.educationModule.id) {
                            progressData[progress.educationModule.id] = progress;
                        }
                    });
                }
            }
        } catch (progressError) {
            console.warn('⚠️ [Education] Could not load progress data:', progressError);
            // Continue without progress data
        }

        if (response && response.entries && response.entries.length > 0) {
            console.log('🔍 [Education] Found', response.entries.length, 'modules, rendering...');
            renderModules(response.entries, progressData);
        } else {
            console.log('🔍 [Education] No modules found in response');
            throw new Error('No education modules found');
        }
    } catch (error) {
        console.error('❌ [Education] Error loading modules:', error);
        
        // Retry with exponential backoff for network errors
        if (retryCount < maxRetries && (error.name === 'NetworkError' || error.message.includes('fetch'))) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s

            setTimeout(() => {
                loadEducationModules(retryCount + 1);
            }, delay);
            return;
        }

        showError(error.message || 'Failed to load education modules');
    }
}

// Certificate generation
async function generateCertificate(module) {
    try {
        if (!module || !module.title) {
            throw new Error('Invalid module data');
        }

        // Get current user info
        const user = Auth?.getUser?.() || null;
        const userName = user?.name || user?.username || 'Valued Learner';

        // Create certificate data
        const certificateData = {
            userName: userName,
            moduleTitle: module.title,
            completionDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            moduleId: module.id,
            certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        // Update progress with certificate data
        if (typeof StrapiAPI !== 'undefined' && module.id) {
            await StrapiAPI.userProgress.complete(module.id);
        }

        // Create certificate HTML
        const certificateHTML = createCertificateHTML(certificateData);

        // Open certificate in new window
        const certificateWindow = window.open('', '_blank', 'width=800,height=600');
        if (certificateWindow) {
            certificateWindow.document.write(certificateHTML);
            certificateWindow.document.close();
        } else {
            // Fallback: download as HTML file
            const blob = new Blob([certificateHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certificateData.certificateId}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        return certificateData;
    } catch (error) {
        console.error('Certificate generation failed:', error);
        alert('Failed to generate certificate. Please try again.');
        throw error;
    }
}

function createCertificateHTML(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        body {
            font-family: 'Playfair Display', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            border-radius: 20px;
            padding: 60px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border: 10px solid #D67D7D;
            max-width: 800px;
            width: 100%;
            text-align: center;
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: linear-gradient(45deg, #D67D7D, #F4A261);
            border-radius: 30px;
            z-index: -1;
        }
        .header {
            color: #D67D7D;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .title {
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
            margin: 30px 0;
            line-height: 1.2;
        }
        .presented-to {
            font-size: 16px;
            color: #7f8c8d;
            margin: 20px 0;
        }
        .name {
            font-size: 32px;
            font-weight: 700;
            color: #D67D7D;
            margin: 20px 0;
            text-decoration: underline;
        }
        .achievement {
            font-size: 18px;
            color: #34495e;
            margin: 30px 0;
            line-height: 1.6;
        }
        .details {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
            padding: 0 40px;
        }
        .detail-item {
            text-align: center;
        }
        .detail-label {
            font-size: 12px;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 16px;
            color: #2c3e50;
            font-weight: 600;
        }
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
        }
        .signature {
            font-style: italic;
            color: #7f8c8d;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #D67D7D;
            margin-bottom: 10px;
        }
        .certificate-id {
            font-size: 12px;
            color: #95a5a6;
            margin-top: 20px;
        }
        @media print {
            body { background: white; }
            .certificate { box-shadow: none; border: 2px solid #D67D7D; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">Certificate of Completion</div>
        <div class="title">Womencypedia Education</div>

        <div class="presented-to">This is to certify that</div>
        <div class="name">${data.userName}</div>
        <div class="achievement">has successfully completed the education module<br><strong>"${data.moduleTitle}"</strong></div>

        <div class="details">
            <div class="detail-item">
                <div class="detail-label">Completion Date</div>
                <div class="detail-value">${data.completionDate}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Certificate ID</div>
                <div class="detail-value">${data.certificateId}</div>
            </div>
        </div>

        <div class="footer">
            <div class="signature">Awarded by the Womencypedia Foundation</div>
            <div class="logo">Womencypedia</div>
            <div class="certificate-id">Certificate ID: ${data.certificateId}</div>
        </div>
    </div>
</body>
</html>`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔍 [Education] DOMContentLoaded - initializing education modules');
    loadEducationModules();
    loadFeaturedModule();
});
