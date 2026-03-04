#!/usr/bin/env node
/**
 * Womencypedia — Add global scripts to ALL HTML pages
 * 
 * Adds darkmode.js and performance.js <script> tags to all pages
 * that don't already have them.
 * 
 * Also adds Plausible analytics to all pages.
 * 
 * Usage: node scripts/add-global-scripts.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Scripts to add before </body>
const SCRIPTS_TO_ADD = [
    { tag: '<script src="js/darkmode.js"></script>', check: 'darkmode.js' },
    { tag: '<script src="js/performance.js"></script>', check: 'performance.js' },
];

// Analytics to add in <head>
const ANALYTICS_TAG = '<script defer data-domain="womencypedia.org" src="https://plausible.io/js/script.js"></script>';
const ANALYTICS_CHECK = 'plausible.io';

function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    let modified = false;

    // 1. Add analytics in <head> if not present
    if (!html.includes(ANALYTICS_CHECK)) {
        html = html.replace('</head>', `    ${ANALYTICS_TAG}\n</head>`);
        modified = true;
    }

    // 2. Add scripts before </body> if not present
    for (const script of SCRIPTS_TO_ADD) {
        if (!html.includes(script.check)) {
            html = html.replace('</body>', `    ${script.tag}\n</body>`);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, html);
        console.log(`  ✓ ${filename}`);
    } else {
        console.log(`  · ${filename} — already up to date`);
    }
}

function main() {
    console.log('📦 Adding global scripts to all pages...\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    console.log(`Processing ${htmlFiles.length} pages\n`);

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log('\n✅ Done!');
    console.log('   Added: darkmode.js, performance.js, Plausible analytics');
}

main();
