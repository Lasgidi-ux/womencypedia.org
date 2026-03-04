#!/usr/bin/env node
/**
 * Womencypedia — Final cleanup: Remove ALL "My Profile" dropdowns & visible Admin text
 *
 * This script uses line-by-line processing to handle ALL HTML formatting variations.
 *
 * Removes:
 * 1. "My Profile Dropdown" blocks from desktop navbars
 * 2. Visible "Admin" text outside of hidden/admin-only elements
 *
 * Usage: node scripts/fix-final-cleanup.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let totalFixes = 0;

function removeMyProfileDropdown(html, filename) {
    const fixes = [];

    // Strategy: Find "<!-- My Profile Dropdown -->" or "My Profile" button blocks
    // and remove the entire <div class="relative group"> containing them

    // Pattern: The whole "My Profile Dropdown" block starts with <!-- My Profile Dropdown -->
    // and is nested inside a <div class="relative group">
    // We need to find the opening div and its matching closing divs

    const lines = html.split('\n');
    const newLines = [];
    let skipMode = false;
    let divDepth = 0;
    let skipStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect the start of My Profile Dropdown block
        if (!skipMode && line.includes('<!-- My Profile Dropdown -->')) {
            // Go back to find the opening <div class="relative group">
            // It should be 1-2 lines before this comment
            let backtrack = 0;
            for (let j = newLines.length - 1; j >= Math.max(0, newLines.length - 3); j--) {
                if (newLines[j].includes('relative group')) {
                    backtrack = newLines.length - j;
                    break;
                }
            }
            if (backtrack > 0) {
                // Remove the backtracked lines
                newLines.splice(newLines.length - backtrack);
            }
            skipMode = true;
            divDepth = 1; // We're inside the <div class="relative group">
            skipStartLine = i;
            fixes.push('Removed My Profile desktop dropdown');
            continue;
        }

        // Also detect "My Profile" as a nav button text (different pattern without comment)
        if (!skipMode && !line.includes('<!--') && !line.includes('profile.html') &&
            /^\s*My Profile\s*$/.test(line) &&
            i > 0 && (lines[i - 1] || '').includes('button')) {
            // Found "My Profile" text after a button tag. Go back to find the relative group div.
            let backtrack = 0;
            for (let j = newLines.length - 1; j >= Math.max(0, newLines.length - 6); j--) {
                if (newLines[j].includes('relative group')) {
                    backtrack = newLines.length - j;
                    break;
                }
            }
            if (backtrack > 0) {
                newLines.splice(newLines.length - backtrack);
            }
            skipMode = true;
            divDepth = 1;
            skipStartLine = i;
            fixes.push('Removed My Profile nav button block');
            continue;
        }

        if (skipMode) {
            // Count div opens and closes to find the end of the block
            const opens = (line.match(/<div[\s>]/g) || []).length;
            const closes = (line.match(/<\/div>/g) || []).length;
            divDepth += opens - closes;

            if (divDepth <= 0) {
                skipMode = false;
                // Don't add this line (it's the closing </div>)
                // But check if there are other elements on the same line
                continue;
            }
            continue; // Skip this line
        }

        newLines.push(line);
    }

    if (fixes.length > 0) {
        totalFixes += fixes.length;
        console.log(`  ✓ ${filename} — ${fixes.join(', ')}`);
        return newLines.join('\n');
    }

    return null; // No changes
}

function processFile(filePath) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);

    // Skip error pages and profile page itself
    if (['403.html', '404.html', '500.html', 'profile.html', 'admin.html'].includes(filename)) {
        return;
    }

    const result = removeMyProfileDropdown(html, filename);
    if (result) {
        fs.writeFileSync(filePath, result);
    }
}

function main() {
    console.log('🧹 Final cleanup — removing all My Profile dropdowns...\n');

    const htmlFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, f))
        .sort();

    for (const file of htmlFiles) {
        processFile(file);
    }

    console.log(`\n✅ Done! ${totalFixes} fixes applied`);
}

main();
