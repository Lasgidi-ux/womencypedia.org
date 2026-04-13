/**
 * Timelines Loader
 * Loads timeline events from Strapi API with static fallback
 */

const TIMELINE_FALLBACK = [
  { date: "3100 BCE", title: "Merneith rules as regent of Egypt", description: "One of the earliest known female rulers in recorded history, Merneith held power during Egypt's First Dynasty.", category: "Ancient" },
  { date: "69 BCE", title: "Cleopatra VII ascends to the throne", description: "The last active ruler of the Ptolemaic Kingdom of Egypt, Cleopatra became one of history's most discussed women leaders.", category: "Classical" },
  { date: "624 CE", title: "Khadijah bint Khuwaylid recognized", description: "The first wife of Prophet Muhammad, Khadijah was a successful businesswoman considered one of the most powerful women in early Islamic history.", category: "Medieval" },
  { date: "1429", title: "Joan of Arc lifts the Siege of Orléans", description: "A pivotal moment in the Hundred Years' War, led by a teenage peasant girl who changed the course of European history.", category: "Medieval" },
  { date: "1792", title: "Mary Wollstonecraft publishes 'A Vindication of the Rights of Woman'", description: "A foundational text of feminist philosophy, arguing for women's education and rational equality.", category: "Enlightenment" },
  { date: "1848", title: "Seneca Falls Convention", description: "The first women's rights convention in the United States, producing the Declaration of Sentiments.", category: "Modern" },
  { date: "1893", title: "New Zealand grants women the right to vote", description: "New Zealand becomes the first self-governing country in the world to grant all women the right to vote.", category: "Modern" },
  { date: "1903", title: "Marie Curie wins her first Nobel Prize", description: "The first woman to win a Nobel Prize and the only person to win Nobel Prizes in two different sciences.", category: "Modern" },
  { date: "1960", title: "Sirimavo Bandaranaike becomes world's first female PM", description: "Sri Lanka's Sirimavo Bandaranaike became the world's first female head of government.", category: "Contemporary" },
  { date: "2005", title: "Ellen Johnson Sirleaf elected President of Liberia", description: "Became the first elected female head of state in Africa, later winning the Nobel Peace Prize in 2011.", category: "Contemporary" }
];

class TimelinesLoader {
  constructor() {
    this.api = window.StrapiAPI || window.API;
  }

  async loadTimelineEvents(containerId, limit = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      if (!this.api) throw new Error('API not available');

      const response = await this.api.timelines.getEvents({
        sort: 'year:desc',
        pagination: { pageSize: limit }
      });

      const events = response.entries || [];

      if (events.length === 0) {
        this.renderFallback(container);
        return;
      }

      container.innerHTML = events.map(event => {
        const title = event.title || 'Untitled Event';
        const description = event.description || '';
        const year = event.year || event.date || '';
        const formattedDate = year ? this.formatDate(year) : '';
        const category = event.category || event.domain || '';

        return `
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-20 text-accent-teal font-bold">${formattedDate}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-text-main font-medium">${title}</p>
                ${category ? `<span class="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-xs rounded">${category}</span>` : ''}
              </div>
              <p class="text-text-secondary text-sm">${description}</p>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.warn('[Resources] Timeline API unavailable, using fallback:', error.message || error);
      this.renderFallback(container);
    }
  }

  renderFallback(container) {
    container.innerHTML = TIMELINE_FALLBACK.map(e => `
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-24 text-accent-teal font-bold text-sm">${e.date}</div>
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <p class="text-text-main font-medium">${e.title}</p>
            <span class="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-xs rounded">${e.category}</span>
          </div>
          <p class="text-text-secondary text-sm">${e.description}</p>
        </div>
      </div>
    `).join('');
  }

  formatDate(dateString) {
    try {
      // Handle year values (numbers or strings)
      if (!isNaN(dateString) && !isNaN(parseFloat(dateString))) {
        const year = parseInt(dateString);
        if (year < 0) return `${Math.abs(year)} BCE`;
        if (year < 100) return `${year} CE`;
        return year.toString();
      }

      // Handle date strings
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        if (year < 0) return `${Math.abs(year)} BCE`;
        if (year < 100) return `${year} CE`;
        return year.toString();
      }

      // Return as-is if not a valid date
      return dateString;
    } catch (error) {
      return dateString;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = new TimelinesLoader();
  const eventsContainer = document.getElementById('timeline-events');
  if (eventsContainer) {
    loader.loadTimelineEvents('timeline-events');
  }
});

if (typeof window !== 'undefined') {
  window.TimelinesLoader = TimelinesLoader;
}