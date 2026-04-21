const HAND_TYPE_DATA = [
  { name: 'Flush Five', label: 'Flush Five' },
  { name: 'Flush House', label: 'Flush House' },
  { name: 'Five of a Kind', label: 'Five of a Kind' },
  { name: 'Straight Flush', label: 'Straight Flush' },
  { name: 'Four of a Kind', label: 'Four of a Kind' },
  { name: 'Full House', label: 'Full House' },
  { name: 'Flush', label: 'Flush' },
  { name: 'Straight', label: 'Straight' },
  { name: 'Three of a Kind', label: 'Three of a Kind' },
  { name: 'Two Pair', label: 'Two Pair' },
  { name: 'Pair', label: 'Pair' },
  { name: 'High Card', label: 'High Card' },
];

const CARD_SUITS = [
  { key: 'hearts', label: 'Hearts' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'diamonds', label: 'Diamonds' },
  { key: 'spades', label: 'Spades' },
];

const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RARITY_LABELS = ['Common', 'Uncommon', 'Rare', 'Legendary'];

const state = {
  handCards: [],
  playedCards: [],
  jokerOrder: [],
  selectedHandCardIds: new Set(),
  activeJokerId: null,
  score: {
    total: [0, 0],
    chips: 0,
    mult: [0, 0],
    typeIndex: null,
  },
  scorePending: false,
  scoreError: null,
  modal: {
    type: null,
    search: '',
    selectedKeys: new Set(),
  },
};

let hands = createHandsState();
let nextCardId = 1;
let nextJokerId = 1;
let scoreWorker = null;
let scoreRequestId = 0;
let activeScoreRequestId = 0;
let lastScoreSignature = '';

const elements = {
  scorePrimary: document.getElementById('scorePrimary'),
  scoreHandName: document.getElementById('scoreHandName'),
  scoreChipsValue: document.getElementById('scoreChipsValue'),
  scoreMultValue: document.getElementById('scoreMultValue'),
  jokerCountValue: document.getElementById('jokerCountValue'),
  handCountValue: document.getElementById('handCountValue'),
  playedCountValue: document.getElementById('playedCountValue'),
  selectedCountValue: document.getElementById('selectedCountValue'),
  playHint: document.getElementById('playHint'),
  jokerLane: document.getElementById('jokerLane'),
  playedLane: document.getElementById('playedLane'),
  handLane: document.getElementById('handLane'),
  jokerInspector: document.getElementById('jokerInspector'),
  playSelectionBtn: document.getElementById('playSelectionBtn'),
  resetPlayBtn: document.getElementById('resetPlayBtn'),
  clearHandBtn: document.getElementById('clearHandBtn'),
  clearJokersBtn: document.getElementById('clearJokersBtn'),
  openJokerPickerBtn: document.getElementById('openJokerPickerBtn'),
  openCardPickerBtn: document.getElementById('openCardPickerBtn'),
  pickerOverlay: document.getElementById('pickerOverlay'),
  pickerEyebrow: document.getElementById('pickerEyebrow'),
  pickerTitle: document.getElementById('pickerTitle'),
  pickerSearchInput: document.getElementById('pickerSearchInput'),
  pickerSummary: document.getElementById('pickerSummary'),
  pickerGrid: document.getElementById('pickerGrid'),
  pickerCloseBtn: document.getElementById('pickerCloseBtn'),
  pickerCancelBtn: document.getElementById('pickerCancelBtn'),
  pickerConfirmBtn: document.getElementById('pickerConfirmBtn'),
};

