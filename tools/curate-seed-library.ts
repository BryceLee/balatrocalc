import { readFileSync, writeFileSync } from "node:fs";
import { analyzeSeed } from "../blueprint/src/modules/ImmolateWrapper/index.ts";

type SeedItem = {
  rank?: number;
  seed: string;
  title: string;
  summary: string;
  tags: string[];
  source: string;
  track?: string;
  deck?: string;
  goal?: string;
  keyCards?: string[];
  keyAnte?: string;
  version?: string;
  verification?: string;
};

const TARGET_TOTAL = 300;
const FREE_VISIBLE_COUNT = 3;
const SEED_LIBRARY_FILE = "balatro-seeds.html";
const VERSION = "1.0.1f";
const GENERATED_SOURCE = "analyzer-generated";
const GENERATED_VERIFICATION = "Analyzer verified";

const DECKS = [
  "Ghost Deck",
  "Erratic Deck",
  "Checkered Deck",
  "Plasma Deck",
  "Magic Deck",
  "Abandoned Deck",
  "Anaglyph Deck",
  "Zodiac Deck",
  "Painted Deck",
  "Yellow Deck",
  "Black Deck",
  "Nebula Deck",
  "Green Deck",
  "Blue Deck",
  "Red Deck",
];

const SPECIALIZED_DECKS = [
  "Ghost Deck",
  "Erratic Deck",
  "Checkered Deck",
  "Plasma Deck",
  "Magic Deck",
  "Abandoned Deck",
  "Anaglyph Deck",
  "Zodiac Deck",
  "Painted Deck",
  "Black Deck",
];

const COPY_CARDS = ["Blueprint", "Brainstorm", "DNA", "Mime", "Invisible Joker", "Ankh"];
const LEGENDARY_CARDS = ["Perkeo", "Triboulet", "Canio", "Yorick", "Chicot", "The Soul"];
const ECONOMY_CARDS = [
  "Hermit",
  "Temperance",
  "Seed Money",
  "Money Tree",
  "Liquidation",
  "Overstock Plus",
  "Reroll Glut",
  "Tarot Tycoon",
  "Planet Tycoon",
  "Omen Globe",
  "Antimatter",
  "Clearance Sale",
  "Wasteful",
  "Recyclomancy",
];
const SPECTRAL_CARDS = [
  "The Soul",
  "Ankh",
  "Cryptid",
  "Immolate",
  "Ectoplasm",
  "Hex",
  "Deja Vu",
  "Aura",
  "Talisman",
  "Wraith",
  "Medium",
  "Trance",
  "Sigil",
  "Ouija",
  "Grim",
  "Familiar",
  "Incantation",
];
const TAG_SIGNALS = ["Negative Tag", "Rare Tag", "Ethereal Tag", "Voucher Tag", "Investment Tag", "Economy Tag"];
const DECK_THEMES: Record<string, string[]> = {
  "Ghost Deck": ["Spectral", "Hex", "Ankh", "Ectoplasm", "The Soul", "Wraith"],
  "Erratic Deck": ["Standard Pack", "Aura", "Sigil", "Ouija", "Strength"],
  "Checkered Deck": ["Bloodstone", "Flush", "The Tribe", "Onyx Agate", "Smeared Joker"],
  "Plasma Deck": ["Planet", "Observatory", "Telescope", "Nebula", "High card"],
  "Magic Deck": ["Tarot", "Omen Globe", "Tarot Tycoon", "Hermit", "Temperance"],
  "Abandoned Deck": ["Standard Pack", "Steel", "Glass", "Certificate", "Trading Card"],
  "Anaglyph Deck": ["Negative Tag", "Double Tag", "Rare Tag", "Voucher Tag"],
  "Zodiac Deck": ["Voucher", "Planet", "Tarot", "Overstock Plus", "Observatory"],
  "Painted Deck": ["Hand size", "Standard Pack", "Flush", "Straight", "The Tribe"],
  "Black Deck": ["Joker slot", "Blueprint", "Brainstorm", "Economy"],
};

const TRACK_LABELS: Record<string, string> = {
  legendary: "Legendary & Soul",
  copy: "Copy Engines",
  economy: "Economy & Spectral",
  specialized: "Specialized Decks",
  stable: "Stable Clears",
};

function extractLibrary(html: string): SeedItem[] {
  const match = html.match(/const COMMUNITY_SEED_LIBRARY = (\[[\s\S]*?\n\s*]);/);
  if (!match) {
    throw new Error("Could not find COMMUNITY_SEED_LIBRARY");
  }
  return Function(`return ${match[1]}`)();
}

