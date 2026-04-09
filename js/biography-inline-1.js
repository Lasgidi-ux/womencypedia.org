// Dynamic Biography Loader - Production Ready
// Loads live biographies from Strapi with deep populate
// Handles single biography by slug from URL query
// Features: loading states, error handling, security, performance

let currentBio = null;
let isLoading = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Security: Sanitize HTML content
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// Show loading skeleton
function showLoadingSkeleton() {
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    <div class="animate-pulse">
      <!-- Header skeleton -->
      <div class="bg-white border-b border-border-light">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex flex-col lg:flex-row gap-8">
            <div class="w-full lg:w-1/3">
              <div class="aspect-[3/4] rounded-2xl bg-lavender-soft"></div>
            </div>
            <div class="w-full lg:w-2/3">
              <div class="h-4 w-32 bg-lavender-soft rounded mb-4"></div>
              <div class="h-12 w-96 bg-lavender-soft rounded mb-4"></div>
              <div class="h-6 w-64 bg-lavender-soft rounded mb-8"></div>
              <div class="h-4 w-full bg-lavender-soft rounded mb-2"></div>
              <div class="h-4 w-full bg-lavender-soft rounded mb-2"></div>
              <div class="h-4 w-3/4 bg-lavender-soft rounded"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- Content skeleton -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <div class="h-8 w-48 bg-lavender-soft rounded mb-6"></div>
            <div class="space-y-3">
              <div class="h-4 w-full bg-lavender-soft rounded"></div>
              <div class="h-4 w-full bg-lavender-soft rounded"></div>
              <div class="h-4 w-full bg-lavender-soft rounded"></div>
              <div class="h-4 w-3/4 bg-lavender-soft rounded"></div>
            </div>
          </div>
          <div class="lg:col-span-1">
            <div class="h-64 bg-lavender-soft rounded"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Show error state with retry
function showError(message, canRetry = true) {
  const main = document.querySelector('main');
  if (!main) return;

  const retryButton = canRetry && retryCount < MAX_RETRIES ? `
    <button onclick="retryLoad()" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors mr-4">
      Try Again
    </button>
  ` : '';

  main.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div class="size-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
      </div>
      <h1 class="font-serif text-2xl font-bold text-text-main mb-4">Unable to Load Biography</h1>
      <p class="text-text-secondary mb-2">${sanitizeHTML(message)}</p>
      <p class="text-text-secondary mb-8">Please check your connection and try again.</p>
      <div class="flex gap-4">
        ${retryButton}
        <a href="browse.html" class="px-6 py-3 bg-accent-teal text-white font-bold rounded-lg hover:bg-accent-teal/90 transition-colors">
          Browse All Entries
        </a>
      </div>
    </div>
  `;
}

// Show not found state
function showNotFound() {
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div class="size-20 rounded-full bg-lavender-soft/50 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-text-secondary/50 text-4xl">person_off</span>
      </div>
      <h1 class="font-serif text-2xl font-bold text-text-main mb-4">Biography Not Found</h1>
      <p class="text-text-secondary mb-8">The biography you're looking for doesn't exist or has been removed.</p>
      <a href="browse.html" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
        Browse All Entries
      </a>
    </div>
  `;
}

// Load biography from API
async function loadBiography(slug) {
  if (isLoading) return;
  isLoading = true;

  try {
    // Validate slug
    if (!slug || typeof slug !== 'string' || slug.length > 100 || !/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Invalid biography slug');
    }

    if (!window.StrapiAPI) {
      throw new Error('API client not available');
    }

    currentBio = await window.StrapiAPI.biographies.get(slug);

    if (!currentBio) {
      showNotFound();
      return;
    }

    // Success - update page
    updatePageContent(currentBio);
    retryCount = 0; // Reset retry count on success

    // Setup admin features if applicable
    setupAdminFeatures();

  } catch (error) {
    

    if (error.status === 404 || error.message?.includes('not found')) {
      showNotFound();
    } else if (error.status === 403 || error.status === 401) {
      // Skip showing error for auth issues, let fallback loader handle
      return;
    } else {
      const errorMessage = error.message || 'Failed to load biography';
      showError(errorMessage, true);
    }
  } finally {
    isLoading = false;
  }
}

// Retry loading
function retryLoad() {
  if (retryCount >= MAX_RETRIES) return;

  retryCount++;
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (slug) {
    showLoadingSkeleton();
    loadBiography(slug);
  }
}

// Update page content with biography data
function updatePageContent(bio) {
  // Update meta tags
  document.title = `${bio.name} — Womencypedia`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = sanitizeHTML(bio.introduction || `Read the biography of ${bio.name}`);
  }

  // Update canonical and OG URLs
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = `https://womencypedia.org/biography.html?slug=${encodeURIComponent(bio.slug)}`;
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.content = `https://womencypedia.org/biography.html?slug=${encodeURIComponent(bio.slug)}`;
  }

  // Generate full biography HTML
  const biographyHTML = generateBiographyHTML(bio);

  // Update main content
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = biographyHTML;
  }

  // Lazy load images
  setupLazyLoading();
}

