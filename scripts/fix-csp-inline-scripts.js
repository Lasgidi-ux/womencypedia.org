/**
 * Script to fix inline scripts in HTML files for CSP compliance
 * 
 * This script replaces inline Global Search and Service Worker scripts 
 * with external js/inline-common.js
 * 
 * Usage: node scripts/fix-csp-inline-scripts.js
 */

const fs = require('fs');
const path = require('path');

// Get all HTML files
function getHtmlFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
            getHtmlFiles(fullPath, files);
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Process a single file
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: Global Search + Service Worker together
    const pattern1 = /<!-- Global Search -->\s*<script>\s*(\/\/ )?Enhanced global search[^*]*<\/script>\s*<!-- Service Worker Registration -->\s*<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/;

    if (pattern1.test(content)) {
        content = content.replace(pattern1, '    <script src="js/inline-common.js"></script>');
        modified = true;
    }

    // Pattern 2: Service Worker only
    const pattern2 = /<!-- Service Worker Registration -->\s*<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/;

    if (pattern2.test(content)) {
        content = content.replace(pattern2, '    <script src="js/inline-common.js"></script>');
        modified = true;
    }

    // Pattern 3: Global Search only (with various comment styles)
    const pattern3 = /<!-- Global Search -->\s*<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/;

    if (pattern3.test(content)) {
        content = content.replace(pattern3, '    <script src="js/inline-common.js"></script>');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// Main execution
console.log('Fixing inline scripts for CSP compliance...\n');

const htmlFiles = getHtmlFiles('.');
console.log(`Found ${htmlFiles.length} HTML files\n`);

let processed = 0;
let skipped = 0;

for (const file of htmlFiles) {
    const relativePath = path.relative('.', file);
    console.log(`Processing: ${relativePath}`);

    if (processFile(file)) {
        processed++;
    } else {
        skipped++;
    }
}

console.log(`\n✓ Done! Processed: ${processed}, Skipped: ${skipped}`);