function createHandsState() {
  return HAND_TYPE_DATA.map((hand) => ({
    ...hand,
    level: 1,
    planets: 0,
    played: 0,
    playedThisRound: 0,
  }));
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

function buildZeroScore() {
  return {
    total: [0, 0],
    chips: 0,
    mult: [0, 0],
    typeIndex: null,
  };
}

function getJokerDefinition(type0, type1) {
  const row = jokerTexts[type0] || [];
  const entry = row[type1] || ['WIP', 'WIP'];
  return {
    type0,
    type1,
    title: entry[0] || 'WIP',
    description: renderJokerDescription(type0, type1, { jokerValue: 0 }),
    valueLabel: entry[2] || '',
    rarity: (jokerRarity[type0] && typeof jokerRarity[type0][type1] !== 'undefined') ? jokerRarity[type0][type1] : 0,
    price: (jokerPrice[type0] && typeof jokerPrice[type0][type1] !== 'undefined') ? jokerPrice[type0][type1] : 0,
  };
}

function getAllJokers() {
  const items = [];
  for (let i = 0; i < jokerTexts.length; i++) {
    if (i === 9) continue;
    for (let j = 0; j < (jokerTexts[i] || []).length; j++) {
      const def = getJokerDefinition(i, j);
      items.push(def);
    }
  }
  return items.sort((a, b) => {
    if (a.rarity !== b.rarity) return a.rarity - b.rarity;
    if (a.price !== b.price) return a.price - b.price;
    return a.title.localeCompare(b.title, 'zh-CN');
  });
}

function getAllCards() {
  const items = [];
  for (let suit = 0; suit < CARD_SUITS.length; suit++) {
    for (let rank = 0; rank < CARD_RANKS.length; rank++) {
      const title = `${CARD_RANKS[rank]} of ${CARD_SUITS[suit].label}`;
      items.push({
        key: `${suit}-${rank}`,
        suit,
        rank,
        title,
        searchText: `${title} ${CARD_SUITS[suit].key} ${CARD_RANKS[rank]}`.toLowerCase(),
      });
    }
  }
  return items;
}

function getBaseJokerSellValue(type0, type1) {
  const price = (jokerPrice[type0] && jokerPrice[type0][type1]) || 0;
  return Math.floor(price / 2);
}

function createBaseJoker(type0, type1) {
  return {
    id: `j${nextJokerId++}`,
    type: [type0, type1],
    value: 0,
    sell: getBaseJokerSellValue(type0, type1),
    modifiers: {
      foil: false,
      holographic: false,
      polychrome: false,
      disabled: false,
    },
  };
}

function createBaseCard(suit, rank) {
  return {
    id: `c${nextCardId++}`,
    type: [suit, rank],
  };
}

function getSelectedJokers() {
  return state.jokerOrder.map((id) => playfieldJokers[id]).filter(Boolean);
}

function getJokerTitle(joker) {
  const entry = jokerTexts[joker.type[0]] && jokerTexts[joker.type[0]][joker.type[1]];
  return entry ? entry[0] : 'WIP';
}

function getJokerValueLabel(joker) {
  const entry = jokerTexts[joker.type[0]] && jokerTexts[joker.type[0]][joker.type[1]];
  return entry && entry[2] ? entry[2] : '';
}

function getJokerDescription(joker) {
  return renderJokerDescription(joker.type[0], joker.type[1], { jokerValue: joker.value || 0 });
}

function getCardTitle(card) {
  return `${CARD_RANKS[card.type[1]]} of ${CARD_SUITS[card.type[0]].label}`;
}

function getCardSpriteStyle(suit, rank) {
  return `background: url(assets/Jokers.png) 0px -855px, url(assets/8BitDeck.png) -${71 * rank}px -${95 * suit}px`;
}

function getJokerSpriteStyle(type0, type1, modifiers = {}) {
  let baseShadow = 'url(assets/Jokers.png) 0px -855px, ';
  switch (`${type0},${type1}`) {
    case '8,3':
      baseShadow = `url(assets/Jokers.png) -${71 * 3}px -${95 * 9}px, `;
      break;
    case '8,4':
      baseShadow = `url(assets/Jokers.png) -${71 * 4}px -${95 * 9}px, `;
      break;
    case '8,5':
      baseShadow = `url(assets/Jokers.png) -${71 * 5}px -${95 * 9}px, `;
      break;
    case '8,6':
      baseShadow = `url(assets/Jokers.png) -${71 * 6}px -${95 * 9}px, `;
      break;
    case '8,7':
      baseShadow = `url(assets/Jokers.png) -${71 * 7}px -${95 * 9}px, `;
      break;
    case '12,4':
      baseShadow = `url(assets/Jokers.png) -${71 * 2}px -${95 * 9}px, `;
      break;
    default:
      break;
  }

  let overlay = '';
  if (modifiers.foil) overlay = 'url(assets/Editions.png) -71px 0, ';
  if (modifiers.holographic) overlay = 'url(assets/Editions.png) -142px 0, ';
  if (modifiers.polychrome) overlay = 'url(assets/Editions.png) -213px 0, ';
  if (modifiers.disabled) overlay = 'url(assets/Editions.png) 71px 0, ';

  return `mask-position: -${71 * type1}px -${95 * type0}px; background: ${overlay}${baseShadow}url(assets/Jokers.png) -${71 * type1}px -${95 * type0}px`;
}

function formatNumber(num) {
  if (typeof num !== 'number' || Number.isNaN(num)) return '0';
  if (Math.abs(num) >= 1e11) {
    return `${Math.floor((num / (10 ** Math.floor(Math.log10(Math.abs(num))))) * 1000) / 1000}e${Math.floor(Math.log10(Math.abs(num)))}`;
  }
  if (Math.round(num) !== num) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return Math.round(num).toLocaleString('en-US');
}

function formatBigNumber(bigValue, whole = false) {
  if (!bigValue) return '0';
  if (bigValue[1] > 11) {
    return `${Math.floor(bigValue[0] * 10000) / 10000}e${bigValue[1]}`;
  }

  const resolved = bigValue[0] * (10 ** bigValue[1]);
  if (!Number.isFinite(resolved)) {
    return `${Math.floor(bigValue[0] * 10000) / 10000}e${bigValue[1]}`;
  }

  if (whole) {
    return Math.floor(resolved).toLocaleString('en-US');
  }

  return resolved.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: resolved >= 1000 ? 0 : 2,
  });
}

