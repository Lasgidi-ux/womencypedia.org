#!/usr/bin/env node
/**
 * Womencypedia — Add language switcher to ALL remaining pages
 * 
 * Handles multiple navbar patterns found across the site.
 * 
 * Usage: node scripts/add-lang-switcher.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);

    // Skip if already has language-switcher
    if (html.includes('language-switcher') || html.includes('id="language-switcher"')) {
        return false;
    }

    // Skip pure error pages (403, 404, 500) — they don't need locale switching
    if (['403.html', '404.html', '500.html'].includes(filename)) {
        return false;
    }

    // Pattern 1: Pages with "flex items-center gap-3" at the top-level navbar
    // Insert into the first such container
    const pattern1 = /(<div\s+class="flex\s+items-center\s+gap-3"[^>]*>)/;
    if (pattern1.test(html)) {
        html = html.replace(pattern1, '$1\n            <div id="language-switcher"></div>');
        fs.writeFileSync(filePath, html);
        console.log(`  ✓ ${filename} — added (pattern: gap-3 container)`);
        return true;
    }

    // Pattern 2: Pages with a nav header containing logo link back to index.html
    // Insert after the nav's right-side actions
    const pattern2 = /(<header[^>]*>[\s\S]*?)(<!--\s*Actions?\s*-->|<div\s+class="[^"]*gap-[36]\b[^"]*"[^>]*>)/;
    if (pattern2.test(html)) {
        html = html.replace(pattern2, '$1$2\n                <div id="language-switcher"></div>');
        fs.writeFileSync(filePath, html);
        console.log(`  ✓ ${filename} — added (pattern: header actions)`);
        return true;
    }

    // Pattern 3: Generic — just add before the closing </header> tag
    if (html.includes('</header>')) {
        html = html.replace('</header>', '    <div id="language-switcher" class="hidden lg:block"></div>\n        </header>');
        fs.writeFileSync(filePath, html);
        console.log(`  ✓ ${filename} — added (pattern: before </header>)`);
        return true;
    }

    console.log(`  · ${filename} — skipped (no suitable container)`);
    return false;
}

function main() {
    console.log('🌐 Adding language switcher to remaining pages...\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    let added = 0;
    for (const file of htmlFiles) {
        if (processFile(file)) added++;
    }

    console.log(`\n✅ Done! Language switcher added to ${added} more pages`);
}

main();
