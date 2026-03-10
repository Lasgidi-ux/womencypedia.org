/**
 * Script to remove <meta http-equiv="Content-Security-Policy"> tags from all HTML files.
 * 
 * Reason: The Render server header (render.yaml) already defines the comprehensive CSP.
 * Having both a meta tag AND a server header causes dual-CSP enforcement where
 * the browser enforces BOTH, and the most restrictive wins — causing false CSP blocks.
 * 
 * This script removes the meta tags so only the server header CSP is used.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Find all HTML files recursively
function findHtmlFiles(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'womencypedia-cms' && item.name !== 'dist') {
            results.push(...findHtmlFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

const htmlFiles = findHtmlFiles(ROOT);
let modifiedCount = 0;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Match the CSP meta tag - it can span multiple lines
    // Pattern: <meta http-equiv="Content-Security-Policy" ... > (single or multi-line)
    const patterns = [
        // Multi-line: <meta http-equiv="Content-Security-Policy"\n        content="...">
        /[ \t]*<meta\s+http-equiv="Content-Security-Policy"\s*\r?\n\s*content="[^"]*">\s*\r?\n?/g,
        // Single line: <meta http-equiv="Content-Security-Policy" content="...">
        /[ \t]*<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*">\s*\r?\n?/g,
    ];
    
    for (const pattern of patterns) {
        content = content.replace(pattern, '');
    }
    
    if (content !== originalContent) {
        // Clean up excess blank lines
        content = content.replace(/(\r?\n){3,}/g, '\r\n\r\n');
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`  Removed CSP meta tag from: ${path.relative(ROOT, file)}`);
    }
}

console.log(`\nModified ${modifiedCount} of ${htmlFiles.length} HTML files`);
console.log('CSP is now managed solely via the Render server header in render.yaml');
