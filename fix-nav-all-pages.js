const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// The starting point of the navigation block is right after the body tag
// The ending point is exactly `</header>`
const navBlockRegex = /(<body[^>]*>)\s*(?:<!--[\s\S]*?-->\s*|<[^m][\s\S]*?)*?(<main)/i;

// Actually, extracting from index.html specifically:
// From <!-- Skip Link --> up to </header>\n
const snippetMatch = indexHtml.match(/(<!-- Skip Link -->[\s\S]*?<\/header>)/i);
if (!snippetMatch) {
    console.error("Could not find the navigation block in index.html");
    process.exit(1);
}

const universalNav = snippetMatch[1] + "\n\n";

const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

let modifiedCount = 0;
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We want to replace everything from after <body ...> up to <main
    const replaceRegex = /(<body[^>]*>)([\s\S]*?)(<main)/i;
    
    const newContent = content.replace(replaceRegex, (match, bodyTag, oldNav, mainTag) => {
        // If it's already exactly the universal nav, skip
        if (oldNav.trim() === universalNav.trim()) return match;
        
        return bodyTag + "\n\n    " + universalNav + "    " + mainTag;
    });

    if (newContent !== content) {
        try {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated navbar in ${file}`);
            modifiedCount++;
        } catch (e) {
            console.log(`Error writing to ${file}: ${e.message}`);
        }
    } else {
        console.log(`Skipped ${file} (no change)`);
    }
}

console.log(`\nSuccessfully updated navigation on ${modifiedCount} HTML files!`);
