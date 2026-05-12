(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Calculator3 = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HAND_TYPES = [
    { key: 'flushFive', label: 'Flush Five', baseChips: 160, baseMult: 16, levelChips: 50, levelMult: 3 },
    { key: 'flushHouse', label: 'Flush House', baseChips: 140, baseMult: 14, levelChips: 40, levelMult: 4 },
    { key: 'fiveOfAKind', label: 'Five of a Kind', baseChips: 120, baseMult: 12, levelChips: 35, levelMult: 3 },
    { key: 'straightFlush', label: 'Straight Flush', baseChips: 100, baseMult: 8, levelChips: 40, levelMult: 4 },
    { key: 'fourOfAKind', label: 'Four of a Kind', baseChips: 60, baseMult: 7, levelChips: 30, levelMult: 3 },
    { key: 'fullHouse', label: 'Full House', baseChips: 40, baseMult: 4, levelChips: 25, levelMult: 2 },
    { key: 'flush', label: 'Flush', baseChips: 35, baseMult: 4, levelChips: 15, levelMult: 2 },
    { key: 'straight', label: 'Straight', baseChips: 30, baseMult: 4, levelChips: 30, levelMult: 3 },
    { key: 'threeOfAKind', label: 'Three of a Kind', baseChips: 30, baseMult: 3, levelChips: 20, levelMult: 2 },
    { key: 'twoPair', label: 'Two Pair', baseChips: 20, baseMult: 2, levelChips: 20, levelMult: 1 },
    { key: 'pair', label: 'Pair', baseChips: 10, baseMult: 2, levelChips: 15, levelMult: 1 },
    { key: 'highCard', label: 'High Card', baseChips: 5, baseMult: 1, levelChips: 10, levelMult: 1 }
  ];

  const HAND_BY_KEY = Object.fromEntries(HAND_TYPES.map((hand) => [hand.key, hand]));
  const HAND_RANK = Object.fromEntries(HAND_TYPES.map((hand, index) => [hand.key, index]));

  const RANKS = [
    { key: '2', label: '2', value: 2, chips: 2 },
    { key: '3', label: '3', value: 3, chips: 3 },
    { key: '4', label: '4', value: 4, chips: 4 },
    { key: '5', label: '5', value: 5, chips: 5 },
    { key: '6', label: '6', value: 6, chips: 6 },
    { key: '7', label: '7', value: 7, chips: 7 },
    { key: '8', label: '8', value: 8, chips: 8 },
    { key: '9', label: '9', value: 9, chips: 9 },
    { key: '10', label: '10', value: 10, chips: 10 },
    { key: 'J', label: 'Jack', value: 11, chips: 10 },
    { key: 'Q', label: 'Queen', value: 12, chips: 10 },
    { key: 'K', label: 'King', value: 13, chips: 10 },
    { key: 'A', label: 'Ace', value: 14, chips: 11 }
  ];

  const SUITS = [
    { key: 'hearts', label: 'Hearts' },
    { key: 'clubs', label: 'Clubs' },
    { key: 'diamonds', label: 'Diamonds' },
    { key: 'spades', label: 'Spades' }
  ];

  const RANK_BY_KEY = Object.fromEntries(RANKS.map((rank) => [rank.key, rank]));
  const SUIT_BY_KEY = Object.fromEntries(SUITS.map((suit) => [suit.key, suit]));
  const FACE_RANKS = new Set(['J', 'Q', 'K']);
  const FIBONACCI_RANKS = new Set(['A', '2', '3', '5', '8']);
  const EVEN_RANKS = new Set(['2', '4', '6', '8', '10']);
  const ODD_RANKS = new Set(['A', '3', '5', '7', '9']);
  const WALKIE_TALKIE_RANKS = new Set(['10', '4']);
  const TRIBOULET_RANKS = new Set(['K', 'Q']);
  const BLACK_SUITS = new Set(['spades', 'clubs']);
  const COPY_JOKER_IDS = new Set(['blueprint', 'brainstorm']);
  const ENHANCEMENTS = [
    { key: 'none', label: 'Base' },
    { key: 'bonus', label: 'Bonus Card', chipsAdd: 30 },
    { key: 'mult', label: 'Mult Card', multAdd: 4 },
    { key: 'wild', label: 'Wild Card', wild: true },
    { key: 'steel', label: 'Steel Card', heldXMult: 1.5 },
    { key: 'gold', label: 'Gold Card', economyOnly: true },
    { key: 'lucky', label: 'Lucky Card', randomOnly: true },
    { key: 'glass', label: 'Glass Card', xMult: 2 },
    { key: 'stone', label: 'Stone Card', stoneChips: 50, suppressRankChips: true }
  ];
  const EDITIONS = [
    { key: 'none', label: 'No Edition' },
    { key: 'foil', label: 'Foil', chipsAdd: 50 },
    { key: 'holographic', label: 'Holographic', multAdd: 10 },
    { key: 'polychrome', label: 'Polychrome', xMult: 1.5 }
  ];
  const SEALS = [
    { key: 'none', label: 'No Seal' },
    { key: 'red', label: 'Red Seal', retriggers: 1 },
    { key: 'blue', label: 'Blue Seal', heldPlanetOnly: true },
    { key: 'gold', label: 'Gold Seal', economyOnly: true },
    { key: 'purple', label: 'Purple Seal', discardOnly: true }
  ];
  const ENHANCEMENT_BY_KEY = Object.fromEntries(ENHANCEMENTS.map((enhancement) => [enhancement.key, enhancement]));
  const EDITION_BY_KEY = Object.fromEntries(EDITIONS.map((edition) => [edition.key, edition]));
  const SEAL_BY_KEY = Object.fromEntries(SEALS.map((seal) => [seal.key, seal]));

  function titleCaseId(label) {
    return String(label || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+([a-z0-9])/g, (_, char) => char.toUpperCase());
  }

  function countCards(cards, predicate) {
    return cards.reduce((count, card) => count + (predicate(card) ? 1 : 0), 0);
  }

  function makeAddMultJoker(id, name, mult, appliesTo) {
    return {
      id,
      name,
      mode: 'addMult',
      explain: '+Mult',
      apply(state) {
        if (appliesTo && !appliesTo(state)) return null;
        return {
          multAdd: mult,
          text: `${name}: +${mult} Mult`
        };
      }
    };
  }

  function makeAddChipsJoker(id, name, chips, appliesTo) {
    return {
      id,
      name,
      mode: 'addChips',
      explain: '+Chips',
      apply(state) {
        if (appliesTo && !appliesTo(state)) return null;
        return {
          chipsAdd: chips,
          text: `${name}: +${chips} Chips`
        };
      }
    };
  }

  function makeXMultJoker(id, name, xMult, appliesTo) {
    return {
      id,
      name,
      mode: 'xMult',
      explain: 'XMult',
      apply(state) {
        if (appliesTo && !appliesTo(state)) return null;
        return {
          xMult,
          text: `${name}: X${xMult} Mult`
        };
      }
    };
  }

  const JOKER_CATALOG = {
    joker: makeAddMultJoker('joker', 'Joker', 4),
    jolly: makeAddMultJoker('jolly', 'Jolly Joker', 8, (state) => state.handType === 'pair'),
    zany: makeAddMultJoker('zany', 'Zany Joker', 12, (state) => state.handType === 'threeOfAKind'),
    mad: makeAddMultJoker('mad', 'Mad Joker', 10, (state) => state.handType === 'twoPair'),
    crazy: makeAddMultJoker('crazy', 'Crazy Joker', 12, (state) => state.handType === 'straight'),
    droll: makeAddMultJoker('droll', 'Droll Joker', 10, (state) => state.handType === 'flush'),
    sly: makeAddChipsJoker('sly', 'Sly Joker', 50, (state) => state.handType === 'pair'),
    wily: makeAddChipsJoker('wily', 'Wily Joker', 100, (state) => state.handType === 'threeOfAKind'),
    clever: makeAddChipsJoker('clever', 'Clever Joker', 80, (state) => state.handType === 'twoPair'),
    devious: makeAddChipsJoker('devious', 'Devious Joker', 100, (state) => state.handType === 'straight'),
    crafty: makeAddChipsJoker('crafty', 'Crafty Joker', 80, (state) => state.handType === 'flush'),
    half: makeAddMultJoker('half', 'Half Joker', 20, (state) => state.playedCards.length <= 3),
    banner: {
      id: 'banner',
      name: 'Banner',
      mode: 'addChips',
      explain: '+30 Chips per remaining discard',
      apply(state) {
        if (!Number.isFinite(state.remainingDiscards) || state.remainingDiscards <= 0) return null;
        return {
          chipsAdd: state.remainingDiscards * 30,
          text: `Banner: ${state.remainingDiscards} remaining discard${state.remainingDiscards === 1 ? '' : 's'} add +${state.remainingDiscards * 30} Chips`
        };
      }
    },
    mysticSummit: makeAddMultJoker('mysticSummit', 'Mystic Summit', 15, (state) => state.remainingDiscards === 0),
    cavendish: makeXMultJoker('cavendish', 'Cavendish', 3),
    duo: makeXMultJoker('duo', 'The Duo', 2, (state) => state.handType === 'pair'),
    trio: makeXMultJoker('trio', 'The Trio', 3, (state) => state.handType === 'threeOfAKind'),
    order: makeXMultJoker('order', 'The Order', 3, (state) => state.handType === 'straight'),
    family: makeXMultJoker('family', 'The Family', 4, (state) => state.handType === 'fourOfAKind'),
    tribe: makeXMultJoker('tribe', 'The Tribe', 2, (state) => state.handType === 'flush'),
    greedy: perCardJoker('greedy', 'Greedy Joker', 'diamonds', 'multAdd', 3),
    lusty: perCardJoker('lusty', 'Lusty Joker', 'hearts', 'multAdd', 3),
    wrathful: perCardJoker('wrathful', 'Wrathful Joker', 'spades', 'multAdd', 3),
    gluttonous: perCardJoker('gluttonous', 'Gluttonous Joker', 'clubs', 'multAdd', 3),
    arrowhead: perCardJoker('arrowhead', 'Arrowhead', 'spades', 'chipsAdd', 50),
    onyxAgate: perCardJoker('onyxAgate', 'Onyx Agate', 'clubs', 'multAdd', 7),
    fibonacci: perRankJoker('fibonacci', 'Fibonacci', FIBONACCI_RANKS, 'multAdd', 8),
    evenSteven: perRankJoker('evenSteven', 'Even Steven', EVEN_RANKS, 'multAdd', 4),
    oddTodd: perRankJoker('oddTodd', 'Odd Todd', ODD_RANKS, 'chipsAdd', 31),
    smileyFace: perRankJoker('smileyFace', 'Smiley Face', FACE_RANKS, 'multAdd', 5),
    walkieTalkie: perRankJoker('walkieTalkie', 'Walkie Talkie', WALKIE_TALKIE_RANKS, 'chipsAddMultAdd', { chipsAdd: 10, multAdd: 4 }),
    scholar: {
      id: 'scholar',
      name: 'Scholar',
      mode: 'cardChipsMult',
      explain: 'Ace Chips/Mult',
      apply(state) {
        const count = countCards(state.scoringCards, (card) => card.rank === 'A' && !card.debuffed);
        if (!count) return null;
        return {
          chipsAdd: count * 20,
          multAdd: count * 4,
          text: `Scholar: ${count} scoring Ace${count === 1 ? '' : 's'} add +${count * 20} Chips and +${count * 4} Mult`
        };
      }
    },
    raisedFist: {
      id: 'raisedFist',
      name: 'Raised Fist',
      mode: 'heldCardMult',
      explain: 'Double lowest held card rank',
      apply(state) {
        const heldCards = state.heldCards.filter((card) => !card.debuffed && !hasEnhancement(card, 'stone'));
        if (!heldCards.length) return null;
        const lowest = heldCards.reduce((best, card) => {
          if (RANK_BY_KEY[card.rank].chips < RANK_BY_KEY[best.rank].chips) return card;
          return best;
        }, heldCards[0]);
        const multAdd = RANK_BY_KEY[lowest.rank].chips * 2;
        return {
          multAdd,
          text: `Raised Fist: lowest held card (${formatCardName(lowest)}) adds +${multAdd} Mult`
        };
      }
    },
    scaryFace: perRankJoker('scaryFace', 'Scary Face', FACE_RANKS, 'chipsAdd', 30),
    stuntman: makeAddChipsJoker('stuntman', 'Stuntman', 250),
    seeingDouble: {
      id: 'seeingDouble',
      name: 'Seeing Double',
      mode: 'xMult',
      explain: 'X2 Mult with scoring Club plus another suit',
      apply(state) {
        const suits = suitsRepresented(state.scoringCards, state.rules);
        if (!suits.has('clubs') || suits.size < 2) return null;
        return {
          xMult: 2,
          text: 'Seeing Double: scoring Club plus another suit applies X2 Mult'
        };
      }
    },
    flowerPot: {
      id: 'flowerPot',
      name: 'Flower Pot',
      mode: 'xMult',
      explain: 'X3 Mult with all four suits',
      apply(state) {
        const suits = suitsRepresented(state.scoringCards, state.rules);
        if (!['diamonds', 'clubs', 'hearts', 'spades'].every((suit) => suits.has(suit))) return null;
        return {
          xMult: 3,
          text: 'Flower Pot: scoring hand contains all four suits, applies X3 Mult'
        };
      }
    },
    photograph: {
      id: 'photograph',
      name: 'Photograph',
      mode: 'xMult',
      explain: 'X2 first played scoring face card',
      apply(state) {
        const firstFaceCard = state.playedCards.find((card) => FACE_RANKS.has(card.rank) && !card.debuffed);
        if (!firstFaceCard || !state.scoringCards.includes(firstFaceCard)) return null;
        const triggerCount = countScoringTriggers(state, (card) => card === firstFaceCard);
        if (!triggerCount) return null;
        return {
          xMult: 2 ** triggerCount,
          text: `Photograph: first played face card (${formatCardName(firstFaceCard)}) triggers ${triggerCount} time${triggerCount === 1 ? '' : 's'} for X${2 ** triggerCount} Mult`
        };
      }
    },
    hangingChad: {
      id: 'hangingChad',
      name: 'Hanging Chad',
      mode: 'cardRetrigger',
      explain: 'Retrigger first scoring card 2 additional times',
      retriggerRule(state, sourceName) {
        const firstScoringCard = state.playedCards.find((card) => state.scoringCards.includes(card) && !card.debuffed);
        if (!firstScoringCard) return null;
        return {
          sourceName,
          sourceId: 'hangingChad',
          times: 2,
          appliesTo(card) {
            return card === firstScoringCard;
          },
          text: `${sourceName}: ${formatCardName(firstScoringCard)} retriggers 2 additional times`
        };
      },
      apply() {
        return null;
      }
    },
    sockAndBuskin: {
      id: 'sockAndBuskin',
      name: 'Sock and Buskin',
      mode: 'cardRetrigger',
      explain: 'Retrigger all scoring face cards',
      retriggerRule(state, sourceName) {
        const count = countCards(state.scoringCards, (card) => FACE_RANKS.has(card.rank) && !card.debuffed);
        if (!count) return null;
        return {
          sourceName,
          sourceId: 'sockAndBuskin',
          times: 1,
          appliesTo(card) {
            return FACE_RANKS.has(card.rank) && !card.debuffed;
          },
          text: `${sourceName}: ${count} scoring face card${count === 1 ? '' : 's'} retrigger`
        };
      },
      apply() {
        return null;
      }
    },
    dusk: {
      id: 'dusk',
      name: 'Dusk',
      mode: 'cardRetrigger',
      explain: 'Retrigger all scoring cards on final hand',
      retriggerRule(state, sourceName) {
        if (state.finalHand !== true) return null;
        const count = countCards(state.scoringCards, (card) => !card.debuffed);
        if (!count) return null;
        return {
          sourceName,
          sourceId: 'dusk',
          times: 1,
          appliesTo(card) {
            return state.scoringCards.includes(card) && !card.debuffed;
          },
          text: `${sourceName}: final hand retriggers ${count} scoring card${count === 1 ? '' : 's'}`
        };
      },
      apply() {
        return null;
      }
    },
    shootTheMoon: {
      id: 'shootTheMoon',
      name: 'Shoot the Moon',
      mode: 'heldCardMult',
      explain: '+13 Mult per held Queen',
      apply(state) {
        const count = countCards(state.heldCards, (card) => card.rank === 'Q' && !card.debuffed);
        if (!count) return null;
        return {
          multAdd: count * 13,
          text: `Shoot the Moon: ${count} held Queen${count === 1 ? '' : 's'} add +${count * 13} Mult`
        };
      }
    },
    blackboard: {
      id: 'blackboard',
      name: 'Blackboard',
      mode: 'xMult',
      explain: 'X3 Mult when all held cards are black suits',
      apply(state) {
        const activeHeldCards = state.heldCards.filter((card) => !card.debuffed);
        if (!activeHeldCards.length || activeHeldCards.some((card) => !cardMatchesAnySuit(card, BLACK_SUITS, state.rules))) return null;
        return {
          xMult: 3,
          text: 'Blackboard: all held cards are Spades or Clubs, applies X3 Mult'
        };
      }
    },
    baron: {
      id: 'baron',
      name: 'Baron',
      mode: 'heldCardXMult',
      explain: 'X1.5 Mult per held King',
      apply(state) {
        const count = countCards(state.heldCards, (card) => card.rank === 'K' && !card.debuffed);
        if (!count) return null;
        return {
          xMult: 1.5 ** count,
          text: `Baron: ${count} held King${count === 1 ? '' : 's'} apply X${roundForDisplay(1.5 ** count)} Mult`
        };
      }
    },
    baseballCard: {
      id: 'baseballCard',
      name: 'Baseball Card',
      mode: 'jokerRarityXMult',
      explain: 'X1.5 Mult per Uncommon Joker',
      apply(state) {
        const count = state.activeJokers.filter((joker) => joker.id !== 'baseballCard' && joker.rarity === 'uncommon').length;
        if (!count) return null;
        return {
          xMult: 1.5 ** count,
          text: `Baseball Card: ${count} Uncommon Joker${count === 1 ? '' : 's'} apply X${roundForDisplay(1.5 ** count)} Mult`
        };
      }
    },
    loyaltyCard: {
      id: 'loyaltyCard',
      name: 'Loyalty Card',
      mode: 'xMult',
      explain: 'X4 Mult when loyalty counter is ready',
      apply(state) {
        if (!hasJokerValue(state, 'loyaltyCard')) return null;
        const remaining = getJokerValue(state, 'loyaltyCard');
        if (remaining !== 0) return null;
        return {
          xMult: 4,
          text: 'Loyalty Card: counter is ready, applies X4 Mult'
        };
      }
    },
    supernova: {
      id: 'supernova',
      name: 'Supernova',
      mode: 'runtimeMult',
      explain: '+Mult equal to this poker hand play count',
      apply(state) {
        if (!state.currentHandTimesPlayed) return null;
        return {
          multAdd: state.currentHandTimesPlayed,
          text: `Supernova: this poker hand has been played ${state.currentHandTimesPlayed} time${state.currentHandTimesPlayed === 1 ? '' : 's'}, adds +${state.currentHandTimesPlayed} Mult`
        };
      }
    },
    fortuneTeller: makeRuntimeMultJoker('fortuneTeller', 'Fortune Teller', 'Tarot card used', 'Tarot cards used', 1),
    rideTheBus: makeRuntimeMultJoker('rideTheBus', 'Ride the Bus', 'consecutive no-face hand', 'consecutive no-face hands', 1),
    runner: makeRuntimeChipsJoker('runner', 'Runner', 'Straight played', 'Straights played', 15),
    blueJoker: {
      id: 'blueJoker',
      name: 'Blue Joker',
      mode: 'deckChips',
      explain: '+2 Chips per remaining deck card',
      apply(state) {
        if (!Number.isFinite(state.remainingDeckCards) || state.remainingDeckCards <= 0) return null;
        const chipsAdd = state.remainingDeckCards * 2;
        return {
          chipsAdd,
          text: `Blue Joker: ${state.remainingDeckCards} remaining deck card${state.remainingDeckCards === 1 ? '' : 's'} add +${chipsAdd} Chips`
        };
      }
    },
    greenJoker: {
      id: 'greenJoker',
      name: 'Green Joker',
      mode: 'runtimeMult',
      explain: 'Current +Mult from hands and discards',
      apply(state) {
        const multAdd = getJokerValue(state, 'greenJoker');
        if (!multAdd) return null;
        return {
          multAdd,
          text: `Green Joker: current runtime value adds ${formatSigned('multAdd', multAdd)}`
        };
      }
    },
    redCard: makeRuntimeMultJoker('redCard', 'Red Card', 'skipped Booster Pack', 'skipped Booster Packs', 3),
    squareJoker: makeRuntimeChipsJoker('squareJoker', 'Square Joker', 'four-card hand played', 'four-card hands played', 4),
    erosion: makeRuntimeMultJoker('erosion', 'Erosion', 'card below 52 in full deck', 'cards below 52 in full deck', 4),
    triboulet: {
      id: 'triboulet',
      name: 'Triboulet',
      mode: 'xMult',
      explain: 'X2 per scoring King or Queen',
      apply(state) {
        const count = countScoringTriggers(state, (card) => TRIBOULET_RANKS.has(card.rank) && !card.debuffed);
        if (!count) return null;
        return {
          xMult: 2 ** count,
          text: `Triboulet: ${count} scoring King/Queen card${count === 1 ? '' : 's'} apply X${2 ** count} Mult`
        };
      }
    },
    abstract: {
      id: 'abstract',
      name: 'Abstract Joker',
      mode: 'jokerCountMult',
      explain: '+3 Mult per Joker',
      apply(state) {
        const count = state.activeJokerCount;
        if (!count) return null;
        return {
          multAdd: count * 3,
          text: `Abstract Joker: ${count} Jokers add +${count * 3} Mult`
        };
      }
    },
    bull: {
      id: 'bull',
      name: 'Bull',
      mode: 'moneyChips',
      explain: '+2 Chips per dollar',
      apply(state) {
        if (!Number.isFinite(state.dollars) || state.dollars <= 0) return null;
        const chipsAdd = state.dollars * 2;
        return {
          chipsAdd,
          text: `Bull: $${state.dollars} add +${chipsAdd} Chips`
        };
      }
    },
    flashCard: makeRuntimeMultJoker('flashCard', 'Flash Card', 'shop reroll', 'shop rerolls', 2),
    bootstraps: {
      id: 'bootstraps',
      name: 'Bootstraps',
      mode: 'moneyMult',
      explain: '+2 Mult per $5',
      apply(state) {
        if (!Number.isFinite(state.dollars) || state.dollars < 5) return null;
        const stacks = Math.floor(state.dollars / 5);
        const multAdd = stacks * 2;
        return {
          multAdd,
          text: `Bootstraps: $${state.dollars} creates ${stacks} $5 stack${stacks === 1 ? '' : 's'}, adds +${multAdd} Mult`
        };
      }
    },
    fourFingers: {
      id: 'fourFingers',
      name: 'Four Fingers',
      mode: 'ruleModifier',
      explain: 'Flushes and Straights may use 4 cards'
    },
    shortcut: {
      id: 'shortcut',
      name: 'Shortcut',
      mode: 'ruleModifier',
      explain: 'Straights may skip one rank between cards'
    },
    smearedJoker: {
      id: 'smearedJoker',
      name: 'Smeared Joker',
      mode: 'ruleModifier',
      explain: 'Hearts/Diamonds and Spades/Clubs count together'
    },
    blueprint: {
      id: 'blueprint',
      name: 'Blueprint',
      mode: 'copy',
      explain: 'Copy Joker to the right'
    },
    brainstorm: {
      id: 'brainstorm',
      name: 'Brainstorm',
      mode: 'copy',
      explain: 'Copy leftmost Joker'
    }
  };

  function perCardJoker(id, name, suit, effectKey, amount) {
    return {
      id,
      name,
      mode: effectKey,
      explain: `${amount} per ${SUIT_BY_KEY[suit].label} scoring card`,
      apply(state) {
        const count = countScoringTriggers(state, (card) => !card.debuffed && cardMatchesSuit(card, suit, state.rules));
        if (!count) return null;
        return {
          [effectKey]: count * amount,
          text: `${name}: ${count} scoring ${SUIT_BY_KEY[suit].label} card${count === 1 ? '' : 's'} add ${formatSigned(effectKey, count * amount)}`
        };
      }
    };
  }

  function perRankJoker(id, name, ranks, effectKey, amount) {
    return {
      id,
      name,
      mode: effectKey,
      explain: `${formatAmountForExplain(effectKey, amount)} per matching scoring rank`,
      apply(state) {
        const count = countScoringTriggers(state, (card) => !card.debuffed && ranks.has(card.rank));
        if (!count) return null;
        if (effectKey === 'chipsAddMultAdd') {
          return {
            chipsAdd: count * amount.chipsAdd,
            multAdd: count * amount.multAdd,
            text: `${name}: ${count} matching scoring card${count === 1 ? '' : 's'} add +${count * amount.chipsAdd} Chips and +${count * amount.multAdd} Mult`
          };
        }
        return {
          [effectKey]: count * amount,
          text: `${name}: ${count} matching scoring card${count === 1 ? '' : 's'} add ${formatSigned(effectKey, count * amount)}`
        };
      }
    };
  }

  function makeRuntimeMultJoker(id, name, unitSingular, unitPlural, amount) {
    return {
      id,
      name,
      mode: 'runtimeMult',
      explain: `+${amount} Mult per ${unitSingular}`,
      apply(state) {
        const count = getJokerValue(state, id);
        if (!count) return null;
        const multAdd = count * amount;
        return {
          multAdd,
          text: `${name}: ${count} ${count === 1 ? unitSingular : unitPlural} add +${multAdd} Mult`
        };
      }
    };
  }

  function makeRuntimeChipsJoker(id, name, unitSingular, unitPlural, amount) {
    return {
      id,
      name,
      mode: 'runtimeChips',
      explain: `+${amount} Chips per ${unitSingular}`,
      apply(state) {
        const count = getJokerValue(state, id);
        if (!count) return null;
        const chipsAdd = count * amount;
        return {
          chipsAdd,
          text: `${name}: ${count} ${count === 1 ? unitSingular : unitPlural} add +${chipsAdd} Chips`
        };
      }
    };
  }

  function getJokerValue(state, id) {
    if (!state || !state.jokerValues) return 0;
    const value = state.jokerValues[id];
    return Number.isFinite(value) ? value : 0;
  }

  function hasJokerValue(state, id) {
    return Boolean(state && state.jokerValues && Number.isFinite(state.jokerValues[id]));
  }

  function countScoringTriggers(state, predicate) {
    return (state.scoringTriggers || state.scoringCards || []).reduce((count, entry) => {
      const card = entry.card || entry;
      return count + (predicate(card) ? 1 : 0);
    }, 0);
  }

  function formatAmountForExplain(effectKey, amount) {
    if (effectKey === 'chipsAddMultAdd') return `${amount.chipsAdd} Chips and ${amount.multAdd} Mult`;
    return String(amount);
  }

  function formatSigned(effectKey, value) {
    const prefix = value >= 0 ? '+' : '';
    if (effectKey === 'chipsAdd') return `${prefix}${value} Chips`;
    if (effectKey === 'multAdd') return `${prefix}${value} Mult`;
    return `${prefix}${value}`;
  }

  function normalizeCard(card) {
    const rank = String(card && card.rank ? card.rank : '').toUpperCase();
    const suit = String(card && card.suit ? card.suit : '').toLowerCase();
    if (!RANK_BY_KEY[rank]) {
      throw new Error(`Unknown rank: ${rank || '(empty)'}`);
    }
    if (!SUIT_BY_KEY[suit]) {
      throw new Error(`Unknown suit: ${suit || '(empty)'}`);
    }
    return {
      rank,
      suit,
      enhancement: ENHANCEMENT_BY_KEY[String(card.enhancement || 'none').toLowerCase()] ? String(card.enhancement || 'none').toLowerCase() : 'none',
      edition: EDITION_BY_KEY[String(card.edition || 'none').toLowerCase()] ? String(card.edition || 'none').toLowerCase() : 'none',
      seal: SEAL_BY_KEY[String(card.seal || 'none').toLowerCase()] ? String(card.seal || 'none').toLowerCase() : 'none',
      debuffed: card.debuffed === true || card.debuffed === 'true',
      scoring: card.scoring !== false,
      chips: RANK_BY_KEY[rank].chips
    };
  }

  function normalizeJoker(joker) {
    if (typeof joker === 'string') {
      return { id: joker };
    }
    if (!joker || typeof joker !== 'object') {
      return { id: '' };
    }
    return {
      id: joker.id || titleCaseId(joker.name),
      disabled: joker.disabled === true,
      rarity: normalizeRarity(joker.rarity)
    };
  }

  function normalizeRarity(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');
  }

  function normalizeInput(input) {
    const playedCards = (input.playedCards || []).map(normalizeCard);
    const heldCards = (input.heldCards || []).map(normalizeCard);
    const level = Math.max(1, Math.floor(Number(input.level) || 1));
    const jokers = (input.jokers || []).map(normalizeJoker).filter((joker) => joker.id);
    const rules = normalizeRules(input.rules, jokers);
    const analysis = analyzePlayedCards(playedCards, rules);
    const handType = input.handType && HAND_BY_KEY[input.handType] ? input.handType : analysis.handType;
    const scoringIndexes = analysis.scoringIndexes;
    const scoringCards = playedCards.filter((card, index) => scoringIndexes.has(index) && card.scoring !== false);

    return {
      handType,
      level,
      playedCards,
      scoringCards,
      heldCards,
      jokers,
      remainingDiscards: normalizeNonNegativeInteger(input.remainingDiscards),
      remainingDeckCards: normalizeNonNegativeInteger(input.remainingDeckCards),
      dollars: normalizeNonNegativeInteger(input.dollars),
      currentHandTimesPlayed: normalizeNonNegativeInteger(input.currentHandTimesPlayed),
      finalHand: input.finalHand === true || input.finalHand === 'true',
      jokerValues: normalizeJokerValues(input.jokerValues),
      rules,
      analysis
    };
  }

  function normalizeRules(rules, jokers) {
    const inputRules = rules || {};
    const activeJokerIds = new Set((jokers || [])
      .filter((joker) => joker.disabled !== true)
      .map((joker) => joker.id));
    return {
      plasmaDeck: inputRules.plasmaDeck === true || inputRules.plasmaDeck === 'true',
      fourFingers: inputRules.fourFingers === true || inputRules.fourFingers === 'true' || activeJokerIds.has('fourFingers'),
      shortcut: inputRules.shortcut === true || inputRules.shortcut === 'true' || activeJokerIds.has('shortcut'),
      smearedJoker: inputRules.smearedJoker === true || inputRules.smearedJoker === 'true' || activeJokerIds.has('smearedJoker')
    };
  }

  function normalizeNonNegativeInteger(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) return null;
    return Math.max(0, number);
  }

  function normalizeSignedInteger(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) return null;
    return number;
  }

  function normalizeJokerValues(values) {
    const normalized = {};
    Object.entries(values || {}).forEach(([id, value]) => {
      const number = normalizeSignedInteger(value);
      if (number !== null) normalized[id] = number;
    });
    return normalized;
  }

  function hasEnhancement(card, enhancementKey) {
    return card && card.debuffed !== true && card.enhancement === enhancementKey;
  }

  function cardMatchesSuit(card, suit, rules = {}) {
    if (!card) return false;
    if (card.suit === suit || hasEnhancement(card, 'wild')) return true;
    return rules.smearedJoker === true && suitFamily(card.suit) === suitFamily(suit);
  }

  function cardMatchesAnySuit(card, suits, rules = {}) {
    if (!card) return false;
    if (hasEnhancement(card, 'wild')) return true;
    if (rules.smearedJoker === true) {
      return suitAliases(card.suit, rules).some((suit) => suits.has(suit));
    }
    return suits.has(card.suit);
  }

  function suitsRepresented(cards, rules = {}) {
    const suits = new Set();
    cards.filter((card) => !card.debuffed).forEach((card) => {
      if (hasEnhancement(card, 'wild')) {
        SUITS.forEach((suit) => suits.add(suit.key));
      } else {
        suitAliases(card.suit, rules).forEach((suit) => suits.add(suit));
      }
    });
    return suits;
  }

  function groupSuitIndexes(cards, rules = {}) {
    const groups = new Map(SUITS.map((suit) => [suit.key, []]));
    cards.forEach((card, index) => {
      const sourceIndex = card.sourceIndex ?? index;
      SUITS.forEach((suit) => {
        if (cardMatchesSuit(card, suit.key, rules)) {
          groups.get(suit.key).push(sourceIndex);
        }
      });
    });
    return groups;
  }

  function suitFamily(suit) {
    if (suit === 'hearts' || suit === 'diamonds') return 'red';
    if (suit === 'spades' || suit === 'clubs') return 'black';
    return suit;
  }

  function suitAliases(suit, rules = {}) {
    if (rules.smearedJoker !== true) return [suit];
    if (suit === 'hearts' || suit === 'diamonds') return ['hearts', 'diamonds'];
    if (suit === 'spades' || suit === 'clubs') return ['spades', 'clubs'];
    return [suit];
  }

  function analyzePlayedCards(cards, rules = {}) {
    const normalizedCards = cards.map((card) => RANK_BY_KEY[card.rank] ? card : normalizeCard(card));
    if (!normalizedCards.length) {
      return { handType: 'highCard', scoringIndexes: new Set(), reason: 'No cards selected' };
    }

    const stoneIndexes = normalizedCards
      .map((card, index) => (hasEnhancement(card, 'stone') ? index : -1))
      .filter((index) => index >= 0);
    const handCards = normalizedCards
      .map((card, index) => ({ ...card, sourceIndex: index }))
      .filter((card) => !hasEnhancement(card, 'stone'));

    if (!handCards.length) {
      return typedAnalysis('highCard', new Set(), stoneIndexes);
    }

    const rankGroups = groupIndexes(handCards, 'rank');
    const suitGroups = groupSuitIndexes(handCards, rules);
    const counts = Array.from(rankGroups.values()).map((indexes) => indexes.length).sort((a, b) => b - a);
    const requiredShapeCards = rules.fourFingers === true ? 4 : 5;
    const isFlush = handCards.length >= requiredShapeCards && Array.from(suitGroups.values()).some((indexes) => indexes.length >= requiredShapeCards);
    const straightIndexes = findStraightIndexes(handCards, rules);
    const isStraight = straightIndexes.size >= requiredShapeCards;
    const sameSuitIndexes = isFlush ? largestGroupIndexes(suitGroups) : new Set();
    const straightFlushIndexes = intersectionIndexes(straightIndexes, sameSuitIndexes);

    if (counts[0] >= 5 && isFlush) return typedAnalysis('flushFive', intersectionIndexes(largestGroupIndexes(rankGroups), sameSuitIndexes), stoneIndexes);
    if (counts[0] >= 3 && counts[1] >= 2 && isFlush) return typedAnalysis('flushHouse', sameSuitIndexes, stoneIndexes);
    if (counts[0] >= 5) return typedAnalysis('fiveOfAKind', largestGroupIndexes(rankGroups), stoneIndexes);
    if (isStraight && isFlush && straightFlushIndexes.size >= requiredShapeCards) return typedAnalysis('straightFlush', straightFlushIndexes, stoneIndexes);
    if (counts[0] >= 4) return typedAnalysis('fourOfAKind', largestGroupIndexes(rankGroups), stoneIndexes);
    if (counts[0] >= 3 && counts[1] >= 2) return typedAnalysis('fullHouse', fullHouseIndexes(rankGroups), stoneIndexes);
    if (isFlush) return typedAnalysis('flush', sameSuitIndexes, stoneIndexes);
    if (isStraight) return typedAnalysis('straight', straightIndexes, stoneIndexes);
    if (counts[0] >= 3) return typedAnalysis('threeOfAKind', largestGroupIndexes(rankGroups), stoneIndexes);

    const pairGroups = Array.from(rankGroups.values()).filter((indexes) => indexes.length >= 2);
    if (pairGroups.length >= 2) return typedAnalysis('twoPair', new Set(pairGroups.flat()), stoneIndexes);
    if (pairGroups.length === 1) return typedAnalysis('pair', new Set(pairGroups[0]), stoneIndexes);

    return typedAnalysis('highCard', new Set([highestCardIndex(handCards)]), stoneIndexes);
  }

  function typedAnalysis(handType, scoringIndexes, extraScoringIndexes = []) {
    return {
      handType,
      scoringIndexes: new Set([...trimScoringIndexes(scoringIndexes, handType), ...extraScoringIndexes]),
      reason: HAND_BY_KEY[handType].label
    };
  }

  function groupIndexes(cards, field) {
    const groups = new Map();
    cards.forEach((card, index) => {
      const key = card[field];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(card.sourceIndex ?? index);
    });
    return groups;
  }

  function largestGroupIndexes(groups) {
    let largest = [];
    for (const indexes of groups.values()) {
      if (indexes.length > largest.length) largest = indexes;
    }
    return new Set(largest);
  }

  function intersectionIndexes(a, b) {
    const result = new Set();
    for (const value of a) {
      if (b.has(value)) result.add(value);
    }
    return result;
  }

  function fullHouseIndexes(rankGroups) {
    const groups = Array.from(rankGroups.values()).sort((a, b) => b.length - a.length);
    return new Set(groups.slice(0, 2).flat());
  }

  function trimScoringIndexes(indexes, handType) {
    const maxCards = handType === 'highCard' ? 1 : 5;
    return new Set(Array.from(indexes).slice(0, maxCards));
  }

  function highestCardIndex(cards) {
    let bestIndex = 0;
    cards.forEach((card, index) => {
      if (RANK_BY_KEY[card.rank].value > RANK_BY_KEY[cards[bestIndex].rank].value) {
        bestIndex = index;
      }
    });
    return cards[bestIndex].sourceIndex ?? bestIndex;
  }

  function findStraightIndexes(cards, rules = {}) {
    const byValue = new Map();
    cards.forEach((card, index) => {
      const value = RANK_BY_KEY[card.rank].value;
      const sourceIndex = card.sourceIndex ?? index;
      if (!byValue.has(value)) byValue.set(value, sourceIndex);
      if (value === 14 && !byValue.has(1)) byValue.set(1, sourceIndex);
    });

    const values = Array.from(byValue.keys()).sort((a, b) => a - b);
    const requiredLength = rules.fourFingers === true ? 4 : 5;
    const maxGap = rules.shortcut === true ? 2 : 1;
    let bestRun = [];
    let currentRun = [];
    values.forEach((value) => {
      if (!currentRun.length || (value > currentRun[currentRun.length - 1] && value - currentRun[currentRun.length - 1] <= maxGap)) {
        currentRun.push(value);
      } else {
        currentRun = [value];
      }
      if (currentRun.length > bestRun.length) bestRun = currentRun.slice();
    });

    if (bestRun.length < requiredLength) return new Set();
    return new Set(bestRun.slice(-Math.min(bestRun.length, 5)).map((value) => byValue.get(value)));
  }

  function baseHandScore(handType, level) {
    const hand = HAND_BY_KEY[handType] || HAND_BY_KEY.highCard;
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return {
      chips: hand.baseChips + hand.levelChips * (safeLevel - 1),
      mult: hand.baseMult + hand.levelMult * (safeLevel - 1)
    };
  }

  function resolveJokerSlots(activeJokers) {
    return activeJokers.map((joker, index) => {
      const effect = JOKER_CATALOG[joker.id];
      if (!effect) {
        return { joker, effect: null, copiedFrom: null, copyError: '' };
      }
      if (effect.mode !== 'copy') {
        return { joker, effect, copiedFrom: null, copyError: '' };
      }

      const targetIndex = joker.id === 'blueprint' ? index + 1 : 0;
      const targetJoker = activeJokers[targetIndex];
      if (!targetJoker || targetJoker === joker) {
        return { joker, effect: null, copiedFrom: null, copyError: `${effect.name}: no compatible target in this Joker layout` };
      }

      const targetEffect = JOKER_CATALOG[targetJoker.id];
      if (!targetEffect) {
        return { joker, effect: null, copiedFrom: targetJoker, copyError: `${effect.name}: target Joker is not modeled yet` };
      }
      if (COPY_JOKER_IDS.has(targetJoker.id) || targetEffect.mode === 'copy') {
        return { joker, effect: null, copiedFrom: targetJoker, copyError: `${effect.name}: copying another copy Joker is not modeled` };
      }

      return { joker, effect: targetEffect, copiedFrom: targetJoker, copyError: '' };
    });
  }

  function displayJokerName(joker) {
    const effect = JOKER_CATALOG[joker.id];
    return effect ? effect.name : joker.name || joker.id;
  }

  function formatCopySource(slot) {
    if (!slot.copiedFrom) return displayJokerName(slot.joker);
    return `${displayJokerName(slot.joker)} copies ${displayJokerName(slot.copiedFrom)}`;
  }

  function buildRetriggerRules(jokerState, resolvedJokers) {
    const rules = [];
    resolvedJokers.forEach((slot) => {
      if (!slot.effect || typeof slot.effect.retriggerRule !== 'function') return;
      const rule = slot.effect.retriggerRule(jokerState, formatCopySource(slot));
      if (rule) rules.push(rule);
    });
    return rules;
  }

  function buildScoringTriggers(scoringCards, retriggerRules) {
    const triggers = [];
    scoringCards.forEach((card) => {
      triggers.push({ card, source: 'base', repeatIndex: 0 });
      if (card.seal === 'red' && !card.debuffed) {
        triggers.push({ card, source: 'redSeal', repeatIndex: 1 });
      }
      retriggerRules.forEach((rule) => {
        if (!rule.appliesTo(card)) return;
        for (let index = 0; index < rule.times; index += 1) {
          triggers.push({ card, source: rule.sourceId, sourceName: rule.sourceName, repeatIndex: index + 1 });
        }
      });
    });
    return triggers;
  }

  function score(input) {
    const state = normalizeInput(input || {});
    const hand = HAND_BY_KEY[state.handType] || HAND_BY_KEY.highCard;
    const base = baseHandScore(hand.key, state.level);
    let chips = base.chips;
    let mult = base.mult;
    const steps = [{
      phase: 'hand',
      label: `${hand.label} level ${state.level}`,
      chips,
      mult,
      score: Math.floor(chips * mult)
    }];

    const activeJokers = state.jokers.filter((joker) => joker.disabled !== true);
    const jokerState = {
      handType: state.handType,
      playedCards: state.playedCards,
      scoringCards: state.scoringCards,
      scoringTriggers: state.scoringCards,
      heldCards: state.heldCards,
      remainingDiscards: state.remainingDiscards,
      remainingDeckCards: state.remainingDeckCards,
      dollars: state.dollars,
      currentHandTimesPlayed: state.currentHandTimesPlayed,
      finalHand: state.finalHand,
      jokerValues: state.jokerValues,
      rules: state.rules,
      activeJokers,
      activeJokerCount: activeJokers.length
    };
    const resolvedJokers = resolveJokerSlots(activeJokers);
    const retriggerRules = buildRetriggerRules(jokerState, resolvedJokers);
    const retriggerSourceNames = new Set(retriggerRules.map((rule) => rule.sourceName));
    const scoringTriggers = buildScoringTriggers(state.scoringCards, retriggerRules);
    jokerState.scoringTriggers = scoringTriggers;

    resolvedJokers.forEach((slot) => {
      if (!slot.copiedFrom && !slot.copyError) return;
      steps.push({
        phase: 'copy',
        label: slot.copyError || `${displayJokerName(slot.joker)} copies ${displayJokerName(slot.copiedFrom)}`,
        chips,
        mult,
        score: Math.floor(chips * mult),
        skipped: Boolean(slot.copyError)
      });
    });

    retriggerRules.forEach((rule) => {
      steps.push({
        phase: 'retrigger',
        label: rule.text,
        chips,
        mult,
        score: Math.floor(chips * mult)
      });
    });

    buildRuleSteps(state.rules, activeJokers).forEach((step) => {
      steps.push({
        phase: 'rule',
        label: step,
        chips,
        mult,
        score: Math.floor(chips * mult)
      });
    });

    scoringTriggers.forEach((trigger) => {
      const card = trigger.card;
      const cardName = formatCardName(card);
      if (card.debuffed) {
        steps.push({
          phase: 'status',
          label: `${cardName}: Debuffed card scores no Chips and disables card abilities`,
          chips,
          mult,
          score: Math.floor(chips * mult),
          skipped: true
        });
        return;
      }

      const retriggerLabel = trigger.source === 'redSeal'
        ? ' (Red Seal retrigger)'
        : trigger.source === 'base'
          ? ''
          : ` (${trigger.sourceName} retrigger)`;
      if (trigger.source === 'redSeal') {
        steps.push({
          phase: 'seal',
          label: `${cardName}: Red Seal retriggers this scoring card`,
          chips,
          mult,
          score: Math.floor(chips * mult)
        });
      }

      if (!hasEnhancement(card, 'stone')) {
        chips += card.chips;
        steps.push({
          phase: 'card',
          label: `${cardName}${retriggerLabel}: +${card.chips} Chips`,
          chips,
          mult,
          score: Math.floor(chips * mult)
        });
      }

      const enhancement = ENHANCEMENT_BY_KEY[card.enhancement];
      if (enhancement && card.enhancement !== 'none') {
        if (enhancement.stoneChips) chips += enhancement.stoneChips;
        if (enhancement.chipsAdd) chips += enhancement.chipsAdd;
        if (enhancement.multAdd) mult += enhancement.multAdd;
        if (enhancement.xMult) mult *= enhancement.xMult;
        if (enhancement.stoneChips || enhancement.chipsAdd || enhancement.multAdd || enhancement.xMult || enhancement.wild) {
          steps.push({
            phase: 'enhancement',
            label: formatCardModifierLabel(cardName, enhancement, retriggerLabel),
            chips,
            mult,
            score: Math.floor(chips * mult)
          });
        }
      }

      const edition = EDITION_BY_KEY[card.edition];
      if (edition && card.edition !== 'none') {
        if (edition.chipsAdd) chips += edition.chipsAdd;
        if (edition.multAdd) mult += edition.multAdd;
        if (edition.xMult) mult *= edition.xMult;
        steps.push({
          phase: 'edition',
          label: formatCardModifierLabel(cardName, edition, retriggerLabel),
          chips,
          mult,
          score: Math.floor(chips * mult)
        });
      }
    });

    state.heldCards.forEach((card) => {
      const cardName = formatCardName(card);
      if (card.debuffed) {
        steps.push({
          phase: 'status',
          label: `${cardName}: Debuffed held card abilities are disabled`,
          chips,
          mult,
          score: Math.floor(chips * mult),
          skipped: true
        });
        return;
      }

      const enhancement = ENHANCEMENT_BY_KEY[card.enhancement];
      if (!enhancement || !enhancement.heldXMult) return;
      const repetitions = card.seal === 'red' ? 2 : 1;
      for (let repeatIndex = 0; repeatIndex < repetitions; repeatIndex += 1) {
        if (repeatIndex > 0) {
          steps.push({
            phase: 'seal',
            label: `${cardName}: Red Seal retriggers held card ability`,
            chips,
            mult,
            score: Math.floor(chips * mult)
          });
        }
        mult *= enhancement.heldXMult;
        steps.push({
          phase: 'held',
          label: `${cardName}: ${enhancement.label} applies X${enhancement.heldXMult} Mult${repeatIndex > 0 ? ' again' : ''}`,
          chips,
          mult,
          score: Math.floor(chips * mult)
        });
      }
    });

    const unsupportedJokers = [];

    resolvedJokers.forEach((slot) => {
      const { joker, effect } = slot;
      if (!effect) {
        if (!slot.copyError) unsupportedJokers.push(joker.id);
        steps.push({
          phase: 'joker',
          label: slot.copyError || `${joker.id}: not modeled in Calculator 3 yet`,
          chips,
          mult,
          score: Math.floor(chips * mult),
          skipped: true
        });
        return;
      }
      if (effect.mode === 'cardRetrigger') {
        if (!retriggerSourceNames.has(formatCopySource(slot))) {
          steps.push({
            phase: 'joker',
            label: `${formatCopySource(slot)}: condition not met`,
            chips,
            mult,
            score: Math.floor(chips * mult),
            skipped: true
          });
        }
        return;
      }
      if (effect.mode === 'ruleModifier') {
        return;
      }

      const delta = effect.apply(jokerState);
      if (!delta) {
        steps.push({
          phase: 'joker',
          label: `${effect.name}: condition not met`,
          chips,
          mult,
          score: Math.floor(chips * mult),
          skipped: true
        });
        return;
      }

      if (delta.chipsAdd) chips += delta.chipsAdd;
      if (delta.multAdd) mult += delta.multAdd;
      if (delta.xMult) mult *= delta.xMult;
      steps.push({
        phase: 'joker',
        label: slot.copiedFrom ? `${formatCopySource(slot)}: ${delta.text}` : delta.text,
        chips,
        mult,
        score: Math.floor(chips * mult)
      });
    });

    let finalChips = chips;
    let finalMult = mult;
    if (state.rules.plasmaDeck) {
      const balanced = (chips + mult) / 2;
      finalChips = balanced;
      finalMult = balanced;
      steps.push({
        phase: 'deck',
        label: 'Plasma Deck: balance Chips and Mult',
        chips: finalChips,
        mult: finalMult,
        score: Math.floor(finalChips * finalMult)
      });
    }

    return {
      handType: state.handType,
      handLabel: hand.label,
      level: state.level,
      chips: roundForDisplay(finalChips),
      mult: roundForDisplay(finalMult),
      score: Math.floor(finalChips * finalMult),
      scoringCards: state.scoringCards,
      playedCards: state.playedCards,
      heldCards: state.heldCards,
      remainingDiscards: state.remainingDiscards,
      remainingDeckCards: state.remainingDeckCards,
      dollars: state.dollars,
      currentHandTimesPlayed: state.currentHandTimesPlayed,
      finalHand: state.finalHand,
      jokerValues: state.jokerValues,
      steps,
      unsupportedJokers,
      warnings: unsupportedJokers.length
        ? [`${unsupportedJokers.length} Joker effect${unsupportedJokers.length === 1 ? '' : 's'} still need engine coverage`]
        : []
    };
  }

  function roundForDisplay(value) {
    return Math.round(value * 1000) / 1000;
  }

  function buildRuleSteps(rules, activeJokers) {
    const activeIds = new Set(activeJokers.map((joker) => joker.id));
    const steps = [];
    if (rules.fourFingers && activeIds.has('fourFingers')) {
      steps.push('Four Fingers: Flushes and Straights may be detected with 4 cards');
    }
    if (rules.shortcut && activeIds.has('shortcut')) {
      steps.push('Shortcut: Straight detection allows one-rank gaps');
    }
    if (rules.smearedJoker && activeIds.has('smearedJoker')) {
      steps.push('Smeared Joker: red suits count together and black suits count together');
    }
    return steps;
  }

  function formatCardName(card) {
    if (hasEnhancement(card, 'stone')) return 'Stone Card';
    return `${RANK_BY_KEY[card.rank].label} of ${SUIT_BY_KEY[card.suit].label}`;
  }

  function formatCardModifierLabel(cardName, modifier, suffix = '') {
    if (modifier.stoneChips) return `${cardName}${suffix}: ${modifier.label} adds +${modifier.stoneChips} Chips`;
    if (modifier.chipsAdd) return `${cardName}${suffix}: ${modifier.label} adds +${modifier.chipsAdd} Chips`;
    if (modifier.multAdd) return `${cardName}${suffix}: ${modifier.label} adds +${modifier.multAdd} Mult`;
    if (modifier.xMult) return `${cardName}${suffix}: ${modifier.label} applies X${modifier.xMult} Mult`;
    if (modifier.wild) return `${cardName}${suffix}: ${modifier.label} can count as any suit`;
    return `${cardName}${suffix}: ${modifier.label}`;
  }

  return {
    HAND_TYPES,
    RANKS,
    SUITS,
    ENHANCEMENTS,
    EDITIONS,
    SEALS,
    JOKER_CATALOG,
    analyzePlayedCards,
    baseHandScore,
    normalizeInput,
    score
  };
});
