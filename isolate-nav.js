const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const navRegex = /<!-- Skip Link -->[\s\S]*?<\/header>/;

const match = indexHtml.match(navRegex);
if (match) {
    console.log("Found nav block! Length:", match[0].length);
    fs.writeFileSync('nav-snippet.html', match[0]);
} else {
    console.log("Could not find nav block in index.html");
}
