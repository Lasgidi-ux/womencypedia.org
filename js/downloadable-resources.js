/**
 * Downloadable Resources Loader
 * Loads and handles downloads for PDF resources with static fallback
 */

const DOWNLOADABLE_FALLBACK = [
  { slug: 'educators-guide', title: "Educator's Guide", url: 'assets/docs/Womencypedia_Educators_Guide.pdf' },
  { slug: 'timeline-poster', title: 'Timeline Poster', url: 'assets/docs/Womencypedia_Timeline_Poster.pdf' },
  { slug: 'research-guide', title: 'Research Guide', url: 'assets/docs/Womencypedia_Research_Guide.pdf' },
  { slug: 'glossary-quick-ref', title: 'Glossary Quick Ref', url: 'assets/docs/Womencypedia_Glossary.pdf' }
];

class DownloadableResourcesLoader {
  constructor() {
    this.api = window.StrapiAPI || window.API;
    this.resources = [];
    this.isFallback = false;
  }

  async loadDownloadableResources() {
    try {
      if (!this.api) throw new Error('API not available');

      const response = await this.api.downloadableResources.getAll({
        populate: 'file',
        sort: 'createdAt:desc'
      });

      this.resources = response.entries || [];

      if (this.resources.length === 0) {
        throw new Error('No resources returned from API');
      }

    } catch (error) {
      console.warn('[Resources] Downloadable resources API unavailable, using fallback:', error.message || error);
      this.resources = [...DOWNLOADABLE_FALLBACK];
      this.isFallback = true;
    } finally {
      this.attachDownloadHandlers();
    }
  }

  attachDownloadHandlers() {
    const resourceMapping = {
      "Educator's Guide": 'educators-guide',
      'Timeline Poster': 'timeline-poster',
      'Research Guide': 'research-guide',
      'Glossary Quick Ref': 'glossary-quick-ref'
    };

    document.querySelectorAll('.downloadable-pdf-button').forEach(button => {
      const parentContainer = button.closest('.bg-white');
      if (!parentContainer) return;

      const titleEl = parentContainer.querySelector('h4');
      if (!titleEl) return;

      const resourceTitle = titleEl.textContent.trim();
      const resourceSlug = resourceMapping[resourceTitle];

      if (resourceSlug) {
        const resource = this.resources.find(r => r.slug === resourceSlug);
        if (resource) {
          button.addEventListener('click', () => this.downloadResource(resource));
          button.disabled = false;
          button.textContent = 'Download PDF';
        } else {
          // Disable and show coming soon for unavailable resources
          button.disabled = true;
          button.textContent = 'Coming Soon';
          button.classList.add('opacity-70');
        }
      }
    });
  }

  async downloadResource(resource) {
    try {
      let downloadUrl;

      if (this.isFallback) {
        // Use the static URL from fallback data
        downloadUrl = resource.url;
        if (!downloadUrl) {
          alert(`${resource.title} is not available yet.`);
          return;
        }
      } else {
        downloadUrl = this.api.downloadableResources.getDownloadUrl(resource);
        if (!downloadUrl) throw new Error('Download URL not available');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = resource.file?.name || `${resource.title || resource.slug}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (typeof gtag !== 'undefined') {
        gtag('event', 'download', {
          event_category: 'resource',
          event_label: resource.title || resource.slug,
          value: 1
        });
      }

    } catch (error) {
      console.error('Failed to download resource:', error);
      this.showDownloadError(resource.title || 'Resource');
    }
  }

  showDownloadError(resourceName) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = `Failed to download ${resourceName}. Please try again.`;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = new DownloadableResourcesLoader();
  loader.loadDownloadableResources();
});

if (typeof window !== 'undefined') {
  window.DownloadableResourcesLoader = DownloadableResourcesLoader;
}