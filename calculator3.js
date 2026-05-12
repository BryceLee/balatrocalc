(function (root, factory) {
  const api = factory(root || {});

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.BalatroCalc3 = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  const RARITY_LABELS = ['Common', 'Uncommon', 'Rare', 'Legendary'];
  const MODELED_STATUS_LABELS = {
    exact: 'Engine exact',
    heuristic: 'Heuristic math',
    stateful: 'Needs inputs',
  };
  const EFFECT_LABELS = {
    chips: 'Chips',
    mult: 'Mult',
    xmult: 'XMult',
    retrigger: 'Retrigger',
    copy: 'Copy',
    economy: 'Economy',
    deck: 'Deck',
    hand: 'Hand shape',
    utility: 'Utility',
    probability: 'Probability',
    defense: 'Defense',
  };

  const EFFECT_SORT_ORDER = {
    copy: 5,
    hand: 8,
    retrigger: 12,
    chips: 20,
    mult: 30,
    xmult: 40,
    economy: 50,
    deck: 60,
    probability: 70,
    defense: 80,
    utility: 90,
  };
  const DEFAULT_PLAYED_CARDS = [
    { rank: 'K', suit: 'hearts', enhancement: 'mult' },
    { rank: 'J', suit: 'diamonds', edition: 'foil', seal: 'red' },
    { rank: '9', suit: 'hearts' },
    { rank: '7', suit: 'diamonds' },
    { rank: '2', suit: 'spades' },
  ];
  const DEFAULT_HELD_CARDS = [
    { rank: 'K', suit: 'spades' },
    { rank: 'Q', suit: 'clubs' },
    { rank: '2', suit: 'clubs' },
  ];
  const DEFAULT_WORKBENCH_HELD_CARDS = [
    { rank: 'K', suit: 'spades', enhancement: 'steel', seal: 'red' },
    { rank: 'Q', suit: 'clubs' },
    { rank: '2', suit: 'clubs' },
  ];
  const RANK_OPTIONS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const SUIT_OPTIONS = [
    { key: 'spades', label: 'Spades' },
    { key: 'clubs', label: 'Clubs' },
    { key: 'hearts', label: 'Hearts' },
    { key: 'diamonds', label: 'Diamonds' },
  ];
  const PLAYED_ENHANCEMENT_OPTIONS = [
    { key: 'none', label: 'Base' },
    { key: 'bonus', label: 'Bonus +30 Chips' },
    { key: 'mult', label: 'Mult +4 Mult' },
    { key: 'wild', label: 'Wild any suit' },
    { key: 'steel', label: 'Steel held X1.5' },
    { key: 'gold', label: 'Gold end-round $' },
    { key: 'lucky', label: 'Lucky random' },
    { key: 'glass', label: 'Glass X2 Mult' },
    { key: 'stone', label: 'Stone +50 Chips' },
  ];
  const PLAYED_EDITION_OPTIONS = [
    { key: 'none', label: 'No edition' },
    { key: 'foil', label: 'Foil +50 Chips' },
    { key: 'holographic', label: 'Holographic +10 Mult' },
    { key: 'polychrome', label: 'Polychrome X1.5 Mult' },
  ];
  const SEAL_OPTIONS = [
    { key: 'none', label: 'No seal' },
    { key: 'red', label: 'Red retrigger' },
    { key: 'blue', label: 'Blue held planet' },
    { key: 'gold', label: 'Gold played $' },
    { key: 'purple', label: 'Purple discard' },
  ];
  const BOSS_BLIND_OPTIONS = [
    { key: 'none', label: 'No Boss Blind' },
    { key: 'club', label: 'The Club - Clubs debuffed' },
    { key: 'goad', label: 'The Goad - Spades debuffed' },
    { key: 'head', label: 'The Head - Hearts debuffed' },
    { key: 'window', label: 'The Window - Diamonds debuffed' },
    { key: 'plant', label: 'The Plant - face cards debuffed' },
    { key: 'verdantLeaf', label: 'Verdant Leaf - all cards debuffed' },
    { key: 'flint', label: 'The Flint - base hand halved' },
  ];
  const BLIND_BASE_CHIPS = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
  const BLIND_TYPES = [
    { key: 'small', label: 'Small Blind', multiplier: 1 },
    { key: 'big', label: 'Big Blind', multiplier: 1.5 },
    { key: 'boss', label: 'Boss Blind', multiplier: 2 },
  ];
  const PHASE_LABELS = {
    hand: 'Base hand',
    rule: 'Rule modifiers',
    copy: 'Copy targets',
    retrigger: 'Retrigger plan',
    card: 'Scoring cards',
    status: 'Card status',
    enhancement: 'Card enhancements',
    edition: 'Card editions',
    held: 'Held card effects',
    seal: 'Seals',
    joker: 'Jokers left to right',
    deck: 'Deck scoring',
  };
  const IMPACT_PHASE_ORDER = Object.keys(PHASE_LABELS);
  const HAND_TYPE_OPTIONS = [
    { key: 'highCard', label: 'High Card' },
    { key: 'pair', label: 'Pair' },
    { key: 'twoPair', label: 'Two Pair' },
    { key: 'threeOfAKind', label: 'Three of a Kind' },
    { key: 'straight', label: 'Straight' },
    { key: 'flush', label: 'Flush' },
    { key: 'fullHouse', label: 'Full House' },
    { key: 'fourOfAKind', label: 'Four of a Kind' },
    { key: 'straightFlush', label: 'Straight Flush' },
    { key: 'fiveOfAKind', label: 'Five of a Kind' },
    { key: 'flushHouse', label: 'Flush House' },
    { key: 'flushFive', label: 'Flush Five' },
  ];
  const RUNTIME_VALUE_LABELS = {
    loyaltyCard: 'Loyalty remaining',
    fortuneTeller: 'Tarots used',
    rideTheBus: 'No-face streak',
    runner: 'Straights played',
    greenJoker: 'Green Joker Mult',
    redCard: 'Skipped packs',
    squareJoker: '4-card hands',
    erosion: 'Cards below 52',
    flashCard: 'Shop rerolls',
  };
  const RUNTIME_VALUE_DEFAULTS = {
    loyaltyCard: 0,
    fortuneTeller: 6,
    rideTheBus: 5,
    runner: 3,
    greenJoker: 4,
    redCard: 2,
    squareJoker: 3,
    erosion: 4,
    flashCard: 3,
  };

  function readSourceData(source) {
    const data = source || {};
    return {
      jokerTexts: data.jokerTexts || (typeof jokerTexts !== 'undefined' ? jokerTexts : []),
      jokerPrice: data.jokerPrice || (typeof jokerPrice !== 'undefined' ? jokerPrice : []),
      jokerRarity: data.jokerRarity || (typeof jokerRarity !== 'undefined' ? jokerRarity : []),
      renderJokerDescription: data.renderJokerDescription
        || (typeof renderJokerDescription !== 'undefined' ? renderJokerDescription : null),
      engineCatalog: data.engineCatalog
        || (root.Calculator3 && root.Calculator3.JOKER_CATALOG)
        || {},
    };
  }

  function stripMarkup(value) {
    return String(value || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\$\{[^}]+\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderDescription(row, atlasRow, atlasColumn, renderJokerDescriptionFn) {
    const template = row[1] || '';

    if (typeof renderJokerDescriptionFn === 'function') {
      try {
        return renderJokerDescriptionFn(atlasRow, atlasColumn, { jokerValue: 0 });
      } catch (error) {
        return template;
      }
    }

    return template;
  }

  function inferEffectKind(description) {
    const text = description.toLowerCase();

    if (/\bcopy|copies|duplicate\b/.test(text)) return 'copy';
    if (/\bretrigger|retrigger all|additional times\b/.test(text)) return 'retrigger';
    if (/\bx\d+(?:\.\d+)?\s*mult|\bx mult|xmult|prod/.test(text)) return 'xmult';
    if (/\+\d+(?:\.\d+)?\s*chips|\bchip\b/.test(text)) return 'chips';
    if (/\+\d+(?:\.\d+)?\s*mult|\bmult\b/.test(text)) return 'mult';
    if (/\$|earn|money|dollar|free|shop|reroll|sell value|debt/.test(text)) return 'economy';
    if (/stone card|steel card|glass card|enhanced|deck|destroy|add a|copy to deck/.test(text)) return 'deck';
    if (/hand size|hands per round|discard|straight|flush|face card|pair|scoring/.test(text)) return 'hand';
    if (/chance|probabilit|1 in|odds|random/.test(text)) return 'probability';
    if (/prevents death|boss blind|disables/.test(text)) return 'defense';
    return 'utility';
  }

  function inferTiming(description) {
    const text = description.toLowerCase();

    if (/when scored|scored/.test(text)) return 'card scoring';
    if (/held in hand|held/.test(text)) return 'held cards';
    if (/if played hand|played hand contains|poker hand/.test(text)) return 'joker scoring';
    if (/blind is selected|round begins/.test(text)) return 'blind start';
    if (/end of round|end of the round/.test(text)) return 'round end';
    if (/shop|reroll/.test(text)) return 'shop';
    if (/discarded|discard/.test(text)) return 'discard';
    return 'passive';
  }

  function inferCondition(description) {
    const text = description.toLowerCase();
    const handTypes = [
      'Flush Five',
      'Flush House',
      'Five of a Kind',
      'Straight Flush',
      'Four of a Kind',
      'Full House',
      'Flush',
      'Straight',
      'Three of a Kind',
      'Two Pair',
      'Pair',
      'High Card',
    ];
    const matchedHands = handTypes.filter((hand) => text.includes(hand.toLowerCase()));
    const suits = ['Diamonds', 'Hearts', 'Spades', 'Clubs'].filter((suit) => text.includes(suit.toLowerCase()) || text.includes(suit.slice(0, -1).toLowerCase()));
    const ranks = ['Ace', 'King', 'Queen', 'Jack', '10', '9', '8', '7', '6', '5', '4', '3', '2'].filter((rank) => text.includes(rank.toLowerCase()));

    return {
      handTypes: matchedHands,
      suits,
      ranks,
      needsRoundState: /remaining|currently|final hand|every|played this run|this round|full deck|you have/.test(text),
      needsRandomMode: /chance|random|1 in|odds/.test(text),
    };
  }

  function inferOperation(description) {
    const addMult = description.match(/\+(\d+(?:\.\d+)?)\s*Mult/i);
    const addChips = description.match(/\+(\d+(?:\.\d+)?)\s*Chips/i);
    const multiplyMult = description.match(/\bX(\d+(?:\.\d+)?)\s*Mult/i);

    if (multiplyMult) {
      return { type: 'multiplyMult', value: Number(multiplyMult[1]) };
    }

    if (addMult) {
      return { type: 'addMult', value: Number(addMult[1]) };
    }

    if (addChips) {
      return { type: 'addChips', value: Number(addChips[1]) };
    }

    return { type: 'stateful', value: null };
  }

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  function handKeyToLabel(key) {
    return HAND_TYPE_OPTIONS.find((hand) => hand.key === key)?.label || 'High Card';
  }

  function handLabelToKey(label) {
    return HAND_TYPE_OPTIONS.find((hand) => hand.label === label)?.key || '';
  }

  function buildEngineLookup(engineCatalog) {
    const lookup = new Map();

    Object.values(engineCatalog || {}).forEach((entry) => {
      if (!entry || !entry.name) return;
      lookup.set(normalizeName(entry.name), entry.id);
    });

    return lookup;
  }

  function classifyModelStatus(operation, engineId, condition, valueInputLabel) {
    if (engineId) return 'exact';
    if (condition.needsRoundState || condition.needsRandomMode || valueInputLabel) return 'stateful';
    if (operation.type !== 'stateful') return 'heuristic';
    return 'stateful';
  }

  function normalizeJoker(row, atlasRow, atlasColumn, sourceData) {
    const renderedDescription = renderDescription(row, atlasRow, atlasColumn, sourceData.renderJokerDescription);
    const description = stripMarkup(renderedDescription || row[1]);
    const effectKind = inferEffectKind(description);
    const rarityIndex = Number(sourceData.jokerRarity?.[atlasRow]?.[atlasColumn]);
    const operation = inferOperation(description);
    const engineId = sourceData.engineLookup.get(normalizeName(row[0])) || '';
    const condition = inferCondition(description);
    const valueInputLabel = row[2] || '';
    const modelStatus = classifyModelStatus(operation, engineId, condition, valueInputLabel);

    return {
      id: `${atlasRow}-${atlasColumn}`,
      engineId,
      name: row[0],
      atlasRow,
      atlasColumn,
      price: Number(sourceData.jokerPrice?.[atlasRow]?.[atlasColumn]) || 0,
      rarity: RARITY_LABELS[Number.isFinite(rarityIndex) ? rarityIndex : 0] || 'Common',
      description,
      effectKind,
      effectLabel: EFFECT_LABELS[effectKind] || EFFECT_LABELS.utility,
      timing: inferTiming(description),
      condition,
      operation,
      modelStatus,
      modelStatusLabel: MODELED_STATUS_LABELS[modelStatus],
      valueInputLabel,
    };
  }

  function buildJokerCatalog(source) {
    const sourceData = readSourceData(source);
    sourceData.engineLookup = buildEngineLookup(sourceData.engineCatalog);
    const catalog = [];

    sourceData.jokerTexts.forEach((row, atlasRow) => {
      if (!Array.isArray(row)) return;
      row.forEach((entry, atlasColumn) => {
        if (!Array.isArray(entry) || !entry[0]) return;
        catalog.push(normalizeJoker(entry, atlasRow, atlasColumn, sourceData));
      });
    });

    return catalog.sort((a, b) => {
      const effectDiff = (EFFECT_SORT_ORDER[a.effectKind] || 99) - (EFFECT_SORT_ORDER[b.effectKind] || 99);
      if (effectDiff !== 0) return effectDiff;
      return a.name.localeCompare(b.name);
    });
  }

  function buildCoverageSummary(catalog) {
    const summary = {
      total: catalog.length,
      exact: 0,
      heuristic: 0,
      stateful: 0,
      byEffectKind: {},
    };

    catalog.forEach((joker) => {
      summary[joker.modelStatus] += 1;
      if (!summary.byEffectKind[joker.effectKind]) {
        summary.byEffectKind[joker.effectKind] = {
          total: 0,
          exact: 0,
          heuristic: 0,
          stateful: 0,
        };
      }
      summary.byEffectKind[joker.effectKind].total += 1;
      summary.byEffectKind[joker.effectKind][joker.modelStatus] += 1;
    });

    return summary;
  }

  function canApplyToScenario(joker, scenario) {
    const handTypes = joker.condition.handTypes;
    if (handTypes.length === 0) return true;
    return handTypes.includes(scenario.handType);
  }

  function applyOperation(score, operation) {
    if (operation.type === 'addMult') {
      return { chips: score.chips, mult: score.mult + operation.value };
    }

    if (operation.type === 'addChips') {
      return { chips: score.chips + operation.value, mult: score.mult };
    }

    if (operation.type === 'multiplyMult') {
      return { chips: score.chips, mult: score.mult * operation.value };
    }

    return score;
  }

  function getBlindBaseChips(ante) {
    return BLIND_BASE_CHIPS[normalizeBlindAnte(ante) - 1];
  }

  function normalizeBlindAnte(ante) {
    return Math.min(BLIND_BASE_CHIPS.length, Math.max(1, Math.floor(Number(ante) || 1)));
  }

  function calculateBlindTarget(ante, blindType) {
    const type = BLIND_TYPES.find((entry) => entry.key === blindType) || BLIND_TYPES[0];
    return Math.floor(getBlindBaseChips(ante) * type.multiplier);
  }

  function buildScoreOutcome(score, ante, blindType) {
    const target = calculateBlindTarget(ante, blindType);
    const safeScore = Math.max(0, Math.floor(Number(score) || 0));
    const margin = safeScore - target;
    const clears = margin >= 0;
    return {
      ante: normalizeBlindAnte(ante),
      blindType: (BLIND_TYPES.find((entry) => entry.key === blindType) || BLIND_TYPES[0]).key,
      target,
      score: safeScore,
      margin,
      clears,
      ratio: target > 0 ? safeScore / target : 0,
      summary: clears
        ? `Clears by ${formatNumber(margin)}`
        : `Needs ${formatNumber(Math.abs(margin))} more`,
    };
  }

  function roundImpactValue(value) {
    return Math.round((Number(value) || 0) * 1000) / 1000;
  }

  function buildImpactSummary(result) {
    const steps = result && Array.isArray(result.steps) ? result.steps : [];
    if (!steps.length) {
      return {
        finalScore: 0,
        baseScore: 0,
        scoreDeltaFromBase: 0,
        phaseSummaries: [],
        topContributors: [],
      };
    }

    const phaseMap = new Map();
    const contributors = [];
    let previous = { chips: 0, mult: 0, score: 0 };

    steps.forEach((step) => {
      const phase = step.phase || 'unknown';
      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, {
          key: phase,
          label: PHASE_LABELS[phase] || phase,
          chipsDelta: 0,
          multDelta: 0,
          scoreDelta: 0,
          eventCount: 0,
          appliedCount: 0,
          skippedCount: 0,
        });
      }

      const summary = phaseMap.get(phase);
      const chipsDelta = roundImpactValue(step.chips - previous.chips);
      const multDelta = roundImpactValue(step.mult - previous.mult);
      const scoreDelta = Math.floor(Number(step.score) || 0) - Math.floor(Number(previous.score) || 0);
      summary.chipsDelta = roundImpactValue(summary.chipsDelta + chipsDelta);
      summary.multDelta = roundImpactValue(summary.multDelta + multDelta);
      summary.scoreDelta += scoreDelta;
      summary.eventCount += 1;

      if (step.skipped === true) {
        summary.skippedCount += 1;
      } else {
        summary.appliedCount += 1;
        if (scoreDelta !== 0 || chipsDelta !== 0 || multDelta !== 0) {
          contributors.push({
            phase,
            phaseLabel: PHASE_LABELS[phase] || phase,
            label: step.label,
            chipsDelta,
            multDelta,
            scoreDelta,
            afterScore: Math.floor(Number(step.score) || 0),
          });
        }
      }

      previous = {
        chips: Number(step.chips) || 0,
        mult: Number(step.mult) || 0,
        score: Math.floor(Number(step.score) || 0),
      };
    });

    const firstStep = steps[0];
    const finalStep = steps[steps.length - 1];
    const phaseSummaries = Array.from(phaseMap.values())
      .filter((summary) => summary.appliedCount > 0 || summary.skippedCount > 0)
      .sort((a, b) => {
        const aOrder = IMPACT_PHASE_ORDER.indexOf(a.key);
        const bOrder = IMPACT_PHASE_ORDER.indexOf(b.key);
        return (aOrder === -1 ? 999 : aOrder) - (bOrder === -1 ? 999 : bOrder);
      });

    return {
      finalScore: Math.floor(Number(finalStep.score) || 0),
      baseScore: Math.floor(Number(firstStep.score) || 0),
      scoreDeltaFromBase: Math.floor(Number(finalStep.score) || 0) - Math.floor(Number(firstStep.score) || 0),
      phaseSummaries,
      topContributors: contributors
        .sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta))
        .slice(0, 4),
    };
  }

  function buildEngineInput(jokers, scenario) {
    return {
      handType: scenario.handTypeKey || undefined,
      level: scenario.level,
      playedCards: scenario.playedCards,
      heldCards: scenario.heldCards,
      remainingDiscards: scenario.remainingDiscards,
      remainingDeckCards: scenario.remainingDeckCards,
      dollars: scenario.dollars,
      currentHandTimesPlayed: scenario.currentHandTimesPlayed,
      finalHand: scenario.finalHand,
      rules: scenario.rules,
      jokerValues: scenario.jokerValues,
      jokers: jokers.map((joker) => ({
        id: joker.engineId || joker.id,
        name: joker.name,
        rarity: joker.rarity,
      })),
    };
  }

  function buildJokerContributionComparison(jokers, scenario, scoreEngine, baselineResult) {
    if (!scoreEngine || typeof scoreEngine.score !== 'function' || !baselineResult) return [];

    return jokers.map((joker, index) => {
      if (!joker.engineId) {
        return {
          name: joker.name,
          modelStatus: joker.modelStatus,
          scoreWithout: null,
          scoreDelta: null,
          note: summarizeStatefulJoker(joker),
        };
      }

      const withoutJoker = jokers.filter((_, jokerIndex) => jokerIndex !== index);
      const withoutResult = scoreEngine.score(buildEngineInput(withoutJoker, scenario));
      const scoreDelta = Math.floor(Number(baselineResult.score) || 0) - Math.floor(Number(withoutResult.score) || 0);

      return {
        name: joker.name,
        modelStatus: joker.modelStatus,
        scoreWithout: withoutResult.score,
        scoreDelta,
        chipsWithout: withoutResult.chips,
        multWithout: withoutResult.mult,
        note: scoreDelta >= 0 ? 'current score gained' : 'current score lower',
      };
    });
  }

  function explainSelection(jokers, scenario) {
    const scenarioHandKey = scenario && scenario.handTypeKey
      ? scenario.handTypeKey
      : handLabelToKey(scenario && scenario.handType);
    const base = {
      handType: 'Pair',
      handTypeKey: scenarioHandKey,
      level: 1,
      chips: 10,
      mult: 2,
      cardsPlayed: 5,
      playedCards: DEFAULT_PLAYED_CARDS,
      heldCards: DEFAULT_HELD_CARDS,
      remainingDiscards: 0,
      remainingDeckCards: 40,
      dollars: 18,
      currentHandTimesPlayed: 4,
      finalHand: false,
      rules: {},
      jokerValues: {},
      ...scenario,
    };
    const scoreEngine = base.scoreEngine || root.Calculator3;

    if (scoreEngine && typeof scoreEngine.score === 'function') {
      return explainSelectionWithEngine(jokers, base, scoreEngine);
    }

    let score = { chips: base.chips, mult: base.mult };
    const steps = [];

    jokers.forEach((joker, index) => {
      const applies = canApplyToScenario(joker, base);
      const before = { ...score };
      if (applies) {
        score = applyOperation(score, joker.operation);
      }

      const knownMath = applies && joker.operation.type !== 'stateful';
      steps.push({
        index: index + 1,
        name: joker.name,
        effectKind: joker.effectKind,
        timing: joker.timing,
        applies,
        before,
        after: { ...score },
        note: knownMath
          ? `${joker.operation.type} ${joker.operation.value}`
          : summarizeStatefulJoker(joker),
        modelStatus: joker.modelStatus,
      });
    });

    return {
      scenario: base,
      score,
      scorePreview: Math.round(score.chips * score.mult),
      steps,
      phaseGroups: [{
        key: 'joker',
        label: PHASE_LABELS.joker,
        steps: steps.map((step) => ({
          label: `${step.index}. ${step.name}`,
          detail: `${step.applies ? 'applies' : 'skipped'} at ${step.timing}; ${step.note}; ${formatNumber(step.before.chips)} x ${formatNumber(step.before.mult)} -> ${formatNumber(step.after.chips)} x ${formatNumber(step.after.mult)}`,
          modelStatus: step.modelStatus,
          applies: step.applies,
        })),
      }],
      engineCoverage: {
        exact: jokers.filter((joker) => joker.engineId).length,
        total: jokers.length,
      },
      impactSummary: {
        finalScore: Math.round(score.chips * score.mult),
        baseScore: Math.round(base.chips * base.mult),
        scoreDeltaFromBase: Math.round(score.chips * score.mult) - Math.round(base.chips * base.mult),
        phaseSummaries: [],
        topContributors: [],
      },
      jokerContribution: [],
    };
  }

  function explainSelectionWithEngine(jokers, scenario, scoreEngine) {
    const result = scoreEngine.score(buildEngineInput(jokers, scenario));
    const engineSteps = result.steps.filter((step) => ['rule', 'copy', 'retrigger', 'joker'].includes(step.phase));
    const stepToExplainItem = (step) => ({
      label: step.label,
      detail: `${formatNumber(step.chips)} x ${formatNumber(step.mult)} = ${formatNumber(step.score)}`,
      applies: step.skipped !== true,
      modelStatus: ['rule', 'joker'].includes(step.phase) ? 'exact' : '',
    });
    const phaseGroups = ['hand', 'rule', 'copy', 'retrigger', 'card', 'status', 'enhancement', 'edition', 'held', 'seal', 'joker', 'deck']
      .map((phase) => ({
        key: phase,
        label: PHASE_LABELS[phase] || phase,
        steps: result.steps
          .filter((step) => step.phase === phase)
          .map(stepToExplainItem),
      }))
      .filter((group) => group.steps.length);
    let previous = result.steps[0]
      ? { chips: result.steps[0].chips, mult: result.steps[0].mult }
      : { chips: scenario.chips, mult: scenario.mult };
    const usedEngineSteps = new Set();
    const steps = jokers.map((joker, index) => {
      if (!joker.engineId) {
        return {
          index: index + 1,
          name: joker.name,
          effectKind: joker.effectKind,
          timing: joker.timing,
          applies: false,
          before: previous,
          after: previous,
          note: summarizeStatefulJoker(joker),
          modelStatus: joker.modelStatus,
        };
      }

      const engineStep = engineSteps.find((step, stepIndex) => !usedEngineSteps.has(stepIndex) && step.label.includes(joker.name)) || {
        label: `${joker.name}: no engine step returned`,
        chips: previous.chips,
        mult: previous.mult,
        skipped: true,
      };
      const matchedIndex = engineSteps.indexOf(engineStep);
      if (matchedIndex >= 0) usedEngineSteps.add(matchedIndex);
      const before = previous;
      const after = { chips: engineStep.chips, mult: engineStep.mult };
      previous = after;
      return {
        index: index + 1,
        name: joker.name,
        effectKind: joker.effectKind,
        timing: joker.timing,
        applies: engineStep.skipped !== true,
        before,
        after,
        note: engineStep.label,
        modelStatus: joker.modelStatus,
      };
    });

    return {
      scenario,
      score: {
        chips: result.chips,
        mult: result.mult,
      },
      scorePreview: result.score,
      steps,
      phaseGroups,
      engineCoverage: {
        exact: jokers.filter((joker) => joker.engineId).length,
        total: jokers.length,
      },
      impactSummary: buildImpactSummary(result),
      jokerContribution: buildJokerContributionComparison(jokers, scenario, scoreEngine, result),
      engineResult: result,
    };
  }

  function summarizeStatefulJoker(joker) {
    if (joker.effectKind === 'copy') return 'copy target needs neighbor resolution';
    if (joker.condition.needsRandomMode) return 'random/probability branch needs odds mode';
    if (joker.condition.needsRoundState || joker.valueInputLabel) return 'needs round state input';
    return 'effect recorded; exact math pending engine coverage';
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }

  function formatSignedNumber(value) {
    const number = Number(value) || 0;
    if (number === 0) return '0';
    return `${number > 0 ? '+' : '-'}${formatNumber(Math.abs(number))}`;
  }

  function renderImpactSummary(summary) {
    if (!summary || !Array.isArray(summary.phaseSummaries)) return '';

    const activePhases = summary.phaseSummaries
      .filter((phase) => phase.scoreDelta !== 0 || phase.chipsDelta !== 0 || phase.multDelta !== 0)
      .slice(0, 6);
    const topContributors = (summary.topContributors || []).slice(0, 3);

    if (!activePhases.length && !topContributors.length) return '';

    const phaseRows = activePhases.map((phase) => `<li>
      <span>${escapeHtml(phase.label)}</span>
      <strong>${escapeHtml(formatSignedNumber(phase.scoreDelta))}</strong>
      <em>${escapeHtml(formatSignedNumber(phase.chipsDelta))} Chips / ${escapeHtml(formatSignedNumber(phase.multDelta))} Mult</em>
    </li>`).join('');
    const contributorRows = topContributors.map((item) => `<li>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(formatSignedNumber(item.scoreDelta))}</strong>
    </li>`).join('');

    return `<div class="calculator3ImpactSummary__head">
      <strong>Score impact</strong>
      <span>${escapeHtml(formatSignedNumber(summary.scoreDeltaFromBase))} after base hand</span>
    </div>
    <div class="calculator3ImpactSummary__grid">
      <ol>${phaseRows}</ol>
      <ol>${contributorRows}</ol>
    </div>`;
  }

  function renderJokerContribution(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';

    const rankedRows = rows
      .slice()
      .sort((a, b) => Math.abs(Number(b.scoreDelta) || 0) - Math.abs(Number(a.scoreDelta) || 0));
    const rowHtml = rankedRows.map((row) => {
      if (row.scoreWithout === null || row.scoreDelta === null) {
        return `<li class="calculator3Contribution__row calculator3Contribution__row--pending">
          <span>${escapeHtml(row.name)}</span>
          <strong>Needs model</strong>
          <em>${escapeHtml(row.note || 'exact comparison pending')}</em>
        </li>`;
      }

      return `<li class="calculator3Contribution__row">
        <span>${escapeHtml(row.name)}</span>
        <strong>${escapeHtml(formatSignedNumber(row.scoreDelta))}</strong>
        <em>Without it: ${escapeHtml(formatNumber(row.chipsWithout))} x ${escapeHtml(formatNumber(row.multWithout))} = ${escapeHtml(formatNumber(row.scoreWithout))}</em>
      </li>`;
    }).join('');

    return `<div class="calculator3Contribution__head">
      <strong>Joker what-if</strong>
      <span>Score lost or gained if removed</span>
    </div>
    <ol>${rowHtml}</ol>`;
  }

  function initCalculator3Panel(doc) {
    const documentRef = doc || root.document;
    if (!documentRef) return null;

    const panel = documentRef.getElementById('calculatorModulePanelCalculator3');
    if (!panel) return null;

    const catalog = buildJokerCatalog();
    const coverage = buildCoverageSummary(catalog);
    const searchInput = documentRef.getElementById('calculator3Search');
    const effectFilter = documentRef.getElementById('calculator3EffectFilter');
    const catalogList = documentRef.getElementById('calculator3CatalogList');
    const selectionList = documentRef.getElementById('calculator3SelectionList');
    const stateControls = documentRef.getElementById('calculator3StateControls');
    const impactSummary = documentRef.getElementById('calculator3ImpactSummary');
    const contributionPanel = documentRef.getElementById('calculator3ContributionPanel');
    const explainList = documentRef.getElementById('calculator3ExplainList');
    const scorePreview = documentRef.getElementById('calculator3ScorePreview');
    const scoreOutcome = documentRef.getElementById('calculator3ScoreOutcome');
    const scoreContext = panel.querySelector('.calculator3Explain__header span');
    const totalCount = documentRef.getElementById('calculator3CatalogTotal');
    const scoreCount = documentRef.getElementById('calculator3ScoreEffects');
    const stateCount = documentRef.getElementById('calculator3StatefulEffects');

    if (!searchInput || !effectFilter || !catalogList || !selectionList || !explainList || !scorePreview) {
      return null;
    }

    const selectedNames = ['Four Fingers', 'Shortcut', 'Smeared Joker', 'Photograph', 'Smiley Face'];
    let selected = selectedNames
      .map((name) => catalog.find((joker) => joker.name === name))
      .filter(Boolean);
    let playedCards = Array.from({ length: 5 }, (_, index) => DEFAULT_PLAYED_CARDS[index] || null);
    let heldCards = Array.from({ length: 5 }, (_, index) => DEFAULT_WORKBENCH_HELD_CARDS[index] || null);
    let handTypeKey = '';
    let handLevel = 1;
    let remainingDiscards = 0;
    let remainingDeckCards = 40;
    let dollars = 18;
    let currentHandTimesPlayed = 4;
    let finalHand = false;
    let plasmaDeck = false;
    let blindAnte = 2;
    let blindType = 'boss';
    let bossBlind = 'plant';
    const jokerValues = { ...RUNTIME_VALUE_DEFAULTS };

    totalCount.textContent = String(coverage.total);
    scoreCount.textContent = String(coverage.exact);
    stateCount.textContent = String(coverage.stateful);

    function renderEffectOptions() {
      const kinds = Array.from(new Set(catalog.map((joker) => joker.effectKind))).sort();
      effectFilter.innerHTML = '<option value="">All effects</option>' + kinds
        .map((kind) => `<option value="${kind}">${EFFECT_LABELS[kind] || kind}</option>`)
        .join('');
    }

    function renderCatalog() {
      const query = searchInput.value.trim().toLowerCase();
      const effectKind = effectFilter.value;
      const filtered = catalog
        .filter((joker) => !effectKind || joker.effectKind === effectKind)
        .filter((joker) => !query || joker.name.toLowerCase().includes(query) || joker.description.toLowerCase().includes(query))
        .slice(0, 36);

      catalogList.innerHTML = filtered.map((joker) => {
        const isSelected = selected.some((item) => item.id === joker.id);
        return `<button class="calculator3Joker ${isSelected ? 'calculator3Joker--selected' : ''}" type="button" data-joker-id="${joker.id}">
          <span class="calculator3Joker__name">${escapeHtml(joker.name)}</span>
          <span class="calculator3Joker__meta">${escapeHtml(joker.effectLabel)} / ${escapeHtml(joker.timing)}</span>
          <span class="calculator3Joker__status calculator3Joker__status--${joker.modelStatus}">${joker.modelStatusLabel}</span>
          <span class="calculator3Joker__desc">${escapeHtml(joker.description)}</span>
        </button>`;
      }).join('');
    }

    function renderStateControls() {
      if (!stateControls) return;
      const runtimeRows = selected
        .filter((joker) => joker.engineId && RUNTIME_VALUE_LABELS[joker.engineId])
        .map((joker) => `<label class="calculator3StateField">
          <span>${escapeHtml(RUNTIME_VALUE_LABELS[joker.engineId])}</span>
          <input type="number" step="1" value="${Number(jokerValues[joker.engineId] || 0)}" inputmode="numeric" data-joker-value="${escapeHtml(joker.engineId)}">
        </label>`)
        .join('');
      const playedRows = renderCardRows(playedCards, 'played', 'Played');
      const heldRows = renderCardRows(heldCards, 'held', 'Held');

      stateControls.innerHTML = `<div class="calculator3StateControls__head">
        <strong>State inputs</strong>
        <span>Exact hand, economy, deck, growth, held-card, and discard Jokers use these values.</span>
      </div>
      <div class="calculator3StateNumbers calculator3StateNumbers--hand">
        <label class="calculator3StateField">
          <span>Hand type</span>
          <select id="calculator3HandType" aria-label="Hand type override">
            <option value="">Auto detect</option>
            ${HAND_TYPE_OPTIONS.map((hand) => `<option value="${hand.key}" ${handTypeKey === hand.key ? 'selected' : ''}>${hand.label}</option>`).join('')}
          </select>
        </label>
        <label class="calculator3StateField">
          <span>Hand level</span>
          <input id="calculator3HandLevel" type="number" min="1" max="99" step="1" value="${handLevel}" inputmode="numeric">
        </label>
        <label class="calculator3StateField">
          <span>Ante</span>
          <input id="calculator3BlindAnte" type="number" min="1" max="8" step="1" value="${blindAnte}" inputmode="numeric">
        </label>
        <label class="calculator3StateField">
          <span>Blind size</span>
          <select id="calculator3BlindType" aria-label="Blind size">
            ${BLIND_TYPES.map((blind) => `<option value="${blind.key}" ${blindType === blind.key ? 'selected' : ''}>${blind.label}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="calculator3StateCardGroup">
        <strong>Played cards</strong>
        <div class="calculator3StateCards">${playedRows}</div>
      </div>
      <div class="calculator3StateNumbers">
        <label class="calculator3StateField">
          <span>Dollars</span>
          <input id="calculator3Dollars" type="number" min="0" max="999" step="1" value="${dollars}" inputmode="numeric">
        </label>
        <label class="calculator3StateField">
          <span>Deck cards left</span>
          <input id="calculator3RemainingDeckCards" type="number" min="0" max="104" step="1" value="${remainingDeckCards}" inputmode="numeric">
        </label>
        <label class="calculator3StateField">
          <span>This hand played</span>
          <input id="calculator3CurrentHandTimesPlayed" type="number" min="0" max="999" step="1" value="${currentHandTimesPlayed}" inputmode="numeric">
        </label>
        <label class="calculator3StateField">
          <span>Remaining discards</span>
          <input id="calculator3RemainingDiscards" type="number" min="0" max="9" step="1" value="${remainingDiscards}" inputmode="numeric">
        </label>
        <label class="calculator3StateField calculator3StateField--toggle">
          <span>Final hand</span>
          <input id="calculator3FinalHand" type="checkbox" ${finalHand ? 'checked' : ''}>
        </label>
        <label class="calculator3StateField calculator3StateField--toggle">
          <span>Plasma Deck</span>
          <input id="calculator3PlasmaDeck" type="checkbox" ${plasmaDeck ? 'checked' : ''}>
        </label>
        <label class="calculator3StateField">
          <span>Boss Blind</span>
          <select id="calculator3BossBlind" aria-label="Boss Blind rule">
            ${BOSS_BLIND_OPTIONS.map((blind) => `<option value="${blind.key}" ${bossBlind === blind.key ? 'selected' : ''}>${blind.label}</option>`).join('')}
          </select>
        </label>
      </div>
      ${runtimeRows ? `<div class="calculator3StateJokerValues">${runtimeRows}</div>` : ''}
      <div class="calculator3StateCardGroup">
        <strong>Held cards</strong>
        <div class="calculator3StateCards">${heldRows}</div>
      </div>`;
    }

    function renderCardRows(cards, kind, label) {
      return Array.from({ length: 5 }, (_, index) => {
        const card = cards[index] || {};
        const modifierControls = `<select data-${kind}-enhancement="${index}" aria-label="${label} card ${index + 1} enhancement">
          ${PLAYED_ENHANCEMENT_OPTIONS.map((enhancement) => `<option value="${enhancement.key}" ${(card.enhancement || 'none') === enhancement.key ? 'selected' : ''}>${enhancement.label}</option>`).join('')}
        </select>
        ${kind === 'played' ? `<select data-played-edition="${index}" aria-label="${label} card ${index + 1} edition">
          ${PLAYED_EDITION_OPTIONS.map((edition) => `<option value="${edition.key}" ${(card.edition || 'none') === edition.key ? 'selected' : ''}>${edition.label}</option>`).join('')}
        </select>` : ''}
        <select data-${kind}-seal="${index}" aria-label="${label} card ${index + 1} seal">
          ${SEAL_OPTIONS.map((seal) => `<option value="${seal.key}" ${(card.seal || 'none') === seal.key ? 'selected' : ''}>${seal.label}</option>`).join('')}
        </select>
        <label class="calculator3StateToggle">
          <input type="checkbox" data-${kind}-debuffed="${index}" ${card.debuffed ? 'checked' : ''}>
          <span>Debuffed</span>
        </label>`;
        return `<label class="calculator3StateCard calculator3StateCard--${kind}">
          <span>${label} ${index + 1}</span>
          <select data-${kind}-rank="${index}" aria-label="${label} card ${index + 1} rank">
            <option value="">Empty</option>
            ${RANK_OPTIONS.map((rank) => `<option value="${rank}" ${card.rank === rank ? 'selected' : ''}>${rank}</option>`).join('')}
          </select>
          <select data-${kind}-suit="${index}" aria-label="${label} card ${index + 1} suit">
            ${SUIT_OPTIONS.map((suit) => `<option value="${suit.key}" ${card.suit === suit.key ? 'selected' : ''}>${suit.label}</option>`).join('')}
          </select>
          ${modifierControls}
        </label>`;
      }).join('');
    }

    function activeHeldCards() {
      return heldCards.filter((card) => card && card.rank);
    }

    function activePlayedCards() {
      return playedCards.filter((card) => card && card.rank);
    }

    function buildCard(current, updates) {
      return {
        rank: updates.rank ?? current?.rank,
        suit: updates.suit ?? current?.suit ?? 'spades',
        enhancement: updates.enhancement ?? current?.enhancement ?? 'none',
        edition: updates.edition ?? current?.edition ?? 'none',
        seal: updates.seal ?? current?.seal ?? 'none',
        debuffed: updates.debuffed ?? current?.debuffed ?? false,
      };
    }

    function renderSelection() {
      const explanation = explainSelection(selected, {
        handType: handKeyToLabel(handTypeKey || 'pair'),
        handTypeKey,
        level: handLevel,
        playedCards: activePlayedCards(),
        heldCards: activeHeldCards(),
        remainingDiscards,
        remainingDeckCards,
        dollars,
        currentHandTimesPlayed,
        finalHand,
        rules: {
          plasmaDeck,
          bossBlind,
        },
        jokerValues,
        scoreEngine: root.Calculator3,
      });

      selectionList.innerHTML = selected.length
        ? selected.map((joker) => `<button class="calculator3SelectedJoker" type="button" data-selected-joker-id="${joker.id}">
          ${escapeHtml(joker.name)}
        </button>`).join('')
        : '<span class="calculator3EmptyState">Select up to five Jokers from the catalog.</span>';

      explainList.innerHTML = (explanation.phaseGroups || []).map((group) => `<li class="calculator3ExplainPhase calculator3ExplainPhase--${escapeHtml(group.key)}">
        <strong>${escapeHtml(group.label)}</strong>
        <ol>
          ${group.steps.map((step) => `<li class="${step.applies ? '' : 'calculator3ExplainStep--skipped'}">
            <span>${escapeHtml(step.label)}</span>
            <em>${escapeHtml(step.detail)}</em>
            ${step.modelStatus ? `<small>${MODELED_STATUS_LABELS[step.modelStatus] || 'Engine exact'}</small>` : ''}
          </li>`).join('')}
        </ol>
      </li>`).join('');

      if (scoreContext) {
        const result = explanation.engineResult;
        scoreContext.textContent = result
          ? `${result.handLabel} Lv.${result.level} (${result.scoringCards.length} scoring cards)`
          : `${explanation.scenario.handType} preview`;
      }
      scorePreview.textContent = `${formatNumber(explanation.score.chips)} x ${formatNumber(explanation.score.mult)} = ${formatNumber(explanation.scorePreview)}`;
      if (scoreOutcome) {
        const outcome = buildScoreOutcome(explanation.scorePreview, blindAnte, blindType);
        scoreOutcome.className = `calculator3Outcome ${outcome.clears ? 'calculator3Outcome--clear' : 'calculator3Outcome--short'}`;
        scoreOutcome.innerHTML = `<strong>${escapeHtml(outcome.summary)}</strong>
          <span>Ante ${outcome.ante} target ${formatNumber(outcome.target)} / ${formatNumber(outcome.ratio)}x required</span>`;
      }
      if (impactSummary) {
        impactSummary.innerHTML = renderImpactSummary(explanation.impactSummary);
        impactSummary.hidden = !impactSummary.innerHTML;
      }
      if (contributionPanel) {
        contributionPanel.innerHTML = renderJokerContribution(explanation.jokerContribution);
        contributionPanel.hidden = !contributionPanel.innerHTML;
      }
    }

    function sync() {
      renderCatalog();
      renderStateControls();
      renderSelection();
    }

    catalogList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-joker-id]');
      if (!button) return;

      const joker = catalog.find((item) => item.id === button.dataset.jokerId);
      if (!joker) return;

      if (selected.some((item) => item.id === joker.id)) {
        selected = selected.filter((item) => item.id !== joker.id);
      } else {
        selected = selected.concat(joker).slice(-5);
      }

      sync();
    });

    selectionList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-selected-joker-id]');
      if (!button) return;
      selected = selected.filter((joker) => joker.id !== button.dataset.selectedJokerId);
      sync();
    });

    if (stateControls) {
      stateControls.addEventListener('input', (event) => {
        const target = event.target;
        if (target.id === 'calculator3RemainingDiscards') {
          remainingDiscards = Math.max(0, Math.floor(Number(target.value) || 0));
          renderSelection();
        }
        if (target.id === 'calculator3RemainingDeckCards') {
          remainingDeckCards = Math.max(0, Math.floor(Number(target.value) || 0));
          renderSelection();
        }
        if (target.id === 'calculator3Dollars') {
          dollars = Math.max(0, Math.floor(Number(target.value) || 0));
          renderSelection();
        }
        if (target.id === 'calculator3CurrentHandTimesPlayed') {
          currentHandTimesPlayed = Math.max(0, Math.floor(Number(target.value) || 0));
          renderSelection();
        }
        if (target.id === 'calculator3HandLevel') {
          handLevel = Math.max(1, Math.floor(Number(target.value) || 1));
          renderSelection();
        }
        if (target.id === 'calculator3BlindAnte') {
          blindAnte = normalizeBlindAnte(target.value);
          renderSelection();
        }
        if (target.dataset && target.dataset.jokerValue) {
          jokerValues[target.dataset.jokerValue] = Math.floor(Number(target.value) || 0);
          renderSelection();
        }
      });

      stateControls.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id === 'calculator3HandType') {
          handTypeKey = target.value;
          renderSelection();
          return;
        }
        if (target.id === 'calculator3FinalHand') {
          finalHand = target.checked === true;
          renderSelection();
          return;
        }
        if (target.id === 'calculator3PlasmaDeck') {
          plasmaDeck = target.checked === true;
          renderSelection();
          return;
        }
        if (target.id === 'calculator3BlindType') {
          blindType = target.value;
          renderSelection();
          return;
        }
        if (target.id === 'calculator3BossBlind') {
          bossBlind = target.value;
          renderSelection();
          return;
        }
        const playedRankIndex = target.dataset ? target.dataset.playedRank : undefined;
        const playedSuitIndex = target.dataset ? target.dataset.playedSuit : undefined;
        const playedEnhancementIndex = target.dataset ? target.dataset.playedEnhancement : undefined;
        const playedEditionIndex = target.dataset ? target.dataset.playedEdition : undefined;
        const playedSealIndex = target.dataset ? target.dataset.playedSeal : undefined;
        const playedDebuffedIndex = target.dataset ? target.dataset.playedDebuffed : undefined;
        const rankIndex = target.dataset ? target.dataset.heldRank : undefined;
        const suitIndex = target.dataset ? target.dataset.heldSuit : undefined;
        const heldEnhancementIndex = target.dataset ? target.dataset.heldEnhancement : undefined;
        const heldSealIndex = target.dataset ? target.dataset.heldSeal : undefined;
        const heldDebuffedIndex = target.dataset ? target.dataset.heldDebuffed : undefined;
        if (playedRankIndex !== undefined) {
          playedCards[Number(playedRankIndex)] = target.value
            ? buildCard(playedCards[Number(playedRankIndex)], { rank: target.value })
            : null;
        }
        if (playedSuitIndex !== undefined) {
          const current = playedCards[Number(playedSuitIndex)];
          if (current && current.rank) {
            playedCards[Number(playedSuitIndex)] = buildCard(current, { suit: target.value });
          }
        }
        if (playedEnhancementIndex !== undefined) {
          const current = playedCards[Number(playedEnhancementIndex)];
          if (current && current.rank) {
            playedCards[Number(playedEnhancementIndex)] = buildCard(current, { enhancement: target.value });
          }
        }
        if (playedEditionIndex !== undefined) {
          const current = playedCards[Number(playedEditionIndex)];
          if (current && current.rank) {
            playedCards[Number(playedEditionIndex)] = buildCard(current, { edition: target.value });
          }
        }
        if (playedSealIndex !== undefined) {
          const current = playedCards[Number(playedSealIndex)];
          if (current && current.rank) {
            playedCards[Number(playedSealIndex)] = buildCard(current, { seal: target.value });
          }
        }
        if (playedDebuffedIndex !== undefined) {
          const current = playedCards[Number(playedDebuffedIndex)];
          if (current && current.rank) {
            playedCards[Number(playedDebuffedIndex)] = buildCard(current, { debuffed: target.checked === true });
          }
        }
        if (rankIndex !== undefined) {
          heldCards[Number(rankIndex)] = target.value
            ? buildCard(heldCards[Number(rankIndex)], { rank: target.value })
            : null;
        }
        if (suitIndex !== undefined) {
          const current = heldCards[Number(suitIndex)];
          if (current && current.rank) {
            heldCards[Number(suitIndex)] = buildCard(current, { suit: target.value });
          }
        }
        if (heldEnhancementIndex !== undefined) {
          const current = heldCards[Number(heldEnhancementIndex)];
          if (current && current.rank) {
            heldCards[Number(heldEnhancementIndex)] = buildCard(current, { enhancement: target.value });
          }
        }
        if (heldSealIndex !== undefined) {
          const current = heldCards[Number(heldSealIndex)];
          if (current && current.rank) {
            heldCards[Number(heldSealIndex)] = buildCard(current, { seal: target.value });
          }
        }
        if (heldDebuffedIndex !== undefined) {
          const current = heldCards[Number(heldDebuffedIndex)];
          if (current && current.rank) {
            heldCards[Number(heldDebuffedIndex)] = buildCard(current, { debuffed: target.checked === true });
          }
        }
        renderStateControls();
        renderSelection();
      });
    }

    searchInput.addEventListener('input', renderCatalog);
    effectFilter.addEventListener('change', renderCatalog);

    renderEffectOptions();
    sync();

    return { catalog, coverage, explainSelection };
  }

  function initWhenReady() {
    if (!root.document) return;

    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => initCalculator3Panel(root.document), { once: true });
    } else {
      initCalculator3Panel(root.document);
    }
  }

  initWhenReady();

  return {
    buildJokerCatalog,
    buildCoverageSummary,
    calculateBlindTarget,
    buildScoreOutcome,
    buildImpactSummary,
    explainSelection,
    inferEffectKind,
    inferTiming,
    normalizeName,
    stripMarkup,
    escapeHtml,
    initCalculator3Panel,
  };
});