// Generate biography HTML structure
function generateBiographyHTML(bio) {
  const era = bio.era || '';
  const region = bio.region || '';
  const category = bio.category || '';

  const relatedHTML = bio.relatedWomen && bio.relatedWomen.length > 0
    ? bio.relatedWomen.map(related => `
        <a href="biography.html?slug=${encodeURIComponent(related.slug)}" class="flex items-center gap-3 group">
          <div class="size-12 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            ${related.image ? `<img src="${related.image.url}" alt="" class="size-12 object-cover" loading="lazy">` : '<span class="material-symbols-outlined text-primary/50">person</span>'}
          </div>
          <div>
            <p class="font-bold text-sm text-text-main group-hover:text-primary">${related.name}</p>
            <p class="text-xs text-text-secondary">Related biography</p>
          </div>
        </a>
      `).join('')
    : '<p class="text-text-secondary text-sm">No related biographies found.</p>';

  const sourcesHTML = bio.sources && bio.sources.length > 0
    ? bio.sources.map((source, index) => `
        <li class="flex gap-3">
          <span class="text-accent-teal font-bold">[${index + 1}]</span>
          <span>${sanitizeHTML(source.title || '')} ${source.author ? `by ${sanitizeHTML(source.author)}` : ''} ${source.year ? `(${source.year})` : ''}. ${sanitizeHTML(source.citation || '')}</span>
        </li>
      `).join('')
    : '<li class="text-text-secondary">No sources available.</li>';

  return `
    <!-- Biography Header -->
    <section class="bg-white border-b border-border-light">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Image -->
          <div class="w-full lg:w-1/3">
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-lavender-soft">
              ${bio.image ? `<img src="${bio.image.url}" alt="Portrait of ${bio.name}" class="w-full h-full object-cover" loading="lazy">` : '<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-6xl text-primary/50">person</span></div>'}
            </div>
          </div>

          <!-- Content -->
          <div class="w-full lg:w-2/3">
            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-4">
              ${era ? `<span class="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs font-bold uppercase tracking-wider rounded-full">${era}</span>` : ''}
              ${region ? `<span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full">${region}</span>` : ''}
              ${category ? `<span class="px-3 py-1 bg-accent-teal/20 text-accent-teal text-xs font-bold uppercase tracking-wider rounded-full">${category}</span>` : ''}
            </div>

            <!-- Name -->
            <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-main mb-4">${bio.name}</h1>

            <!-- Subtitle -->
            <p class="text-xl text-text-secondary italic mb-6">${bio.category || bio.domain || ''}</p>

            <!-- Introduction -->
            <div class="bg-lavender-soft/50 rounded-xl p-6 mb-8">
              <p class="text-lg leading-relaxed text-text-main">
                <strong class="text-text-main">${bio.name}</strong> ${sanitizeHTML(bio.introduction || '')}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-3">
              <button class="flex items-center gap-2 px-5 py-2.5 bg-text-main text-white rounded-lg font-bold text-sm hover:bg-text-main/90">
                <span class="material-symbols-outlined text-[18px]">download</span>
                Download PDF
              </button>
              <button class="flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-white rounded-lg font-bold text-sm hover:bg-accent-teal/90">
                <span class="material-symbols-outlined text-[18px]">share</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Biography Content -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2">
          <article class="prose prose-lg max-w-none">
            ${bio.earlyLife ? `<h2 id="early-life">Early Life</h2>${bio.earlyLife}` : ''}
            ${bio.pathToInfluence ? `<h2 id="symbolic-power">Path to Influence</h2>${bio.pathToInfluence}` : ''}
            ${bio.legacy ? `<h2 id="legacy-memory">Legacy</h2>${bio.legacy}` : ''}
          </article>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <!-- Related Biographies -->
          <div class="bg-white rounded-xl border border-border-light p-6 mb-6">
            <h3 class="font-serif text-xl font-bold text-text-main mb-4">Related Biographies</h3>
            <div class="space-y-3">
              ${relatedHTML}
            </div>
          </div>

          <!-- Tags -->
          ${bio.tags && bio.tags.length > 0 ? `
          <div class="bg-white rounded-xl border border-border-light p-6 mb-6">
            <h3 class="font-serif text-xl font-bold text-text-main mb-4">Tags</h3>
            <div class="flex flex-wrap gap-2">
              ${bio.tags.map(tag => `<span class="px-3 py-1 bg-background-cream text-text-secondary text-xs rounded-full border border-border-light">${sanitizeHTML(tag.name || tag)}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Sources -->
          <div class="bg-white rounded-xl border border-border-light p-6">
            <h3 class="font-serif text-xl font-bold text-text-main mb-4">References & Sources</h3>
            <ol class="space-y-4 text-sm">
              ${sourcesHTML}
            </ol>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Setup lazy loading for images
function setupLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.src; // Trigger load
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Setup admin features
function setupAdminFeatures() {
  const isAdmin = typeof Auth !== 'undefined' && Auth.isAdmin();
  if (!isAdmin || !currentBio) return;

  // Add edit button
  const actionsContainer = document.querySelector('.flex.flex-wrap.gap-3');
  if (actionsContainer) {
    const editButton = document.createElement('a');
    editButton.href = `#edit-${currentBio.id || currentBio.documentId}`;
    editButton.className = 'admin-edit-btn flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-white rounded-lg font-bold text-sm hover:bg-accent-teal/90';
    editButton.innerHTML = '<span class="material-symbols-outlined text-[18px]">edit</span> Edit Entry';
    actionsContainer.insertBefore(editButton, actionsContainer.firstChild);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    window.location.href = 'browse.html';
    return;
  }

  showLoadingSkeleton();
  loadBiography(slug);
});

// Global functions for buttons
window.retryLoad = retryLoad;