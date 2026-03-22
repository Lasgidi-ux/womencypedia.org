const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\LENONO\\Downloads\\about womencypedia\\about womencypedia\\womencypedia-frontend';

function processFiles() {
    const files = fs.readdirSync(dir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    let observerLogic = null;

    // First pass: extract timeline and remove CSP
    htmlFiles.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 1. Remove CSP Meta tag completely
        content = content.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][\s\S]*?>/gi, '');

        // 2. Extract observer logic and other inline scripts
        let inlineScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        
        while ((match = inlineScriptRegex.exec(originalContent)) !== null) {
            const scriptTag = match[0];
            const scriptAttributes = scriptTag.substring(0, scriptTag.indexOf('>'));
            
            // Skip external scripts or JSON data
            if (scriptAttributes.includes('src=') || scriptAttributes.includes('type="application/')) {
                continue;
            }

            const scriptBody = match[1];

            // If it's the observer script, extract it
            if (scriptBody.includes('const observer')) {
                if (!observerLogic || scriptBody.length > observerLogic.length) {
                    observerLogic = scriptBody.trim();
                }
            }
            
            // Remove the inline script completely
            content = content.replace(scriptTag, '');
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
        }
    });

    // Write timeline.js
    if (observerLogic) {
        const timelinePath = path.join(dir, 'js', 'timeline.js');
        fs.writeFileSync(timelinePath, observerLogic);
        console.log("Wrote js/timeline.js");
    } else {
        console.log("Warning: No 'const observer' inline script found!");
    }

    // Second pass: inject timeline.js if it doesn't exist
    htmlFiles.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (!content.includes('src="js/timeline.js"')) {
            content = content.replace(/<\/body>/i, '    <script src="js/timeline.js" defer></script>\n</body>');
            fs.writeFileSync(filePath, content);
        }
    });

    console.log("Processed " + htmlFiles.length + " files.");
}

processFiles();