function stringifyLibrary(items: SeedItem[]): string {
  const order: (keyof SeedItem)[] = [
    "rank",
    "seed",
    "title",
    "summary",
    "tags",
    "source",
    "track",
    "deck",
    "goal",
    "keyCards",
    "keyAnte",
    "version",
    "verification",
  ];

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => JSON.stringify(entry)).join(", ")}]`;
    }
    return JSON.stringify(value);
  }

  const body = items
    .map((item) => {
      const lines = order
        .filter((key) => item[key] !== undefined)
        .map((key) => `        ${key}: ${formatValue(item[key])}`);
      return `      {\n${lines.join(",\n")}\n      }`;
    })
    .join(",\n");

  return `[\n${body}\n    ]`;
}

function normalizeSeed(seed: string): string {
  return String(seed || "").trim().toUpperCase().replace(/0/g, "O");
}

function getText(item: SeedItem): string {
  return [item.seed, item.title, item.summary, ...(Array.isArray(item.tags) ? item.tags : [])]
    .join(" ")
    .toLowerCase();
}

function inferTrack(item: SeedItem): string {
  if (item.track && TRACK_LABELS[item.track]) return item.track;
  const text = getText(item);
  const noLegendarySignal = /(no legendary|no legends|without legendary)/.test(text);
  if (!noLegendarySignal && /(perkeo|triboulet|canio|yorick|chicot|legendary|soul)/.test(text)) return "legendary";
  if (/(blueprint|brainstorm|dna|mime|copy|ankh|invisible joker)/.test(text)) return "copy";
  if (/(spectral|arcana|hermit|temperance|voucher|money|economy|cash|negative consumable|mega arcana|planet|immolate|cryptid|ectoplasm|hex)/.test(text)) return "economy";
  if (/(ghost deck|erratic|checkered|plasma|anaglyph|abandoned|magic deck|yellow deck|red deck|blue deck|green deck|black deck|straight deck|zodiac|painted|nebula|deck exclusive|deck route)/.test(text)) return "specialized";
  if (/(stable|consisten|beginner|completion|easy|forgiving|speedrun|unlock|guide thread|guide|clear)/.test(text)) return "stable";
  return "stable";
}

function inferDeck(item: SeedItem): string {
  if (item.deck) return item.deck;
  const text = getText(item);
  for (const deck of DECKS) {
    if (text.includes(deck.toLowerCase())) return deck;
  }
  return "Any deck";
}

function extractKeyCards(item: SeedItem): string[] {
  if (Array.isArray(item.keyCards) && item.keyCards.length) return item.keyCards.slice(0, 4);
  const text = getText(item);
  const known = [...LEGENDARY_CARDS, ...COPY_CARDS, ...ECONOMY_CARDS, ...SPECTRAL_CARDS, ...TAG_SIGNALS];
  const found = known.filter((card) => text.includes(card.toLowerCase()));
  if (found.length) return Array.from(new Set(found)).slice(0, 4);
  const track = inferTrack(item);
  if (track === "specialized") return [inferDeck(item), "Deck route"].filter(Boolean).slice(0, 4);
  if (track === "economy") return ["Economy", "Spectral"];
  if (track === "stable") return ["Stable clear", "Route planning"];
  return [TRACK_LABELS[track] || "Route"];
}

function inferGoal(item: SeedItem): string {
  if (item.goal) return item.goal;
  const track = inferTrack(item);
  const deck = inferDeck(item);
  if (track === "legendary") return "Find a legendary or Soul-driven high-roll route";
  if (track === "copy") return "Build around copy engines and scalable joker order";
  if (track === "economy") return "Use early money, vouchers, spectral cards, or packs to stabilize";
  if (track === "specialized") return `Test a ${deck === "Any deck" ? "deck-specific" : deck} route with a sharper opener`;
  return "Practice a stable clear or unlock-friendly route";
}

function inferKeyAnte(item: SeedItem): string {
  if (item.keyAnte) return item.keyAnte;
  const text = getText(item);
  const anteMatch = text.match(/ante\s*([1-8])/i);
  if (anteMatch) return `Ante ${anteMatch[1]}`;
  if (/first shop|first round|opener|early/.test(text)) return "Ante 1-2";
  if (/round-?3|round 3/.test(text)) return "Ante 1, round 3";
  return "Early route";
}

function inferVerification(item: SeedItem): string {
  if (item.verification) return item.verification;
  if (item.source === GENERATED_SOURCE) return GENERATED_VERIFICATION;
  if (/^https?:\/\//i.test(String(item.source || ""))) return "Source-backed";
  if (item.source === "legacy-library") return "Legacy archive";
  return "Curated candidate";
}

function enrichItem(item: SeedItem): SeedItem {
  const track = inferTrack(item);
  return {
    ...item,
    seed: normalizeSeed(item.seed),
    track,
    deck: inferDeck(item),
    goal: inferGoal({ ...item, track }),
    keyCards: extractKeyCards({ ...item, track }),
    keyAnte: inferKeyAnte(item),
    version: item.version || (item.source === GENERATED_SOURCE ? VERSION : "Unknown (source incomplete)"),
    verification: inferVerification(item),
  };
}

function makeSeedFromNumber(value: number): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let n = value >>> 0;
  let seed = "";
  for (let i = 0; i < 8; i++) {
    n = (Math.imul(n ^ (n >>> 15), 2246822519) + 3266489917 + i * 374761393) >>> 0;
    seed += alphabet[n % alphabet.length];
  }
  return seed;
}

function flattenAnalysis(result: any, maxAnte = 4): { names: string[]; anteHits: Map<string, number> } {
  const names: string[] = [];
  const anteHits = new Map<string, number>();

  function push(name: unknown, ante: number) {
    if (!name) return;
    const value = String(name);
    names.push(value);
    if (!anteHits.has(value)) anteHits.set(value, ante);
  }

  for (let ante = 1; ante <= maxAnte; ante++) {
    const entry = result?.antes?.[ante];
    if (!entry) continue;
    push(entry.voucher, ante);
    (entry.tags || []).forEach((tag: string) => push(tag, ante));
    (entry.voucherQueue || []).slice(0, 8).forEach((voucher: string) => push(voucher, ante));
    (entry.tagsQueue || []).slice(0, 6).forEach((tag: string) => push(tag, ante));
    (entry.packQueue || []).slice(0, 8).forEach((pack: string) => push(pack, ante));
    (entry.queue || []).slice(0, 50).forEach((card: any) => push(card?.name, ante));
    for (const blind of Object.values(entry.blinds || {}) as any[]) {
      for (const pack of blind.packs || []) {
        push(pack.name, ante);
        for (const card of pack.cards || []) push(card?.name, ante);
      }
    }
    for (const source of entry.miscCardSources || []) {
      for (const card of (source.cards || []).slice(0, 8)) push(card?.name, ante);
    }
  }

  return { names, anteHits };
}

function getHits(names: string[], signals: string[]): string[] {
  const lowerNames = names.map((name) => name.toLowerCase());
  return signals.filter((signal) => lowerNames.some((name) => name.includes(signal.toLowerCase())));
}

function earliestAnte(anteHits: Map<string, number>, hits: string[]): string {
  let best = 9;
  for (const [name, ante] of anteHits) {
    if (hits.some((hit) => name.toLowerCase().includes(hit.toLowerCase()))) {
      best = Math.min(best, ante);
    }
  }
  return best < 9 ? `Ante ${best}` : "Ante 1-4";
}

function summarizeHits(hits: string[]): string {
  return Array.from(new Set(hits)).slice(0, 4).join(", ");
}

function makeGeneratedItem(seed: string, deck: string, track: string, hits: string[], anteHits: Map<string, number>): SeedItem {
  const keyCards = Array.from(new Set(hits)).slice(0, 4);
  const primary = keyCards[0] || (track === "specialized" ? deck : "Economy route");
  const keyAnte = earliestAnte(anteHits, keyCards);
  const title =
    track === "specialized"
      ? `${deck} ${primary} Route`
      : `${primary} Economy / Spectral Route`;
  const goal =
    track === "specialized"
      ? `Test a ${deck} opener with analyzer-visible deck synergy`
      : "Use early economy, voucher, tag, or spectral access to stabilize the run";
  const summary =
    track === "specialized"
      ? `Analyzer pass found ${summarizeHits(keyCards)} by ${keyAnte} for ${deck}. Keep it as a deck-specific candidate and open the analyzer before committing to the route.`
      : `Analyzer pass found ${summarizeHits(keyCards)} by ${keyAnte}. This is a candidate for money, voucher, tag, spectral, or pack-first route planning.`;

  return {
    seed,
    title,
    summary,
    tags: [GENERATED_VERIFICATION, TRACK_LABELS[track], deck].filter(Boolean),
    source: GENERATED_SOURCE,
    track,
    deck,
    goal,
    keyCards,
    keyAnte,
    version: VERSION,
    verification: GENERATED_VERIFICATION,
  };
}

function analyzeCandidate(seed: string, deck: string): { names: string[]; anteHits: Map<string, number> } | null {
  const originalLog = console.log;
  try {
    console.log = () => {};
    const result = analyzeSeed(
      {
        seed,
        deck,
        stake: "White Stake",
        gameVersion: "10106",
        antes: 4,
        cardsPerAnte: 50,
      },
      {
        buys: {},
        sells: {},
        showCardSpoilers: true,
        unlocks: [],
        events: [],
        maxMiscCardSource: 8,
      }
    );
    return flattenAnalysis(result, 4);
  } catch {
    return null;
  } finally {
    console.log = originalLog;
  }
}

function generateCandidates(existingSeeds: Set<string>, needed: number): SeedItem[] {
  const generated: SeedItem[] = [];
  const desiredEconomy = Math.ceil(needed * 0.52);
  const desiredSpecialized = needed - desiredEconomy;
  let economyCount = 0;
  let specializedCount = 0;
  let attempt = 0;
  const maxAttempts = 12000;

  while (generated.length < needed && attempt < maxAttempts) {
    attempt += 1;
    const seed = makeSeedFromNumber(20260622 + attempt * 7919);
    if (existingSeeds.has(seed)) continue;
    const preferSpecialized = specializedCount < desiredSpecialized && (attempt % 3 !== 0 || economyCount >= desiredEconomy);
    const deckPool = preferSpecialized ? SPECIALIZED_DECKS : DECKS;
    const deck = deckPool[attempt % deckPool.length];
    const analysis = analyzeCandidate(seed, deck);
    if (!analysis) continue;

    const economyHits = getHits(analysis.names, [...ECONOMY_CARDS, ...SPECTRAL_CARDS, ...TAG_SIGNALS]);
    const deckHits = getHits(analysis.names, DECK_THEMES[deck] || []);
    const copyHits = getHits(analysis.names, COPY_CARDS);
    const legendaryHits = getHits(analysis.names, LEGENDARY_CARDS);

    if (preferSpecialized && specializedCount < desiredSpecialized && (deckHits.length >= 2 || copyHits.length || legendaryHits.length)) {
      generated.push(makeGeneratedItem(seed, deck, "specialized", [...deckHits, ...copyHits, ...legendaryHits], analysis.anteHits));
      existingSeeds.add(seed);
      specializedCount += 1;
      continue;
    }

    if (economyCount < desiredEconomy && economyHits.length >= 2) {
      generated.push(makeGeneratedItem(seed, deck, "economy", economyHits, analysis.anteHits));
      existingSeeds.add(seed);
      economyCount += 1;
      continue;
    }

    if (specializedCount < desiredSpecialized && (deckHits.length >= 1 || copyHits.length || legendaryHits.length)) {
      generated.push(makeGeneratedItem(seed, deck, "specialized", [...deckHits, ...copyHits, ...legendaryHits], analysis.anteHits));
      existingSeeds.add(seed);
      specializedCount += 1;
    }
  }

  if (generated.length < needed) {
    throw new Error(`Only generated ${generated.length} candidates after ${maxAttempts} attempts`);
  }

  return generated;
}

function main() {
  const html = readFileSync(SEED_LIBRARY_FILE, "utf8");
  const parsed = extractLibrary(html);
  const seen = new Set<string>();
  const enrichedExisting = parsed
    .map(enrichItem)
    .filter((item) => {
      const seed = normalizeSeed(item.seed);
      if (!seed || seen.has(seed)) return false;
      seen.add(seed);
      item.seed = seed;
      return true;
    });

  const needed = Math.max(TARGET_TOTAL - enrichedExisting.length, 0);
  const generated = generateCandidates(seen, needed);
  const nextLibrary = [...enrichedExisting, ...generated].map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  let nextHtml = html.replace(
    /const COMMUNITY_SEED_LIBRARY = \[[\s\S]*?\n\s*];/,
    `const COMMUNITY_SEED_LIBRARY = ${stringifyLibrary(nextLibrary)};`
  );
  nextHtml = nextHtml
    .replace(/Unlock the other 47 cards/g, `Unlock the other ${TARGET_TOTAL - FREE_VISIBLE_COUNT} seeds`)
    .replace(/first 3 seeds unlocked/g, `${FREE_VISIBLE_COUNT} of ${TARGET_TOTAL} seeds unlocked`)
    .replace(/Reddit-first, source-backed premium seeds/g, "Source-backed and analyzer-verified premium seeds")
    .replace(/Reddit-first, source-backed premium seed/g, "Source-backed and analyzer-verified premium seed");

  writeFileSync(SEED_LIBRARY_FILE, nextHtml);
  const counts = nextLibrary.reduce<Record<string, number>>((acc, item) => {
    acc[item.track || "stable"] = (acc[item.track || "stable"] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ total: nextLibrary.length, generated: generated.length, counts }, null, 2));
}

main();