function buildHandStateSnapshot() {
  return hands.map((hand) => [hand.level, hand.planets, hand.played, hand.playedThisRound]);
}

function buildEngineCard(card, index) {
  return [
    card.type[1],
    card.type[0],
    0,
    0,
    0,
    0,
    false,
    index,
  ];
}

function buildEngineJoker(joker, index) {
  return [
    joker.type[0] * 10 + joker.type[1],
    joker.value || 0,
    0,
    !!joker.modifiers.disabled,
    joker.sell || 0,
    index,
  ];
}

function buildScorePayload() {
  if (state.playedCards.length === 0) {
    return null;
  }

  return {
    cards: state.playedCards.map(buildEngineCard),
    cardsInHand: state.handCards.map(buildEngineCard),
    jokers: getSelectedJokers().map(buildEngineJoker),
    hands: buildHandStateSnapshot(),
    TheFlint: false,
    TheEye: false,
    PlasmaDeck: false,
    Observatory: false,
  };
}

function requestScoreCalculation() {
  const payload = buildScorePayload();
  if (!payload) {
    lastScoreSignature = '';
    activeScoreRequestId = 0;
    state.score = buildZeroScore();
    state.scorePending = false;
    state.scoreError = null;
    return;
  }

  const signature = JSON.stringify(payload);
  if (signature === lastScoreSignature) {
    return;
  }

  lastScoreSignature = signature;
  state.scorePending = true;
  state.scoreError = null;

  if (!scoreWorker) {
    state.score = buildZeroScore();
    state.scorePending = false;
    state.scoreError = 'Score worker unavailable';
    return;
  }

  activeScoreRequestId = ++scoreRequestId;
  scoreWorker.postMessage({
    requestId: activeScoreRequestId,
    payload,
  });
}

function setPlayfieldJokers(newOrder) {
  const remapped = {};
  newOrder.forEach((id) => {
    if (playfieldJokers[id]) remapped[id] = playfieldJokers[id];
  });
  playfieldJokers = remapped;
  state.jokerOrder = newOrder.filter((id) => playfieldJokers[id]);
}

