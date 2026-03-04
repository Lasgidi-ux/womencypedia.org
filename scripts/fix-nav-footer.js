#!/usr/bin/env node
/**
 * Womencypedia — Fix Navbars & Footers Across All Pages
 * 
 * Removes from ALL pages:
 * 1. "My Profile" section in mobile bottom-sheet menu
 * 2. "My Profile" dropdown from desktop navbar
 * 3. "Admin" links (except admin-only data-auth ones)
 * 4. "Sample Biography" links
 * 5. Fixes inconsistent footer logos (ensures real logo image is used)
 * 
 * Usage: node scripts/fix-nav-footer.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let totalFixes = 0;
const report = {};

// ─── Reference footer logo block ─────────────────────
const FOOTER_LOGO_CORRECT = `<div class="flex items-center gap-3 mb-4">
                        <img src="images/womencypedia-logo.png" alt="Womencypedia" class="h-8 w-auto">
                        <span class="font-serif text-lg font-bold">Womencypedia</span>
                    </div>`;

const FOOTER_LOGO_ICON_PATTERN = /<div class="flex items-center gap-3 mb-4">\s*<span class="material-symbols-outlined text-primary text-2xl">history_edu<\/span>\s*<span class="font-serif text-lg font-bold">Womencypedia<\/span>\s*<\/div>/g;

function processFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const fixes = [];
    const original = html;

    // ─── FIX 1: Remove "My Profile" section from mobile bottom-sheet menu ─
    // Pattern: <!-- My Profile --> section in mobile menu with profile, admin, and sample biography links
    const myProfileMobileRegex = /\s*<!-- My Profile -->\s*<div class="px-6 pb-4">\s*<h3[\s\S]*?My Profile[\s\S]*?<\/div>\s*/g;
    if (myProfileMobileRegex.test(html)) {
        html = html.replace(myProfileMobileRegex, '\n');
        fixes.push('Removed "My Profile" mobile menu section');
    }

    // ─── FIX 2: Remove "My Profile" dropdown from desktop navbar ─
    // Pattern: <div class="relative group"> containing "My Profile" button + dropdown
    const myProfileDesktopRegex = /<div class="relative group"><button\s*class="flex items-center gap-1[^"]*"[\s\S]*?My[\s\S]*?Profile[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    if (myProfileDesktopRegex.test(html)) {
        html = html.replace(myProfileDesktopRegex, '');
        fixes.push('Removed "My Profile" desktop dropdown');
    }

    // ─── FIX 3: Remove standalone "Sample Biography" links ─
    // In mobile menu or elsewhere
    const sampleBioRegex = /<a href="biography\.html"[^>]*>[\s]*Sample[\s]*Biography<\/a>\s*/g;
    if (sampleBioRegex.test(html)) {
        html = html.replace(sampleBioRegex, '');
        fixes.push('Removed "Sample Biography" link');
    }

    // ─── FIX 4: Remove desktop navbar "Admin" text in bottom menu (visible) ─
    // Some navbars show "Admin" as a visible text in the actions area
    // Keep data-auth="admin-only" elements (they're hidden by default), but remove visible ones
    // Pattern: visible Admin links in the dropdown list that show near user profile
    const profileAdminDropdownRegex = /<a href="profile\.html"[\s\S]*?class="block px-4 py-2\.5[\s\S]*?My[\s\S]*?data-auth="admin-only" href="admin\.html"[\s\S]*?Admin<\/a><a href="biography\.html"[\s\S]*?Sample[\s\S]*?Biography<\/a>/g;
    if (profileAdminDropdownRegex.test(html)) {
        html = html.replace(profileAdminDropdownRegex, '');
        fixes.push('Removed profile/admin/biography dropdown items');
    }

    // ─── FIX 5: Fix footer logo (icon → image) ─
    if (FOOTER_LOGO_ICON_PATTERN.test(html)) {
        html = html.replace(FOOTER_LOGO_ICON_PATTERN, FOOTER_LOGO_CORRECT);
        fixes.push('Fixed footer logo: icon → image');
    }

    // ─── FIX 6: Remove any remaining "Admin\n" text lines in mobile submenus ─
    // Some mobile menus have "Admin" as standalone text
    const adminTextRegex = /\s*<a href="admin\.html"[\s\S]*?class="block py-3[^"]*"[^>]*>\s*Admin\s*<\/a>/g;
    if (adminTextRegex.test(html)) {
        // Don't remove data-auth="admin-only" ones, only visible ones
        html = html.replace(adminTextRegex, (match) => {
            if (match.includes('data-auth="admin-only"')) return match;
            fixes.push('Removed visible Admin link from menu');
            return '';
        });
    }

    // Clean up any resulting double blank lines
    html = html.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n');

    if (html !== original) {
        fs.writeFileSync(filePath, html);
        report[filename] = fixes;
        totalFixes += fixes.length;
        console.log(`  ✓ ${filename} — ${fixes.length} fixes: ${fixes.join(', ')}`);
    } else {
        console.log(`  · ${filename} — OK`);
    }
}

function main() {
    console.log('🔧 Fixing Navbars & Footers...\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    console.log(`Processing ${htmlFiles.length} pages...\n`);

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log(`\n✅ Done! ${totalFixes} fixes applied across ${Object.keys(report).length} files`);

    // Write report
    const reportPath = path.join(ROOT, 'scripts', 'nav-footer-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`   Report: scripts/nav-footer-report.json`);
}

main();
