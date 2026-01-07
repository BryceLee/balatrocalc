import fs from 'fs';

const cardsPath = 'cards.js';
let content = fs.readFileSync(cardsPath, 'utf-8');

// We need to replace the fetch line.
const oldFetch = 'const response = await fetch(`assets/i18n/${localeFile}.json`);';
// We want to replace it with a robust URL construction using document.baseURI
// This handles both root deployment and subpath deplyoment + <base> tag.
const newFetch = 'const response = await fetch(new URL(`assets/i18n/${localeFile}.json`, document.baseURI));';

if (content.includes(oldFetch)) {
    content = content.replace(oldFetch, newFetch);
    fs.writeFileSync(cardsPath, content);
    console.log("Successfully patched cards.js with robust URL fetch.");
} else {
    // It might be using double quotes or something different from my previous patch?
    // Let's try to match loosely.
    const regex = /const response = await fetch\(`assets\/i18n\/\$\{localeFile\}\.json`\);/;
    if (content.match(regex)) {
        content = content.replace(regex, newFetch);
        fs.writeFileSync(cardsPath, content);
        console.log("Successfully patched cards.js (regex).");
    } else {
        console.error("Could not find the fetch line to patch.");
        // Debug
        // console.log(content.slice(content.indexOf('try {'), content.indexOf('catch')));
    }
}
