// Initialize locale switcher when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof I18N !== 'undefined') {
            I18N.createLocaleSwitcher('locale-switcher');
        } else {
            console.warn('I18N module not loaded. Locale switcher not initialized.');
        }
    });