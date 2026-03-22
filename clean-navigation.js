const fs = require('fs');
const path = require('path');

const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

let modifiedCount = 0;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let needsSave = false;
    
    // 1. Remove the static #searchSheet block completely
    const searchSheetRegex = /<!-- Mobile Search Sheet -->[\s\S]*?id="searchSheet"[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/i;
    // 2. Remove the static #menuOverlay completely
    const menuOverlayRegex = /<!-- Mobile Menu Overlay -->[\s\S]*?id="menuOverlay"[\s\S]*?<\/div>/i;
    // 3. Remove the static #mobileMenu block completely
    const mobileMenuRegex = /<!-- Mobile Bottom Sheet Menu -->[\s\S]*?id="mobileMenu"[\s\S]*?<\/nav>/i;

    if (searchSheetRegex.test(content)) {
        content = content.replace(searchSheetRegex, '');
        needsSave = true;
    }
    if (menuOverlayRegex.test(content)) {
        content = content.replace(menuOverlayRegex, '');
        needsSave = true;
    }
    if (mobileMenuRegex.test(content)) {
        content = content.replace(mobileMenuRegex, '');
        needsSave = true;
    }

    // 4. In the desktop header, "Explore" is hardcoded to be the active tab. Fix it to be inactive by default.
    // The specific block is exactly:
    /*
        <button
            class="flex items-center gap-1 text-primary text-sm font-medium uppercase tracking-wider py-2 border-b-2 border-primary">
            Explore
    */
    const exploreActiveRegex = /class="([^"]*?)text-primary(.*?)border-b-2 border-primary([^"]*?)"([^>]*)>\s*Explore/ig;
    
    // The goal replacement class is: "flex items-center gap-1 text-text-main text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider py-2"
    if (exploreActiveRegex.test(content)) {
        content = content.replace(exploreActiveRegex, 'class="flex items-center gap-1 text-text-main text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider py-2"$4>\n                                Explore');
        needsSave = true;
    }

    if (needsSave) {
        try {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Cleaned mobile navs and fixed desktop active state in ${file}`);
            modifiedCount++;
        } catch (e) {
            console.error(`Error saving ${file}: ${e}`);
        }
    }
}

console.log(`\nGlobal navigation cleaning complete! Modifed ${modifiedCount} files.`);
