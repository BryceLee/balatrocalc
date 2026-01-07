import fs from 'fs';

const cardsPath = 'cards.js';
let content = fs.readFileSync(cardsPath, 'utf-8');

// Replace standard fetch lines with absolute path
const regex = /fetch\((.*?)`assets\/i18n\/\$\{localeFile\}\.json`.*?\)/;
// Matches fetch(`...`) or fetch(new URL(... `...`))
// Let's just search for the specific unique string `assets/i18n/${localeFile}.json`
// and replace the whole fetch argument.

// Previous patch 1: fetch(`assets/i18n/${localeFile}.json`)
// Previous patch 2: fetch(new URL(`assets/i18n/${localeFile}.json`, document.baseURI))

// We want: fetch(`/assets/i18n/${localeFile}.json`)

if (content.includes('fetch(`assets/i18n/${localeFile}.json`)')) {
    content = content.replace('fetch(`assets/i18n/${localeFile}.json`)', 'fetch(`/assets/i18n/${localeFile}.json`)');
    console.log("Patched relative fetch to absolute.");
} else if (content.includes('fetch(new URL(`assets/i18n/${localeFile}.json`, document.baseURI))')) {
    content = content.replace('fetch(new URL(`assets/i18n/${localeFile}.json`, document.baseURI))', 'fetch(`/assets/i18n/${localeFile}.json`)');
    console.log("Patched document.baseURI fetch to absolute.");
} else {
    // maybe verify if it is already patched?
    if (content.includes('fetch(`/assets/i18n/${localeFile}.json`)')) {
        console.log("Already using absolute path.");
    } else {
        console.error("Could not find fetch pattern to patch.");
        // Force replacement via simpler search
        const simpleIndex = content.indexOf('assets/i18n/${localeFile}.json');
        if (simpleIndex !== -1) {
            // Find the line?
            // Not safe.
            console.log("Found substring but pattern mismatch.");
        }
    }
}

fs.writeFileSync(cardsPath, content);
