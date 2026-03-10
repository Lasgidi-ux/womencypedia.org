/**
 * Script to add CSP hashes for remaining inline scripts
 * 
 * This script computes SHA-256 hashes of inline scripts and adds them to
 * per-page CSP meta tags.
 * 
 * Usage: node scripts/add-csp-hashes.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Get all HTML files
function getHtmlFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git') && !item.includes('womencypedia-cms')) {
            getHtmlFiles(fullPath, files);
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Compute SHA-256 hash of a string
function computeHash(str) {
    return crypto.createHash('sha256').update(str).digest('base64');
}

// Extract inline script content from HTML
function extractInlineScripts(content) {
    const scriptPattern = /<script>([\s\S]*?)<\/script>/g;
    const scripts = [];
    let match;

    while ((match = scriptPattern.exec(content)) !== null) {
        // Skip if it's the inline-common.js reference
        if (match[1].includes('inline-common.js')) continue;

        // Skip empty or minimal scripts
        if (match[1].trim().length < 10) continue;

        scripts.push(match[1].trim());
    }

    return scripts;
}

// Add CSP meta tag with hashes to a file
function addCspMetaTag(filePath, hashes) {
    if (hashes.length === 0) return false;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if CSP meta tag already exists
    if (content.includes('Content-Security-Policy')) {
        return false; // Already has CSP
    }

    // Build the hash strings
    const hashStrings = hashes.map(h => `'sha256-${computeHash(h)}'`).join(' ');

    // Add CSP meta tag after <head>
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' ${hashStrings} https://fonts.googleapis.com https://plausible.io https://cdn.jsdelivr.net https://js.paystack.co https://checkout.flutterwave.com https://cdn.tailwindcss.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://unpkg.com https://d3js.org; frame-src https://js.paystack.co https://checkout.flutterwave.com; worker-src 'self' blob:;">`;

    // Insert after <head>
    content = content.replace('<head>', '<head>\n    ' + cspMeta);

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

// Main execution
console.log('Adding CSP hashes for inline scripts...\n');

const htmlFiles = getHtmlFiles('.');
console.log(`Found ${htmlFiles.length} HTML files\n`);

let processed = 0;
let skipped = 0;

for (const file of htmlFiles) {
    const relativePath = path.relative('.', file);

    const content = fs.readFileSync(file, 'utf8');
    const inlineScripts = extractInlineScripts(content);

    if (inlineScripts.length > 0) {
        console.log(`${relativePath}: ${inlineScripts.length} inline script(s) found`);

        if (addCspMetaTag(file, inlineScripts)) {
            processed++;
            console.log(`  ✓ Added CSP meta tag with ${inlineScripts.length} hash(es)`);
        } else {
            skipped++;
            console.log(`  - Already has CSP or no scripts`);
        }
    } else {
        skipped++;
    }
}

console.log(`\n✓ Done! Processed: ${processed}, Skipped: ${skipped}`);
