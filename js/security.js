/**
 * Womencypedia Security Module
 * 
 * Provides XSS protection and content sanitization.
 * Uses DOMPurify for HTML sanitization.
 * 
 * @module security
 */

const Security = {
    /**
     * Initialize security module
     * Loads DOMPurify from CDN if not already loaded
     */
    async init() {
        if (typeof DOMPurify !== 'undefined') {
            console.info('[Security] DOMPurify already loaded');
            return;
        }

        // Try to load DOMPurify from CDN
        try {
            await this.loadDOMPurify();
            console.info('[Security] DOMPurify loaded successfully');
        } catch (error) {
            console.warn('[Security] Failed to load DOMPurify, using fallback sanitizer');
        }
    },

    /**
     * Load DOMPurify from CDN
     */
    loadDOMPurify() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.4/purify.min.js';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} html - HTML string to sanitize
     * @param {Object} options - DOMPurify options
     * @returns {string} - Sanitized HTML string
     */
    sanitize(html, options = {}) {
        if (!html) return '';

        // Use DOMPurify if available
        if (typeof DOMPurify !== 'undefined') {
            const defaultOptions = {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'u', 's', 'span',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
                    'a', 'img',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'hr', 'div'
                ],
                ALLOWED_ATTR: [
                    'href', 'title', 'target', 'rel',
                    'src', 'alt', 'width', 'height',
                    'class', 'id',
                    'data-*'
                ],
                ALLOW_DATA_ATTR: true,
                ADD_ATTR: ['target'],
                FORCE_BODY: true,
                ...options
            };

            return DOMPurify.sanitize(html, defaultOptions);
        }

        // Fallback: Basic HTML escaping for dangerous characters
        return this.escapeHtml(html);
    },

    /**
     * Escape HTML special characters
     * Use this for plain text that should not contain any HTML
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';

        const map = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };

        return String(text).replace(/[&<>"'`=/]/g, char => map[char]);
    },

    /**
     * Unescape HTML entities
     * @param {string} text - Text with HTML entities
     * @returns {string} - Unescaped text
     */
    unescapeHtml(text) {
        if (!text) return '';

        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    },

    /**
     * Sanitize URL to prevent javascript: and data: URLs
     * @param {string} url - URL to sanitize
     * @returns {string} - Safe URL or empty string
     */
    sanitizeUrl(url) {
        if (!url) return '';

        // Trim whitespace
        url = url.trim();

        // Allow relative URLs
        if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
            return url;
        }

        // Check for allowed protocols
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

        try {
            const parsedUrl = new URL(url);
            if (allowedProtocols.includes(parsedUrl.protocol)) {
                return url;
            }
        } catch (e) {
            // Invalid URL, return empty
            return '';
        }

        // Block dangerous protocols (javascript:, data:, vbscript:, etc.)
        const dangerousProtocols = /^(javascript|data|vbscript|file|blob):/i;
        if (dangerousProtocols.test(url)) {
            return '';
        }

        return url;
    },

    /**
     * Sanitize object by sanitizing all string values
     * @param {Object} obj - Object to sanitize
     * @returns {Object} - Sanitized object
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitize(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    },

    /**
     * Create a safe HTML string for innerHTML assignment
     * @param {string} html - HTML content
     * @param {Object} options - Sanitization options
     * @returns {string} - Safe HTML string
     */
    safeHtml(html, options = {}) {
        return this.sanitize(html, options);
    },

    /**
     * Set innerHTML safely on an element
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML content
     * @param {Object} options - Sanitization options
     */
    setInnerHTML(element, html, options = {}) {
        if (!element) return;
        element.innerHTML = this.sanitize(html, options);
    },

    /**
     * Set textContent safely (no HTML parsing)
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content
     */
    setTextContent(element, text) {
        if (!element) return;
        element.textContent = text;
    },

    /**
     * Create an element with safe attribute setting
     * @param {string} tagName - Element tag name
     * @param {Object} attributes - Element attributes
     * @param {string} innerHTML - Inner HTML content (will be sanitized)
     * @returns {HTMLElement} - Created element
     */
    createElement(tagName, attributes = {}, innerHTML = '') {
        const element = document.createElement(tagName);

        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'href' || key === 'src') {
                element.setAttribute(key, this.sanitizeUrl(value));
            } else if (key === 'innerHTML') {
                element.innerHTML = this.sanitize(value);
            } else if (key.startsWith('on')) {
                // Skip event handlers for security
                console.warn(`[Security] Skipping event handler: ${key}`);
            } else {
                element.setAttribute(key, this.escapeHtml(value));
            }
        }

        if (innerHTML) {
            element.innerHTML = this.sanitize(innerHTML);
        }

        return element;
    },

    /**
     * Validate and sanitize form input
     * @param {string} input - User input
     * @param {string} type - Input type (text, email, url, etc.)
     * @returns {string} - Sanitized input
     */
    sanitizeInput(input, type = 'text') {
        if (!input) return '';

        // Trim whitespace
        input = String(input).trim();

        switch (type) {
            case 'email':
                // Remove dangerous characters from email
                return input.replace(/[<>"'\s]/g, '');

            case 'url':
                return this.sanitizeUrl(input);

            case 'number':
                // Only allow numeric characters, decimal point, and minus
                return input.replace(/[^0-9.\-]/g, '');

            case 'tel':
                // Only allow phone number characters
                return input.replace(/[^0-9+\-()\s]/g, '');

            case 'html':
                return this.sanitize(input);

            case 'text':
            default:
                return this.escapeHtml(input);
        }
    },

    /**
     * Generate a Content Security Policy nonce
     * @returns {string} - Random nonce
     */
    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array));
    },

    /**
     * Check if a string contains potentially dangerous content
     * @param {string} content - Content to check
     * @returns {boolean} - True if dangerous content detected
     */
    containsDangerousContent(content) {
        if (!content) return false;

        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:\s*text\/html/gi,
            /vbscript:/gi,
            /expression\s*\(/gi,
            /@import/gi,
            /url\s*\(/gi
        ];

        return dangerousPatterns.some(pattern => pattern.test(content));
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Security.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Security;
}

// Expose Security globally for browser usage
if (typeof window !== 'undefined') {
    window.Security = Security;
}