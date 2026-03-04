#!/usr/bin/env node
/**
 * Womencypedia — i18n Auto-Tagger
 * 
 * Scans ALL HTML pages and automatically adds data-i18n / data-i18n-html / 
 * data-i18n-placeholder attributes to translatable elements.
 * 
 * Strategy:
 *   1. Shared elements (navbar, footer, search) get COMMON keys
 *   2. Page-specific headings/paragraphs/buttons get PAGE-PREFIXED keys
 *   3. Generates a translation-keys.json manifest of all keys found
 * 
 * Usage: node scripts/i18n-tagger.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_DIR = ROOT;

// ─── Shared element patterns (nav, footer, common UI) ─────────
// These get the SAME i18n key across all pages
const SHARED_PATTERNS = [
    // Navbar links
    { selector: /href="donate\.html"[^>]*>([^<]+)</g, key: 'donate', group: 'nav' },
    { selector: /data-auth="signin"[^>]*>\s*([^<]+)/g, key: 'signIn', group: 'nav' },

    // Search placeholders - already handled via data-i18n-placeholder
];

// ─── Elements to tag per page ──────────────────────────────────
// CSS-like rules for what gets tagged automatically
const TAG_RULES = [
    // Any <h1> without data-i18n already
    { tag: 'h1', attr: 'data-i18n-html' },
    // Any <h2> without data-i18n already  
    { tag: 'h2', attr: 'data-i18n' },
    // Any <h3> without data-i18n already
    { tag: 'h3', attr: 'data-i18n' },
];

// ─── Regex-based HTML transformer ──────────────────────────────

/**
 * Generate a camelCase key from text content
 */
function textToKey(text, prefix = '') {
    // Clean the text
    let clean = text
        .replace(/<[^>]+>/g, '')           // strip HTML tags
        .replace(/[^\w\s]/g, '')           // strip special chars
        .replace(/\s+/g, ' ')             // normalize spaces
        .trim()
        .substring(0, 50);                // cap length

    // Convert to camelCase
    const words = clean.split(' ').filter(w => w.length > 0);
    if (words.length === 0) return '';

    const camel = words[0].toLowerCase() +
        words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    return prefix ? `${prefix}.${camel}` : camel;
}

/**
 * Get page prefix from filename
 */
function getPagePrefix(filename) {
    return filename
        .replace('.html', '')
        .replace(/-/g, '_')
        .replace(/\./g, '_');
}

/**
 * Process a single HTML file — add data-i18n attributes to common elements
 */
