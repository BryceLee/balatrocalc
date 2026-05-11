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

  function explainSelection(jokers, scenario) {
    const base = {
      handType: 'Pair',
      chips: 10,
      mult: 2,
      cardsPlayed: 5,
      ...scenario,
    };
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
      engineCoverage: {
        exact: jokers.filter((joker) => joker.engineId).length,
        total: jokers.length,
      },
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
    const explainList = documentRef.getElementById('calculator3ExplainList');
    const scorePreview = documentRef.getElementById('calculator3ScorePreview');
    const totalCount = documentRef.getElementById('calculator3CatalogTotal');
    const scoreCount = documentRef.getElementById('calculator3ScoreEffects');
    const stateCount = documentRef.getElementById('calculator3StatefulEffects');

    if (!searchInput || !effectFilter || !catalogList || !selectionList || !explainList || !scorePreview) {
      return null;
    }

    const selectedNames = ['Joker', 'The Duo', 'Blueprint', 'Card Sharp'];
    let selected = selectedNames
      .map((name) => catalog.find((joker) => joker.name === name))
      .filter(Boolean);

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

    function renderSelection() {
      const explanation = explainSelection(selected, { handType: 'Pair', chips: 10, mult: 2 });

      selectionList.innerHTML = selected.length
        ? selected.map((joker) => `<button class="calculator3SelectedJoker" type="button" data-selected-joker-id="${joker.id}">
          ${escapeHtml(joker.name)}
        </button>`).join('')
        : '<span class="calculator3EmptyState">Select up to five Jokers from the catalog.</span>';

      explainList.innerHTML = explanation.steps.map((step) => `<li>
        <strong>${step.index}. ${escapeHtml(step.name)}</strong>
        <span>${step.applies ? 'applies' : 'skipped'} at ${escapeHtml(step.timing)}; ${escapeHtml(step.note)}; ${formatNumber(step.before.chips)} x ${formatNumber(step.before.mult)} -> ${formatNumber(step.after.chips)} x ${formatNumber(step.after.mult)}</span>
        <em>${MODELED_STATUS_LABELS[step.modelStatus] || 'Recorded'}</em>
      </li>`).join('');

      scorePreview.textContent = `${formatNumber(explanation.score.chips)} x ${formatNumber(explanation.score.mult)} = ${formatNumber(explanation.scorePreview)}`;
    }

    function sync() {
      renderCatalog();
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
    explainSelection,
    inferEffectKind,
    inferTiming,
    normalizeName,
    stripMarkup,
    escapeHtml,
    initCalculator3Panel,
  };
});
