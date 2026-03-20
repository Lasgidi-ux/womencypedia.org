/**
 * Fix CSP to allow OpenStreetMap tiles and other missing domains
 * Run with: node scripts/fix-csp-tiles.js
 */

const fs = require('fs');
const path = require('path');

const HTML_DIR = __dirname + '/..';

// List of all HTML files to fix
const htmlFiles = [
    'index.html',
    'about.html',
    'accessibility.html',
    'apply-verification.html',
    'biography-hypatia.html',
    'biography-maria-sabina.html',
    'biography.html',
    'browse-leaders.html',
    'browse.html',
    'careers.html',
    'collection.html',
    'collections.html',
    'community.html',
    'contact.html',
    'contributor-guidelines.html',
    'contributors.html',
    'controlled-contributions.html',
    'cookies.html',
    'donate.html',
    'editorial-standards.html',
    'education-module-1.html',
    'education-module-2.html',
    'education-module-3.html',
    'education-module-4.html',
    'education-module-5.html',
    'education-module-6.html',
    'education-module-7.html',
    'education-module-template.html',
    'education-module.html',
    'education.html',
    'enterprises.html',
    'faq.html',
    'featured.html',
    'fellowship.html',
    'forgot-password.html',
    'founders.html',
    'help.html',
    'leader-profile.html',
    'login.html',
    'methodology.html',
    'nominate.html',
    'partners.html',
    'press.html',
    'pricing.html',
    'privacy-policy.html',
    'profile.html',
    'publications.html',
    'reports.html',
    'research.html',
    'reset-password.html',
    'resources.html',
    'search.html',
    'settings.html',
    'share-story.html',
    'signup.html',
    'sitemap-page.html',
    'terms-of-use.html',
    'timelines.html',
    'verify-email.html',
    // Collection pages
    'collections/african-queens.html',
    'collections/conflict-peace.html',
    'collections/diaspora.html',
    'collections/foremothers.html',
    'collections/indigenous-matriarchs.html',
    'collections/missionary-women.html'
];

function fixCSP(content) {
    // The issue is that the service worker's fetch requests violate CSP
    // The solution is to add openstreetmap tiles to connect-src and img-src

    // Check if CSP exists
    if (!content.includes('Content-Security-Policy')) {
        console.log('  No CSP found, skipping');
        return content;
    }

    // Add openstreetmap to connect-src and img-src
    // Current: connect-src 'self' ... https://*.secureserver.net
    // Need to add: https://*.tile.openstreetmap.org

    // Add tile.openstreetmap.org to connect-src
    let updated = content.replace(
        /connect-src 'self'([^;]*https:\/\/[^;]*secureserver\.net)/,
        "connect-src 'self'$1 https://*.tile.openstreetmap.org"
    );

    // If not already added, try another pattern
    if (updated === content) {
        updated = content.replace(
            /(connect-src 'self'[^;]*);/,
            "$1 https://*.tile.openstreetmap.org;"
        );
    }

    // Add tile.openstreetmap.org to img-src  
    updated = updated.replace(
        /img-src 'self' data: blob: https:/,
        "img-src 'self' data: blob: https://*.tile.openstreetmap.org https:"
    );

    return updated;
}

console.log('Fixing CSP for OpenStreetMap tiles...\n');

let fixedCount = 0;
let errorCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(HTML_DIR, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠ File not found: ${file}`);
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        content = fixCSP(content);

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Fixed CSP: ${file}`);
            fixedCount++;
        } else {
            console.log(`○ No changes: ${file}`);
        }
    } catch (err) {
        console.error(`✗ Error processing ${file}: ${err.message}`);
        errorCount++;
    }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log(`○ Skipped ${htmlFiles.length - fixedCount - errorCount} files (no changes needed)`);
if (errorCount > 0) {
    console.log(`✗ Errors: ${errorCount}`);
}