function renderScore() {
  const score = state.score;
  const hasPlay = state.playedCards.length > 0;
  const resolvedHandLabel = score.typeIndex === null || !HAND_TYPE_DATA[score.typeIndex]
    ? 'Unknown Hand'
    : HAND_TYPE_DATA[score.typeIndex].label;
  const handName = !hasPlay
    ? 'No Play Yet'
    : state.scorePending
      ? 'Calculating...'
      : state.scoreError
        ? 'Calculation Failed'
        : resolvedHandLabel;

  elements.scorePrimary.textContent = hasPlay && state.scorePending ? '...' : formatBigNumber(score.total, true);
  elements.scoreHandName.textContent = handName;
  elements.scoreChipsValue.textContent = hasPlay && state.scorePending ? '...' : formatNumber(score.chips);
  elements.scoreMultValue.textContent = hasPlay && state.scorePending ? '...' : (score.typeIndex === null ? '0' : formatBigNumber(score.mult));

  elements.jokerCountValue.textContent = String(state.jokerOrder.length);
  elements.handCountValue.textContent = String(state.handCards.length);
  elements.playedCountValue.textContent = String(state.playedCards.length);
  elements.selectedCountValue.textContent = String(state.selectedHandCardIds.size);

  if (state.selectedHandCardIds.size > 0) {
    elements.playHint.textContent = `${state.selectedHandCardIds.size} card(s) selected. Click "Play Selected Cards" to move them into the play area.`;
  } else if (state.playedCards.length > 0) {
    elements.playHint.textContent = 'Click a card in the play area to return it to your hand.';
  } else {
    elements.playHint.textContent = 'Select 1 to 5 cards from the hand, then play them here.';
  }

  elements.playSelectionBtn.disabled = state.selectedHandCardIds.size === 0;
  elements.playSelectionBtn.textContent = state.selectedHandCardIds.size > 0
    ? `Play Selected Cards (${state.selectedHandCardIds.size})`
    : 'Play Selected Cards';
  elements.resetPlayBtn.disabled = state.playedCards.length === 0;
  elements.clearHandBtn.disabled = state.handCards.length === 0 && state.playedCards.length === 0;
  elements.clearJokersBtn.disabled = state.jokerOrder.length === 0;
}

function createTooltipMarkup(title, description, below = false) {
  return `
    <div class="calc2TooltipPanel${below ? ' calc2TooltipPanel--below' : ''}">
      <span class="calc2TooltipPanel__title">${title}</span>
      <div class="calc2TooltipPanel__desc">${description}</div>
    </div>
  `;
}

function renderJokerLane() {
  if (state.jokerOrder.length === 0) {
    elements.jokerLane.innerHTML = '<div class="calc2EmptyState">No Jokers added yet. Click "Add Jokers" to open the full Joker sheet from the main calculator.</div>';
    return;
  }

  elements.jokerLane.innerHTML = state.jokerOrder.map((id, index) => {
    const joker = playfieldJokers[id];
    const title = getJokerTitle(joker);
    const description = getJokerDescription(joker);
    const valueLabel = getJokerValueLabel(joker);
    const badge = joker.modifiers.disabled ? 'Disabled' : (valueLabel ? `${valueLabel}: ${joker.value}` : 'Base');

    return `
      <div class="calc2CardUnit" data-joker-id="${id}">
        <button type="button" class="calc2CardTap" data-action="select-joker" data-joker-id="${id}" aria-label="Select ${title}">
          <div class="calc2CardFrame is-selectable${state.activeJokerId === id ? ' is-active' : ''}">
            <div class="jokerCard${joker.modifiers.polychrome ? ' polychrome' : ''}" style="${getJokerSpriteStyle(joker.type[0], joker.type[1], joker.modifiers)}" data-joker-id="${id}" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
          </div>
        </button>
        ${createTooltipMarkup(title, description, true)}
        <div class="calc2CardUnit__controls">
          <button type="button" class="calc2TinyBtn" data-action="move-joker-left" data-joker-id="${id}" ${index === 0 ? 'disabled' : ''}>←</button>
          <button type="button" class="calc2TinyBtn" data-action="remove-joker" data-joker-id="${id}">×</button>
          <button type="button" class="calc2TinyBtn" data-action="move-joker-right" data-joker-id="${id}" ${index === state.jokerOrder.length - 1 ? 'disabled' : ''}>→</button>
        </div>
        <div class="calc2CardUnit__badge">${badge}</div>
      </div>
    `;
  }).join('');
}

