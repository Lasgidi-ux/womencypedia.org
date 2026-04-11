/**
 * Research Tools Loader
 * Loads research tools from Strapi API with static fallback
 */

const RESEARCH_TOOLS_FALLBACK = [
  { title: "Advanced Biography Search", description: "Search across 15,000+ biographies with filters for region, era, domain, language, and cultural context.", type: "Search", actionText: "Search Now", url: "browse.html" },
  { title: "Citation Generator", description: "Generate properly formatted citations for Womencypedia entries in APA, MLA, Chicago, and Harvard styles.", type: "Citation", actionText: "Generate Citation", url: "#" },
  { title: "Data Export Tool", description: "Export biography datasets in CSV, JSON, or XML format for academic research and statistical analysis.", type: "Export", actionText: "Export Data", url: "#" },
  { title: "Comparative Timeline Builder", description: "Build custom timelines comparing women's achievements across different regions and historical periods.", type: "Analysis", actionText: "Build Timeline", url: "timelines.html" },
  { title: "Source Verification Index", description: "Cross-reference primary and secondary sources used across biographical entries with scholarly databases.", type: "Database", actionText: "Browse Sources", url: "#" },
  { title: "Cultural Context Mapper", description: "Explore the cultural, linguistic, and geographic contexts that shaped women's roles throughout history.", type: "Analysis", actionText: "Explore Contexts", url: "browse.html" }
];

class ResearchToolsLoader {
  constructor() {
    this.api = window.StrapiAPI || window.API;
  }

  async loadResearchTools(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      if (!this.api) throw new Error('API not available');

      const response = await this.api.researchTools.getAll({
        sort: 'createdAt:desc',
        pagination: { pageSize: 8 }
      });

      const tools = response.entries || [];

      if (tools.length === 0) {
        this.renderFallback(container);
        return;
      }

      container.innerHTML = tools.map(tool => {
        const title = tool.title || 'Untitled Tool';
        const description = tool.description || '';
        const type = tool.type || 'Tool';
        const url = tool.url || tool.link || '#';

        return `
          <div class="bg-white rounded-xl p-6 border border-border-light hover:shadow-lg transition-shadow">
            <div class="size-12 rounded-lg bg-accent-gold/10 flex items-center justify-center mb-4">
              <span class="material-symbols-outlined text-accent-gold text-2xl">${this.getToolIcon(type)}</span>
            </div>
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-1 bg-accent-gold/10 text-accent-gold text-xs font-bold uppercase tracking-wider rounded">${type}</span>
            </div>
            <h3 class="font-serif text-lg font-bold text-text-main mb-2">${title}</h3>
            ${description ? `<p class="text-text-secondary text-sm mb-4">${description}</p>` : ''}
            <a href="${url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-accent-gold font-bold hover:underline">
              <span class="material-symbols-outlined text-sm">open_in_new</span>
              ${tool.actionText || 'Access Tool'}
            </a>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.warn('[Resources] Research tools API unavailable, using fallback:', error.message || error);
      this.renderFallback(container);
    }
  }

  renderFallback(container) {
    container.innerHTML = RESEARCH_TOOLS_FALLBACK.map(tool => `
      <div class="bg-white rounded-xl p-6 border border-border-light hover:shadow-lg transition-shadow">
        <div class="size-12 rounded-lg bg-accent-gold/10 flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-accent-gold text-2xl">${this.getToolIcon(tool.type)}</span>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <span class="px-2 py-1 bg-accent-gold/10 text-accent-gold text-xs font-bold uppercase tracking-wider rounded">${tool.type}</span>
        </div>
        <h3 class="font-serif text-lg font-bold text-text-main mb-2">${tool.title}</h3>
        <p class="text-text-secondary text-sm mb-4">${tool.description}</p>
        <a href="${tool.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-accent-gold font-bold hover:underline">
          <span class="material-symbols-outlined text-sm">open_in_new</span>
          ${tool.actionText}
        </a>
      </div>
    `).join('');
  }

  getToolIcon(type) {
    const icons = {
      'search': 'search',
      'export': 'download',
      'citation': 'format_quote',
      'database': 'database',
      'analysis': 'analytics',
      'filter': 'filter_list'
    };
    return icons[(type || '').toLowerCase()] || 'build';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = new ResearchToolsLoader();
  const container = document.getElementById('research-tools-grid');
  if (container) {
    loader.loadResearchTools('research-tools-grid');
  }
});

if (typeof window !== 'undefined') {
  window.ResearchToolsLoader = ResearchToolsLoader;
}