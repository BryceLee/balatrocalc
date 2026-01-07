import fs from 'fs';

const mainPath = 'main.js';
let content = fs.readFileSync(mainPath, 'utf-8');

// The original logic:
// redrawCards();
// jredrawCards();
// if (window.applyJokerLocalization) { ... }

// We want to skip jredrawCards() if we are going to localize immediately.
// But we don't want a permanent blank screen if localization fails.
// Safe approach: 
// 1. Check if we *should* localize (lang != en). 
// 2. If yes, skip initial draw.
// 3. If localization finishes (or fails), ensure we draw.

// However, `window.applyJokerLocalization` returns a promise.
// We can wrap the initial draw logic.

const oldLogic = `redrawCards();
jredrawCards();
if (window.applyJokerLocalization) {
  window.applyJokerLocalization().then((changed) => {
    if (!changed) return;
    jredrawCards();
    updateTooltips();
    redrawPlayfield();
    if (modifyingJoker) updateModifyingJoker();
  });
}`;

const newLogic = `redrawCards();

const shouldLocalize = window.applyJokerLocalization && (function() {
    // Simple check: if lang is not en, we expect localization
    const htmlLang = ((document.documentElement && document.documentElement.lang) || '').toLowerCase();
    if (htmlLang && htmlLang !== 'en' && htmlLang !== 'en-us') return true;
    const pathLang = (window.location.pathname || '').split('/').filter(Boolean)[0];
    if (pathLang && pathLang !== 'en' && pathLang.length === 2) return true;
    return false;
})();

if (!shouldLocalize) {
    jredrawCards();
}

if (window.applyJokerLocalization) {
  window.applyJokerLocalization().then((changed) => {
    // If we skipped initial draw, we MUST draw now regardless of 'changed' 
    // (though applyJokerLocalization returns changed=false if English... wait).
    // If 'shouldLocalize' was true, but 'changed' is false (e.g. fetch failed), we still need to draw!
    
    if (changed || shouldLocalize) {
         jredrawCards();
         updateTooltips();
         redrawPlayfield();
         if (modifyingJoker) updateModifyingJoker();
    }
  });
}`;

// Try precise replacement
if (content.includes('redrawCards();\njredrawCards();')) {
    // We need to match the block.
    // The if block follows.
    // Let's use a simpler marker replacement if possible.
    // But the spacing might vary.

    const blockStart = content.indexOf('redrawCards();');
    const blockEnd = content.indexOf('const jokerAreaDiv');

    if (blockStart !== -1 && blockEnd !== -1) {
        const originalBlock = content.slice(blockStart, blockEnd).trim();
        // Since user might have formatting diffs, let's construct regex or just overwrite safely.
        // Actually, just replacing 'redrawCards();\njredrawCards();' with the logic and modifying the .then callback?

        // Let's replace the CALLS first.
        content = content.replace('redrawCards();\njredrawCards();',
            `redrawCards();
             // Optimization: Skip initial draw if localization is expected to avoid double-render lag
             const shouldLocalize = (function() {
                const h = ((document.documentElement && document.documentElement.lang) || '').toLowerCase();
                const p = (window.location.pathname || '').split('/').filter(Boolean)[0];
                return (h && h !== 'en' && h !== 'en-us') || (p && p!=='en' && p.length===2);
             })();
             if (!shouldLocalize) jredrawCards();`
        );

        // Then update the promise callback to force draw if it was skipped.
        // We need to find `if (!changed) return;` inside the callback and modify it.
        const callbackStart = content.indexOf('window.applyJokerLocalization().then((changed) => {');
        if (callbackStart !== -1) {
            const ifChanged = 'if (!changed) return;';
            const newIfChanged = 'if (!changed && !shouldLocalize) return;';
            content = content.replace(ifChanged, newIfChanged);
            console.log("Patched main.js to optimize render.");
            fs.writeFileSync(mainPath, content);
        } else {
            console.error("Could not find localization callback.");
        }
    }
} else {
    console.error("Could not find initial render calls.");
}