function renderPlayedLane() {
  if (state.playedCards.length === 0) {
    elements.playedLane.innerHTML = '<div class="calc2EmptyState">Played cards appear here. Select cards from the hand area below, then press "Play Selected Cards".</div>';
    return;
  }

  elements.playedLane.innerHTML = state.playedCards.map((card) => `
    <div class="calc2CardUnit" data-card-id="${card.id}">
      <button type="button" class="calc2CardTap" data-action="return-played-card" data-card-id="${card.id}" aria-label="Return ${getCardTitle(card)} to hand">
        <div class="calc2CardFrame is-selectable">
          <div class="playfieldCard" style="${getCardSpriteStyle(card.type[0], card.type[1])}" data-card-id="${card.id}" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
        </div>
      </button>
      ${createTooltipMarkup(getCardTitle(card), 'Click to move this card back into the hand area.')}
      <div class="calc2CardUnit__meta">Click to return</div>
    </div>
  `).join('');
}

function renderHandLane() {
  if (state.handCards.length === 0) {
    elements.handLane.innerHTML = '<div class="calc2EmptyState">Your hand is empty. Click "All Cards" to open the full card sheet from the main calculator.</div>';
    return;
  }

  elements.handLane.innerHTML = state.handCards.map((card) => {
    const isSelected = state.selectedHandCardIds.has(card.id);
    return `
      <div class="calc2CardUnit" data-card-id="${card.id}">
        <button type="button" class="calc2CardTap" data-action="toggle-hand-card" data-card-id="${card.id}" aria-label="${isSelected ? 'Unselect' : 'Select'} ${getCardTitle(card)}">
          <div class="calc2CardFrame is-selectable${isSelected ? ' is-selected' : ''}">
            <div class="playfieldCard" style="${getCardSpriteStyle(card.type[0], card.type[1])}" data-card-id="${card.id}" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
          </div>
        </button>
        ${createTooltipMarkup(getCardTitle(card), isSelected ? 'Click again to unselect this card.' : 'Click to select this card for the next play.')}
        <div class="calc2CardUnit__meta">${isSelected ? 'Selected' : 'In hand'}</div>
      </div>
    `;
  }).join('');
}

function renderInspector() {
  const joker = state.activeJokerId ? playfieldJokers[state.activeJokerId] : null;
  if (!joker) {
    elements.jokerInspector.innerHTML = `
      <div class="calc2EmptyState">
        Click any Joker in the top lane to edit its current value or disabled state here.
      </div>
    `;
    return;
  }

  const title = getJokerTitle(joker);
  const description = getJokerDescription(joker);
  const valueLabel = getJokerValueLabel(joker);

  elements.jokerInspector.innerHTML = `
    <div class="calc2InspectorCard">
      <div class="calc2InspectorCard__hero">
        <div class="calc2CardFrame is-active">
          <div class="jokerCard${joker.modifiers.polychrome ? ' polychrome' : ''}" style="${getJokerSpriteStyle(joker.type[0], joker.type[1], joker.modifiers)}" data-scale="2"></div>
        </div>
        <div class="calc2InspectorCard__copy">
          <h3 class="calc2InspectorCard__name">${title}</h3>
          <div class="calc2InspectorCard__desc">${description}</div>
        </div>
      </div>

      <div class="calc2InspectorField">
        <label for="jokerValueInput">${valueLabel || 'This Joker does not use an extra numeric value.'}</label>
        <input id="jokerValueInput" class="calc2InspectorInput" type="number" step="1" value="${joker.value}" ${valueLabel ? '' : 'disabled'}>
      </div>

      <div class="calc2InspectorToggle">
        <span>Disable this Joker</span>
        <label>
          <input id="jokerDisabledInput" type="checkbox" ${joker.modifiers.disabled ? 'checked' : ''}>
        </label>
      </div>

      <div class="calc2Inspector__hint">
        For scaling Jokers like Runner, Campfire, Obelisk, Flash Card, and similar cases, enter the current in-run value here.
      </div>

      <div class="calc2InspectorActions">
        <button type="button" class="calc2GhostBtn" data-action="remove-active-joker">Remove</button>
        <button type="button" class="calc2SecondaryBtn" data-action="clear-active-selection">Clear Focus</button>
      </div>
    </div>
  `;

  const valueInput = document.getElementById('jokerValueInput');
  if (valueInput) {
    valueInput.addEventListener('input', (event) => {
      const nextValue = Number.parseInt(event.target.value, 10);
      joker.value = Number.isFinite(nextValue) ? nextValue : 0;
      renderAll();
    });
  }

  const disabledInput = document.getElementById('jokerDisabledInput');
  if (disabledInput) {
    disabledInput.addEventListener('change', (event) => {
      joker.modifiers.disabled = event.target.checked;
      renderAll();
    });
  }

  const removeBtn = elements.jokerInspector.querySelector('[data-action="remove-active-joker"]');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => removeJoker(state.activeJokerId));
  }

  const clearBtn = elements.jokerInspector.querySelector('[data-action="clear-active-selection"]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.activeJokerId = null;
      renderAll();
    });
  }
}

