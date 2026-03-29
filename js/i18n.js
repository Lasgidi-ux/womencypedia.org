/**
 * Womencypedia Internationalization (i18n) Module
 * 
 * Manages frontend locale switching and integrates with Strapi's i18n plugin.
 * - Detects user's preferred language from browser / localStorage
 * - Passes locale to all StrapiAPI requests automatically
 * - Provides UI translation strings for ALL static page content
 * - Renders a language switcher dropdown component
 * - Dynamically translates ALL elements with data-i18n attributes
 */

const I18N = {
    // Current active locale code (e.g. 'en', 'fr', 'es', 'ar', 'yo', 'sw')
    currentLocale: 'en',

    // Supported locales — must match Strapi Admin > Settings > Internationalization
    supportedLocales: [
        { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
        { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
        { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', dir: 'ltr', flag: '🇰🇪' },
        { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', dir: 'ltr', flag: '🇳🇬' },
        { code: 'ha', name: 'Hausa', nativeName: 'Hausa', dir: 'ltr', flag: '🇳🇬' },
        { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr', flag: '🇪🇹' },
        { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', dir: 'ltr', flag: '🇿🇦' },
    ],

    // localStorage key for persisting locale preference
    STORAGE_KEY: 'womencypedia_locale',

    // ─────────────────────────────────────────────────────────
    // TRANSLATION DICTIONARIES
    // Keys are used as data-i18n="keyName" attributes in HTML
    // ─────────────────────────────────────────────────────────
    translations: {
        en: {}, fr: {}, es: {}, pt: {}, ar: {}, 
        sw: {}, yo: {}, ha: {}, am: {}, zu: {}
    },

    /**
     * Initialize the i18n module
     */
    init() {
        // Priority: 1. URL param  2. localStorage  3. browser language  4. 'en'
        const urlParams = new URLSearchParams(window.location.search);
        const urlLocale = urlParams.get('locale') || urlParams.get('lang');

        if (urlLocale && this.isSupported(urlLocale)) {
            this.currentLocale = urlLocale;
        } else {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.isSupported(stored)) {
                this.currentLocale = stored;
            } else {
                const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
                this.currentLocale = this.isSupported(browserLang) ? browserLang : 'en';
            }
        }

        // Persist
        localStorage.setItem(this.STORAGE_KEY, this.currentLocale);

        // Apply to DOM
        this.applyLocale();

        // Render language switcher if a container exists
        this.renderLanguageSwitcher();

        // Translate static UI strings on the page
        this.translatePage();

        // Setup MutationObserver to watch for dynamically added elements
        this._setupMutationObserver();

        console.log(`[i18n] Locale set to: ${this.currentLocale}`);
    },

    /**
     * Check if a locale code is supported
     */
    isSupported(code) {
        return this.supportedLocales.some(l => l.code === code);
    },

    /**
     * Get locale config object
     */
    getLocaleConfig(code) {
        return this.supportedLocales.find(l => l.code === code) || this.supportedLocales[0];
    },

    /**
     * Apply locale settings to the HTML document
     */
    applyLocale() {
        const config = this.getLocaleConfig(this.currentLocale);
        const html = document.documentElement;

        html.setAttribute('lang', this.currentLocale);
        html.setAttribute('dir', config.dir);

        // Add RTL class for CSS styling
        if (config.dir === 'rtl') {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    },

    /**
     * Switch to a new locale
     */
    switchLocale(newLocale) {
        if (!this.isSupported(newLocale) || newLocale === this.currentLocale) return;

        this.currentLocale = newLocale;
        localStorage.setItem(this.STORAGE_KEY, newLocale);

        // Apply DOM changes
        this.applyLocale();

        // Update URL with locale param
        const url = new URL(window.location);
        url.searchParams.set('locale', newLocale);
        window.history.replaceState({}, '', url);

        // Translate static strings (immediate, no reload needed)
        this.translatePage();

        // Update switcher UI
        this.renderLanguageSwitcher();

        // Dispatch event for dynamic content modules (homepage.js, browse.js, etc.)
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: newLocale } }));

        // Reload to re-fetch CMS content in new locale
        window.location.reload();
    },

    /** Loaded locale JSON data (from locales/*.json files) */
    _localeData: {},

    /** Timeout for debounced translation */
    _translateTimeout: null,

    /** Timeout for debounced auto-translation */
    _autoTranslateTimeout: null,

    /** MutationObserver instance */
    _mutationObserver: null,

    /**
     * Load locale JSON file from locales/ directory.
     * Merges into _localeData for the given locale code.
     */
    async _loadLocaleFile(localeCode) {
        if (this._localeData[localeCode]) return; // already loaded
        try {
            const response = await fetch(`locales/${localeCode}.json`, { cache: 'default' });
            if (response.ok) {
                this._localeData[localeCode] = await response.json();
            }
        } catch {
            // Locale file not available — will use inline translations
        }
    },

    /**
     * Check if a key resolves to an actual translation (not the raw key).
     */
    _hasTranslation(key) {
        // Check inline translations
        const localeStrings = this.translations[this.currentLocale] || {};
        if (localeStrings[key]) return true;
        if (this.translations['en'] && this.translations['en'][key]) return true;
        // Check loaded locale JSON
        const jsonData = this._localeData[this.currentLocale] || {};
        if (jsonData[key]) return true;
        const enJsonData = this._localeData['en'] || {};
        if (enJsonData[key]) return true;
        // Check stored original texts
        if (this._originalTexts[key]) return true;
        return false;
    },
    /**
     * Get a translated UI string.
     * Priority: locale JSON → inline translations → original page text → raw key (last resort)
     */
    t(key, params = {}) {
        // 1. Check loaded locale JSON files (locales/*.json)
        const jsonData = this._localeData[this.currentLocale] || {};
        const enJsonData = this._localeData['en'] || {};

        // 2. Check inline translation dictionaries
        const localeStrings = this.translations[this.currentLocale] || this.translations['en'];

        // 3. Resolve with priority chain
        let text = jsonData[key]
            || localeStrings[key]
            || enJsonData[key]
            || this.translations['en'][key]
            || this._originalTexts[key]  // preserved original HTML text
            || key; // last resort fallback

        // Simple interpolation: {{count}} → params.count
        for (const [param, value] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), value);
        }

        return text;
    },

    /**
     * Translate all elements with data-i18n attributes
     * Supports: data-i18n (textContent), data-i18n-html (innerHTML),
     *           data-i18n-placeholder, data-i18n-aria, data-i18n-title
     */
    translatePage() {
        // Translate text content: data-i18n="key"
        // CRITICAL: Only replace if a real translation exists, otherwise preserve original text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && this._hasTranslation(key)) {
                el.textContent = this.t(key);
            }
            // If no translation found, leave original HTML content untouched
        });

        // Translate HTML content (for keys with <em>, <strong>, etc.): data-i18n-html="key"
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key && this._hasTranslation(key)) {
                el.innerHTML = this.t(key);
            }
        });

        // Translate placeholders: data-i18n-placeholder="key"
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.setAttribute('placeholder', this.t(key));
            }
        });

        // Translate aria-labels: data-i18n-aria="key"
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                el.setAttribute('aria-label', this.t(key));
            }
        });

        // Translate title attributes: data-i18n-title="key"
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.setAttribute('title', this.t(key));
            }
        });

        // Auto-translate common UI patterns without explicit data-i18n attributes
        this._autoTranslateCommonElements();
    },

    /**
     * Automatically translate common UI elements that may not have data-i18n attributes
     * This provides fallback translation for navigation, buttons, and common text
     */
    _autoTranslateCommonElements() {
        // Translate navigation links by their href or text content
        document.querySelectorAll('nav a, header a, .nav-link').forEach(link => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href') || '';

            // Map common navigation texts to translation keys
            const navTextMap = {
                'Home': 'home',
                'Browse': 'browse',
                'Explore': 'explore',
                'Learn': 'learn',
                'Participate': 'participate',
                'About': 'about',
                'Donate': 'donate',
                'Sign In': 'signIn',
                'Sign Out': 'signOut',
                'My Profile': 'myProfile',
                'Profile': 'profile',
                'Settings': 'settings',
                'Admin': 'admin',
                'Featured': 'featured',
                'Collections': 'collections',
                'Timelines': 'timelines',
                'Education': 'education',
                'Registry': 'registry',
                'Enterprises': 'enterprises',
                'Research': 'research',
                'Publications': 'publications',
                'Resources': 'resources',
                'Contact': 'contact',
                'About Us': 'aboutUs',
                'Founders': 'founders',
                'Contributors': 'contributors',
                'Methodology': 'methodology',
                'Editorial Standards': 'editorialStandards',
                'Nominate a Woman': 'nominateWoman',
                'Share Your Story': 'shareYourStory',
                'Contributor Guidelines': 'contributorGuidelines',
                'Browse Leaders': 'browseLeaders',
                'Apply for Verification': 'applyVerification',
                'Controlled Contributions': 'controlledContributions',
                'Partners': 'partners',
                'Fellowship': 'fellowship',
                'Reports': 'reports',
            };

            // Check if text matches a known navigation item
            for (const [englishText, translationKey] of Object.entries(navTextMap)) {
                if (text === englishText && this._hasTranslation(translationKey)) {
                    link.textContent = this.t(translationKey);
                    break;
                }
            }
        });

        // Translate buttons by their text content
        document.querySelectorAll('button, .btn, [role="button"]').forEach(btn => {
            const text = btn.textContent.trim();

            const buttonTextMap = {
                'Read More': 'readMore',
                'Learn More': 'learnMore',
                'Explore the Archive': 'exploreArchive',
                'Retry': 'retry',
                'Cancel': 'cancel',
                'Save Changes': 'saveChanges',
                'Edit Profile': 'editProfile',
                'Clear All': 'clearAll',
                'Clear History': 'clearAll',
                'Start Reading': 'readMore',
                'Browse Biographies': 'browse',
                'Share Your Story': 'shareYourStory',
            };

            for (const [englishText, translationKey] of Object.entries(buttonTextMap)) {
                if (text === englishText && this._hasTranslation(translationKey)) {
                    btn.textContent = this.t(translationKey);
                    break;
                }
            }
        });

        // Translate common headings
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            const text = heading.textContent.trim();

            const headingTextMap = {
                'Why Womencypedia?': 'whyWomencypedia',
                'Correcting Historical Imbalance': 'correctingImbalance',
                'Featured Collection': 'featuredCollection',
                'Voices of the 19th Century': 'voicesOfCentury',
                'The Global Mission': 'globalMission',
                'World Regions': 'worldRegions',
                'Languages': 'languages',
                'Historical Eras': 'historicalEras',
                'Categories': 'categories',
                'Quick Links': 'quickLinks',
                'Legal': 'legal',
                'Follow Us': 'followUs',
                'No Reading History': 'noResults',
                'No Saved Biographies': 'noResults',
                'No contributions yet': 'noResults',
                'No badges yet': 'noResults',
            };

            for (const [englishText, translationKey] of Object.entries(headingTextMap)) {
                if (text === englishText && this._hasTranslation(translationKey)) {
                    heading.textContent = this.t(translationKey);
                    break;
                }
            }
        });

        // Translate footer content
        document.querySelectorAll('footer p, footer span, footer div').forEach(el => {
            const text = el.textContent.trim();

            const footerTextMap = {
                'The world\'s first interpretive encyclopedia of women.': 'footerAbout',
                '© 2026 Womencypedia Foundation. All rights reserved.': 'copyright',
                'Privacy Policy': 'privacyPolicy',
                'Terms of Use': 'termsOfUse',
            };

            for (const [englishText, translationKey] of Object.entries(footerTextMap)) {
                if (text === englishText && this._hasTranslation(translationKey)) {
                    el.textContent = this.t(translationKey);
                    break;
                }
            }
        });

        // Translate search placeholders
        document.querySelectorAll('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').forEach(input => {
            const placeholder = input.getAttribute('placeholder') || '';
            if (placeholder.includes('Search') && this._hasTranslation('search')) {
                input.setAttribute('placeholder', this.t('search'));
            }
        });

        // Translate loading states
        document.querySelectorAll('[class*="loading"], [class*="spinner"]').forEach(el => {
            if (el.textContent.trim() === 'Loading...' && this._hasTranslation('loading')) {
                el.textContent = this.t('loading');
            }
        });
    },

    /**
     * Setup MutationObserver to watch for dynamically added elements
     * This ensures new content is translated even after initial page load
     */
    _setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;

        const observer = new MutationObserver((mutations) => {
            let shouldTranslate = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldTranslate = true;
                }
            });

            if (shouldTranslate) {
                // Debounce translation to avoid excessive calls
                clearTimeout(this._translateTimeout);
                this._translateTimeout = setTimeout(() => {
                    this.translatePage();
                    // Also auto-translate new content after a short delay
                    if (this.currentLocale !== 'en') {
                        clearTimeout(this._autoTranslateTimeout);
                        this._autoTranslateTimeout = setTimeout(() => {
                            this.autoTranslateRemainingText();
                        }, 800);
                    }
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this._mutationObserver = observer;
    },

    /**
     * Render the language switcher dropdown
     */
    renderLanguageSwitcher() {
        const containers = document.querySelectorAll('#language-switcher, .language-switcher');
        if (containers.length === 0) return;

        const currentConfig = this.getLocaleConfig(this.currentLocale);

        const html = `
            <div class="relative group">
                <button 
                    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                    aria-label="Change language"
                    id="lang-switcher-btn">
                    <span class="text-base">${currentConfig.flag}</span>
                    <span class="hidden sm:inline">${currentConfig.nativeName}</span>
                    <span class="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180">expand_more</span>
                </button>
                <div class="lang-dropdown absolute top-full right-0 mt-1 bg-white border border-border-light rounded-xl shadow-xl py-2 min-w-[200px] z-[100] hidden">
                    ${this.supportedLocales.map(locale => `
                        <button 
                            onclick="I18N.switchLocale('${locale.code}')"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${locale.code === this.currentLocale
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-main hover:bg-primary/5 hover:text-primary'}">
                            <span class="text-base">${locale.flag}</span>
                            <span class="flex-1 text-left">${locale.nativeName}</span>
                            ${locale.code === this.currentLocale ? '<span class="material-symbols-outlined text-[16px] text-primary">check</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        containers.forEach(container => {
            container.innerHTML = html;

            const btn = container.querySelector('#lang-switcher-btn');
            const dropdown = container.querySelector('.lang-dropdown');
            if (btn && dropdown) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', () => {
                    dropdown.classList.add('hidden');
                });
            }
        });
    },

    /**
     * Get locale-aware date string
     */
    formatDate(date, options = { year: 'numeric', month: 'long' }) {
        try {
            return new Intl.DateTimeFormat(this.currentLocale, options).format(new Date(date));
        } catch {
            return new Date(date).toLocaleDateString();
        }
    },

    /**
     * Get locale-aware number string
     */
    formatNumber(num) {
        try {
            return new Intl.NumberFormat(this.currentLocale).format(num);
        } catch {
            return num.toString();
        }
    },

    /**
     * Intercept ALL internal links to carry locale across pages.
     * Called once during init. Adds locale param to every <a href> 
     * pointing to a local .html page.
     */
    interceptAllLinks() {
        if (this.currentLocale === 'en') return; // default, no param needed

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Skip external links, anchors, javascript:, mailto:, tel:
            if (href.startsWith('http') || href.startsWith('#') ||
                href.startsWith('javascript:') || href.startsWith('mailto:') ||
                href.startsWith('tel:')) return;

            // Skip if already has locale param
            if (href.includes('locale=')) return;

            // Add locale to internal links
            const separator = href.includes('?') ? '&' : '?';
            link.setAttribute('href', `${href}${separator}locale=${this.currentLocale}`);
        });

        // Also update all links immediately for middle-click / right-click > open in new tab
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (href.startsWith('http') || href.startsWith('#') ||
                href.startsWith('javascript:') || href.startsWith('mailto:') ||
                href.startsWith('tel:') || href.includes('locale=')) return;

            const separator = href.includes('?') ? '&' : '?';
            link.setAttribute('href', `${href}${separator}locale=${this.currentLocale}`);
        });
    },

    /**
     * Store original English text from data-i18n elements.
     * This creates fallback translations for page-specific keys
     * that aren't in the translation dictionary yet.
     */
    _originalTexts: {},
    storeOriginalTexts() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && !this._originalTexts[key]) {
                this._originalTexts[key] = el.textContent.trim();
            }
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key && !this._originalTexts[key]) {
                this._originalTexts[key] = el.innerHTML.trim();
            }
        });
    },

    /**
     * Force re-translation of the entire page
     * Useful after dynamic content is loaded
     */
    forceRetranslate() {
        this.translatePage();
    },

    /**
     * Translate a specific element
     * @param {Element} element - The element to translate
     */
    translateElement(element) {
        if (!element) return;

        // Check for data-i18n attribute
        const key = element.getAttribute('data-i18n');
        if (key && this._hasTranslation(key)) {
            element.textContent = this.t(key);
        }

        // Check for data-i18n-html attribute
        const htmlKey = element.getAttribute('data-i18n-html');
        if (htmlKey && this._hasTranslation(htmlKey)) {
            element.innerHTML = this.t(htmlKey);
        }

        // Check for data-i18n-placeholder attribute
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            element.setAttribute('placeholder', this.t(placeholderKey));
        }

        // Check for data-i18n-aria attribute
        const ariaKey = element.getAttribute('data-i18n-aria');
        if (ariaKey) {
            element.setAttribute('aria-label', this.t(ariaKey));
        }

        // Check for data-i18n-title attribute
        const titleKey = element.getAttribute('data-i18n-title');
        if (titleKey) {
            element.setAttribute('title', this.t(titleKey));
        }
    },

    /**
     * Cleanup resources (disconnect MutationObserver)
     */
    destroy() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        if (this._translateTimeout) {
            clearTimeout(this._translateTimeout);
            this._translateTimeout = null;
        }
    },

    // ─────────────────────────────────────────────────────────
    // AUTO-TRANSLATION ENGINE
    // Automatically translates ALL remaining visible text on the
    // page that is NOT already handled by data-i18n attributes.
    // Uses MyMemory free translation API with sessionStorage cache.
    // ─────────────────────────────────────────────────────────

    /** Cache for auto-translated strings (sessionStorage-backed) */
    _autoTranslateCache: {},

    /** Whether auto-translation is currently running */
    _autoTranslating: false,

    /** Set of nodes currently being translated (to avoid duplicates) */
    _pendingNodes: new WeakSet(),

    /**
     * Load the auto-translate cache from sessionStorage
     */
    _loadAutoTranslateCache() {
        try {
            const cached = sessionStorage.getItem('womencypedia_auto_translate_cache');
            if (cached) {
                this._autoTranslateCache = JSON.parse(cached);
            }
        } catch {
            this._autoTranslateCache = {};
        }
    },

    /**
     * Save the auto-translate cache to sessionStorage
     */
    _saveAutoTranslateCache() {
        try {
            // Limit cache size to prevent sessionStorage overflow
            const keys = Object.keys(this._autoTranslateCache);
            if (keys.length > 2000) {
                // Keep only the most recent 1000 entries
                const toKeep = keys.slice(-1000);
                const trimmed = {};
                toKeep.forEach(k => { trimmed[k] = this._autoTranslateCache[k]; });
                this._autoTranslateCache = trimmed;
            }
            sessionStorage.setItem('womencypedia_auto_translate_cache', JSON.stringify(this._autoTranslateCache));
        } catch {
            // sessionStorage full — silently continue
        }
    },

    /**
     * Get a cache key for a translation
     */
    _cacheKey(text, targetLang) {
        return `${targetLang}:${text.substring(0, 200)}`;
    },

    /**
     * Translate text using the MyMemory Translation API (free, no API key needed)
     * Falls back gracefully if the API is unavailable.
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code (e.g., 'fr', 'es')
     * @returns {Promise<string>} Translated text, or original if translation fails
     */
    async _translateText(text, targetLang) {
        if (!text || !text.trim() || targetLang === 'en') return text;

        const cacheKey = this._cacheKey(text, targetLang);

        // Check cache first
        if (this._autoTranslateCache[cacheKey]) {
            return this._autoTranslateCache[cacheKey];
        }

        try {
            const encodedText = encodeURIComponent(text.trim());
            const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}&de=rev@womencypedia.org`;
            
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });

            if (!response.ok) return text;

            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                let translated = data.responseData.translatedText;

                // MyMemory sometimes returns the input in uppercase when it can't translate
                if (translated.toUpperCase() === text.toUpperCase() && translated !== text) {
                    return text;
                }

                // Cache the result
                this._autoTranslateCache[cacheKey] = translated;
                return translated;
            }

            return text;
        } catch {
            // API unavailable — return original
            return text;
        }
    },

    /**
     * Batch translate multiple texts (groups API calls for efficiency)
     * @param {Array<{text: string, node: Node}>} items - Array of text/node pairs
     * @param {string} targetLang - Target language code
     */
    async _batchTranslate(items, targetLang) {
        // Process in batches of 5 to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const promises = batch.map(async (item) => {
                const translated = await this._translateText(item.text, targetLang);
                if (translated !== item.text && item.node) {
                    item.node.textContent = translated;
                }
            });
            await Promise.all(promises);

            // Small delay between batches to respect rate limits
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    },

    /**
     * Check if an element should be skipped from auto-translation
     */
    _shouldSkipElement(el) {
        // Skip elements that are handled by data-i18n
        if (el.hasAttribute && (
            el.hasAttribute('data-i18n') ||
            el.hasAttribute('data-i18n-html') ||
            el.hasAttribute('data-i18n-placeholder') ||
            el.hasAttribute('data-i18n-title') ||
            el.hasAttribute('data-i18n-aria') ||
            el.hasAttribute('data-no-translate')
        )) {
            return true;
        }

        // Skip script, style, code elements
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (['script', 'style', 'code', 'pre', 'noscript', 'svg', 'math', 'iframe'].includes(tag)) {
            return true;
        }

        // Skip hidden elements
        if (el.offsetParent === null && tag !== 'body' && tag !== 'html') {
            return true;
        }

        // Skip the language switcher itself
        if (el.closest && (el.closest('#language-switcher') || el.closest('.language-switcher') || el.closest('.lang-dropdown'))) {
            return true;
        }

        return false;
    },

    /**
     * Collect all text nodes that need translation
     * @param {Element} root - Root element to search within
     * @returns {Array<{text: string, node: Node}>}
     */
    _collectTranslatableTextNodes(root) {
        const items = [];
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip empty or whitespace-only nodes
                    const text = node.textContent.trim();
                    if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;

                    // Skip if already pending translation
                    if (this._pendingNodes.has(node)) return NodeFilter.FILTER_REJECT;

                    // Skip if parent should be excluded
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (this._shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;

                    // Check if ANY ancestor has data-i18n (already translated)
                    let ancestor = parent;
                    while (ancestor && ancestor !== root) {
                        if (ancestor.hasAttribute && (
                            ancestor.hasAttribute('data-i18n') ||
                            ancestor.hasAttribute('data-i18n-html')
                        )) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        ancestor = ancestor.parentElement;
                    }

                    // Skip numbers-only, single characters, URLs, emails
                    if (/^[\d\s.,;:!?%$€£¥+\-*/=()[\]{}#@&|~^`"'<>\\]+$/.test(text)) return NodeFilter.FILTER_REJECT;
                    if (/^https?:\/\//.test(text)) return NodeFilter.FILTER_REJECT;
                    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text)) return NodeFilter.FILTER_REJECT;

                    // Skip very short text that's likely an icon or symbol
                    if (text.length <= 2 && !/[a-zA-Z]{2,}/.test(text)) return NodeFilter.FILTER_REJECT;

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            items.push({ text, node });
            this._pendingNodes.add(node);
        }

        return items;
    },

    /**
     * Auto-translate all remaining text on the page.
     * Called after translatePage() to handle text NOT covered by data-i18n.
     */
    async autoTranslateRemainingText() {
        if (this.currentLocale === 'en' || this._autoTranslating) return;

        this._autoTranslating = true;
        this._loadAutoTranslateCache();

        try {
            const items = this._collectTranslatableTextNodes(document.body);
            
            if (items.length === 0) {
                this._autoTranslating = false;
                return;
            }

            console.log(`[i18n] Auto-translating ${items.length} text nodes to ${this.currentLocale}...`);

            // First pass: apply cached translations immediately
            const uncached = [];
            items.forEach(item => {
                const cacheKey = this._cacheKey(item.text, this.currentLocale);
                if (this._autoTranslateCache[cacheKey]) {
                    item.node.textContent = this._autoTranslateCache[cacheKey];
                } else {
                    uncached.push(item);
                }
            });

            if (uncached.length > 0) {
                console.log(`[i18n] ${items.length - uncached.length} from cache, ${uncached.length} need API translation`);
                // Translate uncached items via API
                await this._batchTranslate(uncached, this.currentLocale);
                // Save new translations to cache
                this._saveAutoTranslateCache();
            }

            console.log(`[i18n] Auto-translation complete`);
        } catch (error) {
            console.warn('[i18n] Auto-translation error:', error.message);
        } finally {
            this._autoTranslating = false;
        }
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Store original English text BEFORE translating
    I18N.storeOriginalTexts();

    // Load locale JSON files (en.json + current locale)
    await I18N._loadLocaleFile('en');
    const urlLocale = new URLSearchParams(window.location.search).get('locale');
    const storedLocale = localStorage.getItem(I18N.STORAGE_KEY);
    const targetLocale = urlLocale || storedLocale || navigator.language?.split('-')[0] || 'en';
    if (targetLocale !== 'en' && I18N.isSupported(targetLocale)) {
        await I18N._loadLocaleFile(targetLocale);
    }

    I18N.init();
    // Intercept links AFTER init so locale is set
    I18N.interceptAllLinks();

    // Auto-translate remaining text that isn't covered by data-i18n
    // This runs after a short delay to let the page fully render
    if (I18N.currentLocale !== 'en') {
        setTimeout(() => {
            I18N.autoTranslateRemainingText();
        }, 500);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18N;
}