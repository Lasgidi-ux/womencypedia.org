#!/usr/bin/env node
/**
 * Womencypedia — Targeted Fix for Remaining Nav Issues
 * 
 * Catches patterns that the first script missed due to 
 * slightly different HTML formatting across pages.
 * 
 * Usage: node scripts/fix-nav-remaining.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let totalFixes = 0;

function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const original = html;
    const fixes = [];

    // ─── Pattern 1: Remove "My Profile" header with different whitespace ─
    // <h3 ...>  My Profile</h3> section blocks in mobile menus
    const mobileProfileBlock = /\s*<div class="px-6 pb-4">\s*<h3[^>]*>\s*My Profile<\/h3>\s*[\s\S]*?<\/div>\s*(?=\s*(?:<!--|<div class="px-6 pb-8|<\/nav>))/g;
    if (mobileProfileBlock.test(html)) {
        html = html.replace(mobileProfileBlock, '\n');
        fixes.push('Removed My Profile mobile block');
    }

    // ─── Pattern 2: Remove desktop dropdown containing Profile/Admin/Sample ─
    // <a href="profile.html"...>My  <a data-auth="admin-only"...>Admin</a><a href="biography.html"...>Sample Biography</a>
    const desktopDropdownItems = /\s*<a\s+href="profile\.html"[\s\S]*?My[\s\S]*?(?:Admin<\/a>[\s\S]*?)?(?:Sample[\s\S]*?Biography<\/a>)/g;
    if (desktopDropdownItems.test(html)) {
        html = html.replace(desktopDropdownItems, '');
        fixes.push('Removed Profile/Admin/Biography dropdown items');
    }

    // ─── Pattern 3: Remove remaining "Sample Biography" links in nav dropdowns ─
    // <a href="biography.html" ...>Sample\n                                        Biography</a>
    const sampleBioMultiline = /<a[^>]*href="biography\.html"[^>]*>[\s]*Sample[\s]*Biography[\s]*<\/a>/g;
    if (sampleBioMultiline.test(html)) {
        html = html.replace(sampleBioMultiline, '');
        fixes.push('Removed multiline Sample Biography link');
    }

    // ─── Pattern 4: Remove visible Admin links in mobile menu bottom ─
    // Some pages have standalone Admin links that aren't hidden
    const visibleAdminMobile = /<a\s+href="admin\.html"\s+class="block py-3[^"]*">\s*Admin\s*<\/a>/g;
    if (visibleAdminMobile.test(html)) {
        html = html.replace(visibleAdminMobile, '');
        fixes.push('Removed visible Admin from mobile menu');
    }

    // ─── Pattern 5: Fix footer icon logos ─
    // In footer: <span class="material-symbols-outlined text-primary text-2xl">history_edu</span>
    const footerIconLogoPattern = /(<footer[\s\S]*?)<span\s+class="material-symbols-outlined\s+text-primary\s+text-2xl">history_edu<\/span>/g;
    if (footerIconLogoPattern.test(html)) {
        html = html.replace(footerIconLogoPattern, '$1<img src="images/womencypedia-logo.png" alt="Womencypedia" class="h-8 w-auto">');
        fixes.push('Fixed footer logo');
    }

    // ─── Clean up double blank lines ─
    html = html.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n');

    if (html !== original) {
        fs.writeFileSync(filePath, html);
        totalFixes += fixes.length;
        console.log(`  ✓ ${filename} — ${fixes.join(', ')}`);
    }
}

function main() {
    console.log('🔧 Targeted Nav/Footer cleanup (pass 2)...\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log(`\n✅ Done! ${totalFixes} additional fixes applied`);
}

main();
