/**
 * Featured Content Loader
 * Central module for loading featured content across the platform
 */

const FeaturedContent = {
    // Load featured education module
    async loadFeaturedEducationModule() {
        try {
            if (typeof StrapiAPI === 'undefined') {
                throw new Error('API client not available');
            }

            const response = await StrapiAPI.educationModules.getAll({
                filters: { featured: true },
                sort: 'order',
                pageSize: 1
            });

            if (response && response.entries && response.entries.length > 0) {
                return response.entries[0];
            }
            return null;
        } catch (error) {
            console.warn('Failed to load featured education module:', error);
            return null;
        }
    },

    // Load featured teaching resources
    async loadFeaturedTeachingResources() {
        try {
            if (typeof StrapiAPI === 'undefined') {
                throw new Error('API client not available');
            }

            const response = await StrapiAPI.teachingResources.getAll({
                filters: { featured: true },
                sort: 'publishedAt:desc',
                pageSize: 3
            });

            if (response && response.entries && response.entries.length > 0) {
                return response.entries;
            }
            return [];
        } catch (error) {
            console.warn('Failed to load featured teaching resources:', error);
            return [];
        }
    },

    // Load all featured content for a page
    async loadAllFeaturedContent() {
        const [featuredModule, featuredResources] = await Promise.all([
            this.loadFeaturedEducationModule(),
            this.loadFeaturedTeachingResources()
        ]);

        return {
            featuredModule,
            featuredResources
        };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturedContent;
}