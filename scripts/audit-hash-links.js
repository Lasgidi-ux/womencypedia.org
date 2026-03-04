const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function findHTMLFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'new-workspace', 'plans'].includes(entry.name)) {
            files.push(...findHTMLFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

const htmlFiles = findHTMLFiles(ROOT);

// 1. Find all href="#" links with their context (surrounding text)
console.log('========================================');
console.log('AUDIT: href="#" PLACEHOLDER LINKS');
console.log('========================================\n');

const hrefHashRegex = /href=["']#["'][^>]*>([^<]*)/g;
const results = {};
let totalPlaceholders = 0;

htmlFiles.forEach(file => {
    const relFile = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, idx) => {
        let match;
        const lineRegex = /href=["']#["'][^>]*>([^<]*)/g;
        while ((match = lineRegex.exec(line)) !== null) {
            const linkText = match[1].trim();
            const fullTag = line.substring(Math.max(0, match.index - 50), match.index + match[0].length + 10).trim();

            // Skip anchors that are intentionally # (social media, scroll-to-top, toggles, modals)
            const isSocial = /aria-label=["'](Facebook|Twitter|Instagram|LinkedIn|X \(Twitter\)|YouTube)/i.test(line);
            const isButton = /button|toggle|modal|accordion|onclick|data-/i.test(line);
            const isEmpty = linkText === '' || linkText === '#';

            matches.push({
                line: idx + 1,
                text: linkText || '(empty)',
                isSocial,
                isButton,
                context: fullTag.substring(0, 120)
            });
        }
    });

    if (matches.length > 0) {
        results[relFile] = matches;
        totalPlaceholders += matches.length;
    }
});

// Print categorized results
let actionableCount = 0;
let socialCount = 0;
let buttonCount = 0;

Object.entries(results).forEach(([file, matches]) => {
    const actionable = matches.filter(m => !m.isSocial && !m.isButton);
    const social = matches.filter(m => m.isSocial);
    const buttons = matches.filter(m => m.isButton && !m.isSocial);

    if (actionable.length > 0) {
        console.log(`\n📄 ${file}:`);
        actionable.forEach(m => {
            console.log(`   ❌ Line ${m.line}: "${m.text}"`);
            actionableCount++;
        });
    }
    socialCount += social.length;
    buttonCount += buttons.length;
});

console.log('\n\n========================================');
console.log('SUMMARY');
console.log('========================================');
console.log(`Total href="#" found: ${totalPlaceholders}`);
console.log(`  ❌ Actionable (need real links): ${actionableCount}`);
console.log(`  🐦 Social media (OK as #): ${socialCount}`);
console.log(`  🔘 Buttons/toggles (OK as #): ${buttonCount}`);

// 2. Check page completeness - look for placeholder content
console.log('\n\n========================================');
console.log('AUDIT: PAGE COMPLETENESS');
console.log('========================================\n');

htmlFiles.forEach(file => {
    const relFile = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const fileSize = Buffer.byteLength(content, 'utf-8');
    const issues = [];

    // Check for very small pages (likely incomplete)
    if (fileSize < 2000 && !['403.html', '404.html', '500.html'].includes(path.basename(file))) {
        issues.push(`Very small file (${fileSize} bytes) - may be incomplete`);
    }

    // Check for placeholder text
    if (content.includes('Lorem ipsum') || content.includes('TODO') || content.includes('FIXME') ||
        content.includes('placeholder') && content.includes('Coming soon')) {
        issues.push('Contains placeholder text (Lorem ipsum / TODO / Coming soon)');
    }

    // Check for empty main content
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (mainMatch && mainMatch[1].trim().length < 100) {
        issues.push('Main content area is nearly empty');
    }

    // Check if missing <title>
    if (!content.includes('<title>')) {
        issues.push('Missing <title> tag');
    }

    // Check if missing key scripts
    if (!content.includes('js/config.js')) {
        issues.push('Missing js/config.js');
    }
    if (!content.includes('js/auth.js')) {
        issues.push('Missing js/auth.js');
    }

    if (issues.length > 0) {
        console.log(`📄 ${relFile}:`);
        issues.forEach(i => console.log(`   ⚠️  ${i}`));
        console.log('');
    }
});

// 3. List all unique href="#" link texts to map them
console.log('\n========================================');
console.log('ALL UNIQUE href="#" LINK TEXTS (non-social, non-button)');
console.log('========================================\n');

const uniqueTexts = new Map();
Object.entries(results).forEach(([file, matches]) => {
    matches.filter(m => !m.isSocial && !m.isButton).forEach(m => {
        if (!uniqueTexts.has(m.text)) {
            uniqueTexts.set(m.text, []);
        }
        uniqueTexts.get(m.text).push(file);
    });
});

[...uniqueTexts.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([text, files]) => {
    console.log(`"${text}" → found in ${files.length} file(s): ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
});
