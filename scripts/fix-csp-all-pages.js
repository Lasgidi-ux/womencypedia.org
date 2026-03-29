/**
 * Fix CSP Meta Tags in All HTML Pages
 * Updates all HTML files with the production-ready CSP
 */

const fs = require('fs');
const path = require('path');

// Production CSP - matches .htaccess
const PRODUCTION_CSP = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'sha256-QTaKltFEhQQCiym6Sg/ZWkRQx4Zta9Rq3XMNB/JQPzo=' 'sha256-0UNQ+R0mL2azAdirbGwW4Wb0p55MLpy4rRrjuVe9eZI=' 'sha256-/Ai9HPaKKSF9eWNIisU9qZ6YCs/IufiOYjOpkLNoK3I=' 'sha256-eQIH+snrSGqZmXtT03BtIZYUYpXtEmVrbEOio9NzYLY=' 'sha256-bWUkoYfSDlhjVbd9mLJ+GreJXp659BjWze1kUsubc34=' 'sha256-iN7wpJdxHlpujRppkOA8N0+Mzp0ZqZr3lCtxM00Y63c=' https://fonts.googleapis.com https://plausible.io https://cdn.jsdelivr.net https://js.paystack.co https://checkout.flutterwave.com https://cdn.tailwindcss.com https://app.launchdarkly.com https://events.launchdarkly.com https://tccl.min.js https://img1.wsimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; font-src 'self' https://fonts.gstatic.com data: https://fonts.googleapis.com; connect-src 'self' https://womencypedia-cms.onrender.com https://plausible.io https://unpkg.com https://img1.wsimg.com https://d3js.org https://*.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://app.launchdarkly.com https://events.launchdarkly.com https://csp.secureserver.net https://*.secureserver.net https://*.tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org; frame-src https://js.paystack.co https://checkout.flutterwave.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;

// Regex to match existing CSP meta tag (flexible: handles attribute reordering, single/double quotes, and unquoted attributes)
const CSP_META_REGEX = /<meta\s+(?=[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?)(?=[^>]*content\s*=\s*["'][^"']*["'])[^>]*>/gi;

// New CSP meta tag
const NEW_CSP_META = `<meta http-equiv="Content-Security-Policy"\n        content="${PRODUCTION_CSP}">`;

function findHtmlFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip node_modules, .git, and other non-public directories
            if (!['node_modules', '.git', 'womencypedia-cms', 'scripts', 'src'].includes(item)) {
                results = results.concat(findHtmlFiles(fullPath));
            }
        } else if (item.endsWith('.html')) {
            results.push(fullPath);
        }
    }

    return results;
}

function fixCspInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file has CSP meta tag
        // Reset lastIndex to avoid state pollution from previous calls
        CSP_META_REGEX.lastIndex = 0;

        // Check if file has CSP meta tag
        if (!CSP_META_REGEX.test(content)) {
            console.log(`⚠️  No CSP meta tag found in: ${filePath}`);
            return false;
        }

        // Reset again after test() advanced it
        CSP_META_REGEX.lastIndex = 0;

        // Replace CSP meta tag
        const newContent = content.replace(CSP_META_REGEX, NEW_CSP_META);
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Fixed CSP in: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  CSP already correct in: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
console.log('🔧 Fixing CSP meta tags in all HTML files...\n');

const htmlFiles = findHtmlFiles('.');
console.log(`Found ${htmlFiles.length} HTML files\n`);

let fixedCount = 0;
for (const file of htmlFiles) {
    if (fixCspInFile(file)) {
        fixedCount++;
    }
}

console.log(`\n✅ Done! Fixed ${fixedCount} files.`);
