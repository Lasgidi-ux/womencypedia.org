/**
 * Teaching Resources Loader
 * Loads teaching resources from Strapi API with static fallback
 */

const TEACHING_FALLBACK = [
  {
    title: "Women in Ancient Civilizations",
    description: "A comprehensive lesson plan exploring the roles of women across ancient Egypt, Mesopotamia, Greece, and Rome. Includes primary source analysis, discussion questions, and creative activities.",
    type: "Lesson Plan",
    level: "University"
  },
  {
    title: "Decolonizing Women's History",
    description: "An interdisciplinary curriculum module examining colonial narratives about women and offering frameworks for centering indigenous perspectives in historical scholarship.",
    type: "Curriculum Module",
    level: "University"
  },
  {
    title: "African Queens & Matriarchs",
    description: "Classroom activities and biographical profiles of influential African women leaders from Hatshepsut and Nefertiti to Yaa Asantewaa and Njinga.",
    type: "Activity Pack",
    level: "K-12"
  },
  {
    title: "Women Scientists Through Time",
    description: "Interactive timeline activity tracing women's contributions to science, from Hypatia of Alexandria to Marie Curie and beyond.",
    type: "Interactive Activity",
    level: "K-12"
  },
  {
    title: "Oral Histories Workshop Guide",
    description: "Step-by-step guide for educators conducting oral history projects focused on women's stories in their local communities.",
    type: "Workshop Guide",
    level: "All Levels"
  },
  {
    title: "Women & Social Movements Syllabus",
    description: "A 16-week university syllabus covering women's roles in major social movements from suffrage to contemporary activism.",
    type: "Syllabus",
    level: "University"
  }
];

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadTeachingResources(containerId) {
  const container = document.getElementById(containerId);
  const loadingElement = document.getElementById('teaching-resources-loading');

  if (!container) return;

  try {
    const api = window.StrapiAPI || window.API;
    if (!api) throw new Error('API not available');

    const response = await api.teachingResources.getAll({
      sort: 'createdAt:desc',
      pagination: { pageSize: 12 }
    });

    const resources = response.entries || [];

    if (loadingElement) loadingElement.classList.add('hidden');

    if (resources.length === 0) {
      renderTeachingFallback(container);
      return;
    }

    container.innerHTML = resources.map(resource => {
      const title = escapeHtml(resource.title || resource.name || 'Untitled Resource');
      const description = escapeHtml(resource.description || '');
      const type = escapeHtml(resource.type || 'Resource');

      return `
        <div class="bg-white rounded-xl p-6 border border-border-light hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded">${type}</span>
          </div>
          <h3 class="font-serif text-lg font-bold text-text-main mb-2">${title}</h3>
          ${description ? `<p class="text-text-secondary text-sm mb-4">${description}</p>` : ''}
        </div>
      `;
    }).join('');

    container.classList.remove('hidden');

  } catch (error) {
    console.warn('[Resources] Teaching resources API unavailable, using fallback:', error.message || error);
    if (loadingElement) loadingElement.classList.add('hidden');
    renderTeachingFallback(container);
  }
}

function renderTeachingFallback(container) {
  container.innerHTML = TEACHING_FALLBACK.map(r => {
    const title = escapeHtml(r.title);
    const description = escapeHtml(r.description);
    const type = escapeHtml(r.type);
    const level = escapeHtml(r.level);

    return `
    <div class="bg-white rounded-xl p-6 border border-border-light hover:shadow-lg transition-shadow">
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded">${type}</span>
        <span class="px-2 py-1 bg-accent-teal/10 text-accent-teal text-xs font-medium rounded">${level}</span>
      </div>
      <h3 class="font-serif text-lg font-bold text-text-main mb-2">${title}</h3>
      <p class="text-text-secondary text-sm mb-4">${description}</p>
      <span class="inline-flex items-center gap-1 text-primary font-bold text-sm opacity-60">
        <span class="material-symbols-outlined text-[16px]">lock</span> Coming Soon
      </span>
    </div>
  `;
  }).join('');
  container.classList.remove('hidden');
}

if (typeof window !== 'undefined') {
  window.loadTeachingResources = loadTeachingResources;
}