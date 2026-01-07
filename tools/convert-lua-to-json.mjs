import fs from 'fs';
import path from 'path';

const LOCALIZATION_DIR = 'localization';
const OUTPUT_DIR = 'assets/i18n';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseLuaLocalizationIndent(content) {
    const lines = content.split(/\r?\n/);
    const result = {
        descriptions: { Joker: {}, Blind: {}, Back: {}, Edition: {}, Enhanced: {}, Tarot: {}, Planet: {}, Spectral: {}, Voucher: {} },
        ui: {}
    };

    let currentSection = null;
    let currentKey = null;
    let currentItem = { name: '', text: [] };
    let inText = false;

    for (const rawLine of lines) {
        if (!rawLine.trim()) continue;

        // Count indentation (spaces)
        const indentMatch = rawLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const line = rawLine.trim();

        // Section Start (8 spaces, e.g., "        Joker={")
        if (indent === 8 && line.endsWith('={')) {
            const key = line.slice(0, -2);
            if (result.descriptions[key]) {
                currentSection = key;
            }
            continue;
        }

        // Section End (8 spaces, "        },")
        if (indent === 8 && line.startsWith('},')) {
            currentSection = null;
            continue;
        }

        if (currentSection) {
            // Item Start (12 spaces, e.g., "            j_8_ball={")
            if (indent === 12 && line.endsWith('={')) {
                const key = line.slice(0, -2);
                currentKey = key;
                currentItem = { name: '', text: [] };
                continue;
            }

            // Item End (12 spaces, "            },")
            if (indent === 12 && line.startsWith('},')) {
                if (currentKey) {
                    result.descriptions[currentSection][currentKey] = currentItem;
                    currentKey = null;
                    currentItem = null;
                }
                continue;
            }

            if (currentKey) {
                // Name (any indent, usually 16)
                const nameMatch = line.match(/name=["'](.*?)["']/);
                if (nameMatch) {
                    currentItem.name = nameMatch[1];
                }

                // Text Start
                if (line.includes('text={')) {
                    inText = true;
                    // Single line text?
                    const inline = line.match(/text=\{(.*?)\}/);
                    if (inline) {
                        const strs = inline[1].match(/["'](.*?)["']/g);
                        if (strs) currentItem.text = strs.map(s => s.slice(1, -1));
                        inText = false;
                    }
                    continue;
                }

                // Text End
                if (inText && (line.startsWith('},') || line === '},')) {
                    inText = false;
                    continue;
                }

                if (inText) {
                    // Determine if this line has a string
                    // Line: "   "Foo","
                    const strMatch = line.match(/["'](.*?)["']/);
                    if (strMatch) {
                        currentItem.text.push(strMatch[1]);
                    }
                }
            }
        }
    }
    return result;
}

const UI_TRANSLATIONS = {
    'zh_CN': {
        "optimize_jokers": "优化小丑 (慢)",
        "optimize_hand": "优化手牌 (慢)",
        "minimize_score": "最小化得分",
        "play_hand": "出牌",
        "clear_hand": "清空手牌",
        "clear_jokers": "清空小丑",
        "count": "数量",
        "value": "数值",
        "search": "搜索",
        "jokers": "小丑牌",
        "cards": "扑克牌",
        "hands": "牌型",
        "breakdown": "得分享情",
        "edit": "编辑",
        "start": "开始",
        "stop": "停止"
    }
};

async function processFile(filename) {
    if (!filename.endsWith('.lua')) return;
    const langCode = path.basename(filename, '.lua');
    console.log(`Processing ${langCode}...`);
    const content = fs.readFileSync(path.join(LOCALIZATION_DIR, filename), 'utf-8');

    const data = parseLuaLocalizationIndent(content);

    if (UI_TRANSLATIONS[langCode]) data.ui = UI_TRANSLATIONS[langCode];
    else data.ui = {};

    const outputPath = path.join(OUTPUT_DIR, `${langCode}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Generated ${outputPath} with ${Object.keys(data.descriptions.Joker).length} jokers.`);
}

const files = fs.readdirSync(LOCALIZATION_DIR);
files.forEach(processFile);
