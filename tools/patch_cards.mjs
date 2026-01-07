import fs from 'fs';

const cardsPath = 'cards.js';
let content = fs.readFileSync(cardsPath, 'utf-8');

const startMarker = '// 2. Apply Joker Name Translations';
const endMarker = 'return changed;';

const newLogic = `// 2. Apply Joker Name & Description Translations
      if (data.descriptions && data.descriptions.Joker) {
        const nameLookup = new Map();
        const textLookup = new Map();

        // Iterate keys in JSON (j_joker, j_greedy_joker)
        for (const [key, info] of Object.entries(data.descriptions.Joker)) {
            // Check if this joker variable exists in global scope (window)
            if (window[key] && window[key].name) {
                const englishName = window[key].name;
                const localizedName = info.name;
                if (localizedName) {
                    nameLookup.set(englishName, localizedName);
                }
                if (info.text && info.text.length > 0) {
                    textLookup.set(englishName, info.text);
                }
            }
        }

        if (nameLookup.size > 0) {
            for (let i = 0; i < jokerTexts.length; i++) {
                const row = jokerTexts[i];
                if (!row) continue;
                for (let j = 0; j < row.length; j++) {
                    const entry = row[j];
                    if (!entry || !entry[0]) continue;
                    
                    const originalName = entry[0];
                    const localizedName = nameLookup.get(originalName);
                    
                    if (localizedName && localizedName !== originalName) {
                        entry[0] = localizedName;
                        changed = true;
                    }

                    // Description Replacement
                    const locText = textLookup.get(originalName); // Look up by original English name
                    if (locText) {
                         let textStr = locText.join('<br>');
                         
                         // Basic Markup Mapping
                         textStr = textStr.replace(/\\{C:attention\\}/g, '\${numc}');
                         textStr = textStr.replace(/\\{C:mult\\}/g, '\${multc}');
                         textStr = textStr.replace(/\\{C:chips\\}/g, '\${chipc}');
                         textStr = textStr.replace(/\\{C:blue\\}/g, '\${chipc}');
                         textStr = textStr.replace(/\\{C:red\\}/g, '\${multc}');
                         textStr = textStr.replace(/\\{C:money\\}/g, '\${moneyc}');
                         textStr = textStr.replace(/\\{C:white\\}/g, '\${endc}'); 
                         textStr = textStr.replace(/\\{C:inactive\\}/g, '\${endc}');
                         textStr = textStr.replace(/\\{\\}/g, '\${endc}');
                         
                         // Advanced Mapping
                         textStr = textStr.replace(/\\{X:mult,C:white\\}/g, '\${prodc}');
                         textStr = textStr.replace(/\\{X:red,C:white\\}/g, '\${prodc}');
                         textStr = textStr.replace(/\\{s:[\\d.]+\\}/g, '');
                         textStr = textStr.replace(/\\{V:1\\}/g, '');
                         
                         // Variables
                         textStr = textStr.replace(/#1#/g, '\${jokerValue}');
                         textStr = textStr.replace(/#2#/g, '\${jokerValue2||0}'); 
                         
                         if (entry[1] !== textStr) {
                             entry[1] = textStr;
                             changed = true;
                         }
                    }
                }
            }
        }
      }`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.slice(0, startIndex);
    const after = content.slice(endIndex);
    const newContent = before + newLogic + '\n      ' + after;
    fs.writeFileSync(cardsPath, newContent);
    console.log("Successfully patched cards.js");
} else {
    console.error("Could not find markers to patch.");
    console.log("Start found:", startIndex !== -1);
    console.log("End found:", endIndex !== -1);
}
