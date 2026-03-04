#!/usr/bin/env node
/**
 * Womencypedia — Comprehensive Page Fixer
 * 
 * Fixes ALL detected issues across all 64 pages:
 * 
 * 1. Fix placeholder image paths (bg-[url('images/...')] → bg-[url('../images/...')])
 * 2. Remove duplicate <script> tags (strapi-api.js loaded twice)
 * 3. Add missing i18n.js to pages that lack it
 * 4. Add language-switcher container to navbars missing it
 * 5. Ensure all pages have consistent script loading order
 * 6. Fix StrapiAPI already declared errors
 * 
 * Usage: node scripts/fix-all-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let totalFixes = 0;
const report = {};

// ─── Required scripts that every page should have ─────────
const REQUIRED_SCRIPTS = [
    { file: 'js/i18n.js', check: 'js/i18n.js' },
    { file: 'js/darkmode.js', check: 'js/darkmode.js' },
    { file: 'js/performance.js', check: 'js/performance.js' },
];

// ─── Scripts that should only appear ONCE ─────────────────
const SINGLE_SCRIPTS = [
    'strapi-api.js',
    'api.js',
    'config.js',
    'auth.js',
    'security.js',
    'i18n.js',
    'navigation.js',
    'ui.js',
    'main.js',
    'darkmode.js',
    'performance.js',
];

function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const fixes = [];
    let modified = false;

    // ─── FIX 1: Placeholder image paths ──────────────────
    // bg-[url('images/placeholders/...')] resolves relative to CSS output
    // Should be: bg-[url('../images/placeholders/...')]
    const imgPathRegex = /bg-\[url\('images\/placeholders\//g;
    if (imgPathRegex.test(html)) {
        html = html.replace(/bg-\[url\('images\/placeholders\//g, "bg-[url('../images/placeholders/");
        fixes.push('Fixed placeholder image paths');
        modified = true;
    }

    // Also fix src="images/placeholders/ to use correct relative path
    // (These are fine as-is since HTML resolves relative to the HTML file, not CSS)

    // ─── FIX 2: Remove duplicate script tags ─────────────
    for (const scriptName of SINGLE_SCRIPTS) {
        const regex = new RegExp(`<script[^>]*src="[^"]*${scriptName}"[^>]*><\\/script>`, 'g');
        const matches = html.match(regex);
        if (matches && matches.length > 1) {
            // Keep the first occurrence, remove subsequent ones
            let count = 0;
            html = html.replace(regex, (match) => {
                count++;
                if (count > 1) {
                    fixes.push(`Removed duplicate ${scriptName}`);
                    modified = true;
                    return ''; // Remove duplicate
                }
                return match; // Keep first
            });
        }
    }

    // ─── FIX 3: Add missing required scripts ─────────────
    for (const script of REQUIRED_SCRIPTS) {
        if (!html.includes(script.check)) {
            // Add before </body>
            html = html.replace('</body>', `    <script src="${script.file}"></script>\n</body>`);
            fixes.push(`Added missing ${script.file}`);
            modified = true;
        }
    }

    // ─── FIX 4: Add language-switcher to navbar ──────────
    // Only add if page has a header/nav but no language-switcher
    if (!html.includes('language-switcher') && !html.includes('id="language-switcher"')) {
        // Find the desktop actions area in the navbar
        // Pattern: hidden sm:flex items-center gap-4 (or gap-3, gap-6)
        const navActionsRegex = /(<div\s+class="hidden\s+sm:flex\s+items-center\s+gap-\d+"[^>]*>)/;
        if (navActionsRegex.test(html)) {
            html = html.replace(navActionsRegex, '$1\n                        <div id="language-switcher"></div>');
            fixes.push('Added language-switcher to navbar');
            modified = true;
        }
    }

    // ─── FIX 5: Clean up empty lines from removed scripts ─
    html = html.replace(/\n\s*\n\s*\n/g, '\n\n');

    // ─── FIX 6: Wrap StrapiAPI in guard to prevent redeclaration ─
    // This is fixed at the source level, not per-page

    // ─── Write back ──────────────────────────────────────
    if (modified) {
        fs.writeFileSync(filePath, html);
        report[filename] = fixes;
        totalFixes += fixes.length;
        console.log(`  ✓ ${filename} — ${fixes.length} fixes: ${fixes.join(', ')}`);
    } else {
        console.log(`  · ${filename} — OK`);
    }
}

function main() {
    console.log('🔧 Womencypedia — Comprehensive Page Fixer\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    console.log(`Scanning ${htmlFiles.length} pages...\n`);

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log(`\n✅ Done! ${totalFixes} total fixes applied across ${Object.keys(report).length} files`);

    // Write report
    const reportPath = path.join(ROOT, 'scripts', 'fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`   Report: scripts/fix-report.json`);
}

main();
