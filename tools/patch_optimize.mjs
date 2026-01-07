import fs from 'fs';

const cardsPath = 'cards.js';
let content = fs.readFileSync(cardsPath, 'utf-8');

// We will replace the entire logic block again with the OPTIMIZED version.
const startMarker = '// 2. Apply Joker Name & Description Translations';
const endMarker = 'return changed;';

const optimizedLogic = `// 2. Apply Joker Name & Description Translations
      if (data.descriptions && data.descriptions.Joker) {
        const nameLookup = new Map();
        const textLookup = new Map();

        // Optimized Loop: Use 'en_name' directly from JSON (added by build script)
        for (const [key, info] of Object.entries(data.descriptions.Joker)) {
            const englishName = info.en_name; 
            // If en_name is missing (should not happen with new build), fall back to name if it looks like English? 
            // Or just skip.
            if (!englishName) continue;

            const localizedName = info.name;
            if (localizedName) {
                nameLookup.set(englishName, localizedName);
            }
            if (info.text && info.text.length > 0) {
                textLookup.set(englishName, info.text);
            }
        }

        if (nameLookup.size > 0) {
             // Pre-compile Regexes
             const varsRegex = /#(\\d+)#/g;
             const colorRegex = /\\{([CcsS]):([^,}]+)(?:,[^}]*)?\\}/g; // Matches {C:red}, {s:1.2,C:red}, {c:red}
             // const xRegex = /\\{X:[^}]+\\}/g; // Handled by manual check or generic color map if X:mult is mapped?
             // Actually original code had specific X:mult mapping.
             
             const colorMap = {
                  attention: '\${numc}',
                  chips: '\${chipc}',
                  blue: '\${chipc}',
                  mult: '\${multc}',
                  red: '\${multc}',
                  money: '\${moneyc}',
                  green: '\${probc}',
                  inactive: '\${shadowc}',
                  white: '\${defaultc}',
                  hearts: '\${heartcOpen}',
                  clubs: '\${clubcOpen}',
                  diamonds: '\${diamondcOpen}',
                  spades: '\${spadecOpen}',
                  tarot: '\${tarotcOpen}',
                  planet: '\${planetcOpen}',
                  spectral: '\${spectralcOpen}',
                  purple: '\${purplecOpen}',
                  legendary: '\${moneyc}',
                  enhanced: '\${chipc}',
                  dark_edition: '\${shadowc}',
             };

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
                    const locText = textLookup.get(originalName);
                    if (locText) {
                         let textStr = locText.join('<br>');
                         
                         // Optimized Regex Logic
                         // 1. Color/Style Tags
                         textStr = textStr.replace(colorRegex, (match, type, val) => {
                             if (type.toUpperCase() === 'S') return ''; // Remove scale {s:1.2}
                             if (type.toUpperCase() === 'V') return ''; // Remove var {V:1}
                             const key = val.toLowerCase();
                             return colorMap[key] || '\${defaultc}';
                         });

                         // 2. Specific XMult Style (X:mult,C:white)
                         textStr = textStr.replace(/\\{X:[^}]+\\}/g, '\${xmultc}'); 
                         
                         // 3. Variables
                         textStr = textStr.replace(/#1#/g, '\${jokerValue}');
                         textStr = textStr.replace(/#2#/g, '\${typeof jokerValue2 !== "undefined" ? jokerValue2 : 0}');
                         textStr = textStr.replace(/#3#/g, '\${typeof jokerValue3 !== "undefined" ? jokerValue3 : 0}');
                         textStr = textStr.replace(/#4#/g, '\${typeof jokerValue4 !== "undefined" ? jokerValue4 : 0}');
                         textStr = textStr.replace(/#5#/g, '\${typeof jokerValue5 !== "undefined" ? jokerValue5 : 0}');

                         // 4. Cleanup empty {}
                         textStr = textStr.replace(/\\{\\}/g, '\${endc}');
                         
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
    const newContent = before + optimizedLogic + '\n      ' + after;
    fs.writeFileSync(cardsPath, newContent);
    console.log("Successfully patched cards.js with OPTIMIZED logic.");
} else {
    console.error("Could not find markers to patch.");
}