function getFilteredModalItems() {
  const query = state.modal.search.trim().toLowerCase();
  if (state.modal.type === 'joker') {
    return getAllJokers().filter((joker) => {
      const description = stripHtml(renderJokerDescription(joker.type0, joker.type1, { jokerValue: 0 })).toLowerCase();
      const haystack = `${joker.title} ${description}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  }

  return getAllCards().filter((card) => !query || card.searchText.includes(query) || card.title.toLowerCase().includes(query));
}

function buildJokerPickerMarkup(items) {
  const rows = [];
  for (let i = 0; i < items.length; i += 10) {
    rows.push(items.slice(i, i + 10));
  }

  return `
    <div class="calc2PickerSheet calc2PickerSheet--jokers">
      ${rows.map((row) => `
        <div class="calc2PickerSheetRow">
          ${row.map((item) => {
            const key = `${item.type0}-${item.type1}`;
            const isSelected = state.modal.selectedKeys.has(key);
            const description = renderJokerDescription(item.type0, item.type1, { jokerValue: 0 });
            return `
              <div class="calc2PickerCell">
                <button type="button" class="calc2PickerSpriteBtn calc2PickerSpriteBtn--joker${isSelected ? ' is-selected' : ''}" data-action="toggle-modal-item" data-item-key="${key}" aria-label="${isSelected ? 'Unselect' : 'Select'} ${item.title}">
                  <div class="jokerCard" style="${getJokerSpriteStyle(item.type0, item.type1)}" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
                  <span class="calc2PickerMark">${isSelected ? 'Selected' : 'Add'}</span>
                </button>
                ${createTooltipMarkup(item.title, description)}
                <div class="calc2PickerCaption">${item.title}</div>
                <div class="calc2PickerMeta">${RARITY_LABELS[item.rarity] || 'Common'} · $${item.price}</div>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function buildCardPickerMarkup(items) {
  const grouped = CARD_SUITS.map((suit, suitIndex) => ({
    ...suit,
    cards: items.filter((item) => item.suit === suitIndex),
  })).filter((group) => group.cards.length > 0);

  return `
    <div class="calc2PickerSheet calc2PickerSheet--cards">
      ${grouped.map((group) => `
        <div class="calc2PickerGroup">
          <div class="calc2PickerGroup__label">${group.label}</div>
          <div class="calc2PickerSheetRow calc2PickerSheetRow--cards">
            ${group.cards.map((item) => {
              const isSelected = state.modal.selectedKeys.has(item.key);
              return `
                <div class="calc2PickerCell calc2PickerCell--card">
                  <button type="button" class="calc2PickerSpriteBtn calc2PickerSpriteBtn--card${isSelected ? ' is-selected' : ''}" data-action="toggle-modal-item" data-item-key="${item.key}" aria-label="${isSelected ? 'Unselect' : 'Select'} ${item.title}">
                    <div class="playfieldCard" style="${getCardSpriteStyle(item.suit, item.rank)}" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
                    <span class="calc2PickerMark">${isSelected ? 'Selected' : 'Add'}</span>
                  </button>
                  ${createTooltipMarkup(item.title, `Add ${item.title} to the hand area.`)}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderModal() {
  const isOpen = Boolean(state.modal.type);
  elements.pickerOverlay.hidden = !isOpen;
  document.body.classList.toggle('calc2ModalOpen', isOpen);
  if (!isOpen) return;

  const isJokerModal = state.modal.type === 'joker';
  elements.pickerEyebrow.textContent = isJokerModal ? 'Main Calculator Joker Sheet' : 'Main Calculator Card Sheet';
  elements.pickerTitle.textContent = isJokerModal ? 'Choose Jokers to Add to the Top Area' : 'Choose Cards to Add to the Hand Area';
  elements.pickerSearchInput.placeholder = isJokerModal ? 'Search Joker name or effect' : 'Search rank or suit';
  elements.pickerConfirmBtn.textContent = isJokerModal ? 'Add Selected Jokers' : 'Add Selected Cards';
  elements.pickerSearchInput.value = state.modal.search;

  const items = getFilteredModalItems();
  elements.pickerSummary.textContent = state.modal.selectedKeys.size > 0
    ? `${state.modal.selectedKeys.size} item(s) selected`
    : 'Nothing selected';

  if (items.length === 0) {
    elements.pickerGrid.innerHTML = '<div class="calc2EmptyState">No matching results. Try another search term.</div>';
    return;
  }

  elements.pickerGrid.innerHTML = isJokerModal
    ? buildJokerPickerMarkup(items)
    : buildCardPickerMarkup(items);
}

function renderAll() {
  requestScoreCalculation();
  renderScore();
  renderJokerLane();
  renderPlayedLane();
  renderHandLane();
  renderInspector();
  renderModal();
}

function initializeScoreWorker() {
  if (typeof Worker === 'undefined') {
    state.scoreError = 'Web workers are unavailable in this browser.';
    return;
  }

  scoreWorker = new Worker('calculator-2-worker.js');
  scoreWorker.addEventListener('message', (event) => {
    const { requestId, score, error } = event.data || {};
    if (requestId !== activeScoreRequestId) {
      return;
    }

    state.scorePending = false;

    if (error) {
      state.score = buildZeroScore();
      state.scoreError = error;
      console.error('calculator 2 score worker failed:', error);
    } else {
      state.score = score || buildZeroScore();
      state.scoreError = null;
    }

    renderScore();
  });

  scoreWorker.addEventListener('error', (event) => {
    state.scorePending = false;
    state.score = buildZeroScore();
    state.scoreError = event.message || 'Worker error';
    console.error('calculator 2 score worker crashed:', event.message || event);
    renderScore();
  });
}

function openModal(type) {
  state.modal.type = type;
  state.modal.search = '';
  state.modal.selectedKeys = new Set();
  renderModal();
}

function closeModal() {
  state.modal.type = null;
  state.modal.search = '';
  state.modal.selectedKeys = new Set();
  renderModal();
}

function confirmModalSelection() {
  if (state.modal.selectedKeys.size === 0) {
    closeModal();
    return;
  }

  if (state.modal.type === 'joker') {
    state.modal.selectedKeys.forEach((key) => {
      const [type0, type1] = key.split('-').map(Number);
      const joker = createBaseJoker(type0, type1);
      playfieldJokers[joker.id] = joker;
      state.jokerOrder.push(joker.id);
      if (!state.activeJokerId) state.activeJokerId = joker.id;
    });
  } else {
    state.modal.selectedKeys.forEach((key) => {
      const [suit, rank] = key.split('-').map(Number);
      state.handCards.push(createBaseCard(suit, rank));
    });
  }

  closeModal();
  renderAll();
}

function moveJoker(id, direction) {
  const index = state.jokerOrder.indexOf(id);
  if (index < 0) return;
  const nextIndex = direction === 'left' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= state.jokerOrder.length) return;
  const nextOrder = state.jokerOrder.slice();
  nextOrder.splice(index, 1);
  nextOrder.splice(nextIndex, 0, id);
  setPlayfieldJokers(nextOrder);
  renderAll();
}

function removeJoker(id) {
  if (!playfieldJokers[id]) return;
  delete playfieldJokers[id];
  state.jokerOrder = state.jokerOrder.filter((jokerId) => jokerId !== id);
  if (state.activeJokerId === id) {
    state.activeJokerId = state.jokerOrder[0] || null;
  }
  renderAll();
}

function toggleHandCardSelection(id) {
  if (state.selectedHandCardIds.has(id)) {
    state.selectedHandCardIds.delete(id);
  } else {
    state.selectedHandCardIds.add(id);
  }
  renderAll();
}

function playSelectedCards() {
  if (state.selectedHandCardIds.size === 0) return;
  if (state.selectedHandCardIds.size + state.playedCards.length > 5) {
    window.alert('The play area can only hold up to 5 cards.');
    return;
  }

  const remainingHand = [];
  const movedCards = [];

  state.handCards.forEach((card) => {
    if (state.selectedHandCardIds.has(card.id)) {
      movedCards.push(card);
    } else {
      remainingHand.push(card);
    }
  });

  state.handCards = remainingHand;
  state.playedCards = [...state.playedCards, ...movedCards];
  state.selectedHandCardIds.clear();
  renderAll();
}

function returnPlayedCard(id) {
  const nextPlayed = [];
  let returnedCard = null;
  state.playedCards.forEach((card) => {
    if (card.id === id) {
      returnedCard = card;
    } else {
      nextPlayed.push(card);
    }
  });
  if (!returnedCard) return;
  state.playedCards = nextPlayed;
  state.handCards.push(returnedCard);
  renderAll();
}

function resetPlayedCards() {
  if (state.playedCards.length === 0) return;
  state.handCards.push(...state.playedCards);
  state.playedCards = [];
  renderAll();
}

function clearHandAndPlayedCards() {
  state.handCards = [];
  state.playedCards = [];
  state.selectedHandCardIds.clear();
  renderAll();
}

function clearAllJokers() {
  playfieldJokers = {};
  state.jokerOrder = [];
  state.activeJokerId = null;
  renderAll();
}

function handleLaneClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  const jokerId = actionTarget.dataset.jokerId;
  const cardId = actionTarget.dataset.cardId;

  switch (action) {
    case 'select-joker':
      state.activeJokerId = jokerId;
      renderAll();
      break;
    case 'move-joker-left':
      moveJoker(jokerId, 'left');
      break;
    case 'move-joker-right':
      moveJoker(jokerId, 'right');
      break;
    case 'remove-joker':
      removeJoker(jokerId);
      break;
    case 'toggle-hand-card':
      toggleHandCardSelection(cardId);
      break;
    case 'return-played-card':
      returnPlayedCard(cardId);
      break;
    case 'toggle-modal-item':
      if (state.modal.selectedKeys.has(actionTarget.dataset.itemKey)) {
        state.modal.selectedKeys.delete(actionTarget.dataset.itemKey);
      } else {
        state.modal.selectedKeys.add(actionTarget.dataset.itemKey);
      }
      renderModal();
      break;
    default:
      break;
  }
}

function bindEvents() {
  elements.openJokerPickerBtn.addEventListener('click', () => openModal('joker'));
  elements.openCardPickerBtn.addEventListener('click', () => openModal('card'));
  elements.playSelectionBtn.addEventListener('click', playSelectedCards);
  elements.resetPlayBtn.addEventListener('click', resetPlayedCards);
  elements.clearHandBtn.addEventListener('click', clearHandAndPlayedCards);
  elements.clearJokersBtn.addEventListener('click', clearAllJokers);

  elements.jokerLane.addEventListener('click', handleLaneClick);
  elements.playedLane.addEventListener('click', handleLaneClick);
  elements.handLane.addEventListener('click', handleLaneClick);
  elements.pickerGrid.addEventListener('click', handleLaneClick);

  elements.pickerCloseBtn.addEventListener('click', closeModal);
  elements.pickerCancelBtn.addEventListener('click', closeModal);
  elements.pickerConfirmBtn.addEventListener('click', confirmModalSelection);
  elements.pickerOverlay.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      closeModal();
    }
  });

  elements.pickerSearchInput.addEventListener('input', (event) => {
    state.modal.search = event.target.value;
    renderModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.modal.type) {
      closeModal();
    }
  });
}

async function init() {
  initializeScoreWorker();
  bindEvents();

  if (window.applyJokerLocalization) {
    try {
      await window.applyJokerLocalization();
    } catch (error) {
      console.error('joker localization failed', error);
    }
  }

  renderAll();
}

init();
