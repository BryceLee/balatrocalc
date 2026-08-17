import { JOKER_KNOWLEDGE } from './_joker-knowledge.generated.js';

const MAX_GROUNDED_JOKERS = 12;

function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('en-US');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsAlias(text, alias) {
  const normalizedAlias = normalize(alias);
  if (!normalizedAlias) return false;
  if (/^[a-z0-9 '&.-]+$/i.test(normalizedAlias)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedAlias)}([^a-z0-9]|$)`, 'i').test(text);
  }
  return text.includes(normalizedAlias);
}

export function findMentionedJokers(messages, limit = MAX_GROUNDED_JOKERS) {
  const text = normalize((messages || []).map((entry) => entry?.content || '').join('\n'));
  if (!text) return [];
  return JOKER_KNOWLEDGE
    .map((joker) => ({
      joker,
      matchedLength: Math.max(0, ...joker.aliases.filter((alias) => containsAlias(text, alias)).map((alias) => alias.length))
    }))
    .filter((entry) => entry.matchedLength > 0)
    .sort((left, right) => right.matchedLength - left.matchedLength || left.joker.name.localeCompare(right.joker.name))
    .slice(0, limit)
    .map((entry) => entry.joker);
}

export function jokerGroundingForMessages(messages) {
  const jokers = findMentionedJokers(messages);
  if (!jokers.length) return '';

  const lines = jokers.map((joker) => {
    const compatibility = joker.blueprintCompatible === null
      ? ''
      : ` Blueprint compatibility: ${joker.blueprintCompatible ? 'yes' : 'no'}.`;
    return `- ${joker.name}: ${joker.description}.${compatibility}`;
  });
  const names = new Set(jokers.map((joker) => joker.name));

  if (names.has('Blueprint') && names.has('Photograph') && names.has('Hanging Chad')) {
    lines.push(
      '- Verified interaction: place Blueprint immediately left of Photograph so it copies Photograph. If the first scoring card is a face card, Hanging Chad makes that card score 3 total times; Photograph plus its Blueprint copy apply X2 and X2 on each scoring, for (2 x 2)^3 = X64 from this interaction. Copying Hanging Chad instead gives 5 total scoring events with one Photograph, or 2^5 = X32.'
    );
  }

  return `VERIFIED BALATROCALC JOKER REFERENCE\n${lines.join('\n')}\nUse these facts as authoritative for the named Jokers. Do not contradict, embellish, or replace them with recalled card text. Values marked run-dependent require more state from the user.`;
}