function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const prefix = getPagePrefix(filename);
    const keysFound = {};
    let modified = false;

    // ─── 1. Tag search input placeholders ────────────────────
    html = html.replace(
        /(<input[^>]*type="search"[^>]*placeholder="[^"]*"[^>]*)(\/?>)/gi,
        (match, before, close) => {
            if (before.includes('data-i18n-placeholder')) return match;
            modified = true;
            return `${before} data-i18n-placeholder="search"${close}`;
        }
    );

    // ─── 2. Tag Donate links ─────────────────────────────────
    html = html.replace(
        /(<a[^>]*href="donate\.html"[^>]*)>(\s*Donate\s*)<\/a>/gi,
        (match, attrs, text) => {
            if (attrs.includes('data-i18n')) return match;
            modified = true;
            keysFound['donate'] = 'Donate';
            return `${attrs} data-i18n="donate">${text}</a>`;
        }
    );

    // ─── 3. Tag Sign In buttons ──────────────────────────────
    html = html.replace(
        /(<button[^>]*data-auth="signin"[^>]*)>\s*(Sign In)\s*<\/button>/gi,
        (match, attrs, text) => {
            if (attrs.includes('data-i18n')) return match;
            modified = true;
            keysFound['signIn'] = 'Sign In';
            return `${attrs} data-i18n="signIn">\n                            ${text}\n                        </button>`;
        }
    );

    // ─── 4. Tag nav menu text links ──────────────────────────
    const navLinks = {
        'Explore': 'explore',
        'Learn': 'learn',
        'Participate': 'participate',
        'About': 'about',
        'Home': 'home',
        'Browse': 'browse',
        'Featured': 'featured',
        'Collections': 'collections',
        'Timelines': 'timelines',
        'Education': 'education',
        'Registry': 'registry',
        'Enterprises': 'enterprises',
        'Research': 'research',
        'Publications': 'publications',
        'Resources': 'resources',
    };

    // Tag navbar dropdown header spans
    for (const [text, key] of Object.entries(navLinks)) {
        // Match nav link spans/text that say exactly this word
        const regex = new RegExp(
            `(<(?:span|a)[^>]*class="[^"]*navbar__nav-link[^"]*"[^>]*)>(\\s*${text}\\s*)<\\/(?:span|a)>`,
            'gi'
        );
        html = html.replace(regex, (match, attrs, content) => {
            if (attrs.includes('data-i18n')) return match;
            modified = true;
            keysFound[key] = text;
            return `${attrs} data-i18n="${key}">${content}</${match.endsWith('</a>') ? 'a' : 'span'}>`;
        });
    }

    // ─── 5. Tag page-specific headings (h1, h2, h3) ─────────
    // Only tag if they don't already have data-i18n
    for (const level of ['h1', 'h2', 'h3']) {
        const regex = new RegExp(
            `(<${level}[^>]*)>([^<]{3,})<\/${level}>`,
            'gi'
        );
        html = html.replace(regex, (match, attrs, text) => {
            if (attrs.includes('data-i18n')) return match;
            const trimmed = text.trim();
            if (trimmed.length < 3 || trimmed.length > 200) return match;
            // Skip if it's a number or mostly special chars
            if (/^\d+$/.test(trimmed)) return match;

            const key = `${prefix}.${textToKey(trimmed)}`;
            if (!key || key.endsWith('.')) return match;

            modified = true;
            keysFound[key] = trimmed;
            return `${attrs} data-i18n="${key}">${text}</${level}>`;
        });
    }

    // ─── 6. Tag page title in <title> tag ────────────────────
    // We actually should NOT tag <title> since it's not visible,
    // but we can use JavaScript to set it. Skip for now.

    // ─── 7. Tag common button/link text ──────────────────────
    const buttonTexts = {
        'Read More': 'readMore',
        'Read Biography': 'readBiography',
        'Learn More': 'learnMore',
        'Explore': 'explore',
        'Sign Up': 'signUp',
        'Subscribe': 'subscribe',
        'Submit': 'submit',
        'Save Changes': 'saveChanges',
        'Cancel': 'cancel',
        'Retry': 'retry',
        'Edit Profile': 'editProfile',
        'Share Your Story': 'shareYourStory',
        'Nominate a Woman': 'nominateWoman',
        'Explore the Archive': 'exploreArchive',
        'Apply Now': 'applyNow',
        'Contact Us': 'contactUs',
        'Get Started': 'getStarted',
        'View All': 'viewAll',
        'See More': 'seeMore',
        'Back to Home': 'backToHome',
        'Go Back': 'goBack',
        'Privacy Policy': 'privacyPolicy',
        'Terms of Use': 'termsOfUse',
        'Support Our Mission': 'supportMission',
    };

    for (const [text, key] of Object.entries(buttonTexts)) {
        // Match <a> or <button> elements containing this exact text
        const regex = new RegExp(
            `(>)(\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*)(</(?:a|button)>)`,
            'g'
        );
        html = html.replace(regex, (match, open, content, close) => {
            // Check if parent already has data-i18n
            // Simple heuristic: look back for data-i18n in the same line
            modified = true;
            keysFound[key] = text;
            return `><span data-i18n="${key}">${content.trim()}</span>${close}`;
        });
    }

    // ─── 8. Tag footer copyright ─────────────────────────────
    html = html.replace(
        /(<p[^>]*)>((?:\s|&copy;|©)*20\d{2}\s+Womencypedia[^<]*)<\/p>/gi,
        (match, attrs, text) => {
            if (attrs.includes('data-i18n')) return match;
            modified = true;
            keysFound['copyright'] = text.trim();
            return `${attrs} data-i18n="copyright">${text}</p>`;
        }
    );

    // ─── Write back ──────────────────────────────────────────
    if (modified) {
        fs.writeFileSync(filePath, html);
        console.log(`  ✓ ${filename} — ${Object.keys(keysFound).length} keys`);
    } else {
        console.log(`  · ${filename} — no changes`);
    }

    return keysFound;
}

// ─── Main ────────────────────────────────────────────────────

function main() {
    console.log('🏷️  Womencypedia i18n Auto-Tagger\n');

    // Find all HTML files in root
    const htmlFiles = fs.readdirSync(HTML_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(HTML_DIR, f))
        .sort();

    console.log(`Found ${htmlFiles.length} HTML pages\n`);

    const allKeys = {};

    for (const file of htmlFiles) {
        const keys = processFile(file);
        Object.assign(allKeys, keys);
    }

    // Write manifest
    const manifestPath = path.join(ROOT, 'scripts', 'translation-keys.json');
    fs.writeFileSync(manifestPath, JSON.stringify(allKeys, null, 2));

    console.log(`\n✅ Done! ${Object.keys(allKeys).length} unique keys found`);
    console.log(`   Manifest: scripts/translation-keys.json`);
    console.log(`\n💡 Next: Add missing keys to js/i18n.js translations object`);
}

main();
