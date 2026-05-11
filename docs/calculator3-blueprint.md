# Calculator 3 Product Blueprint

## Theme

Calculator 3 should become BalatroCalc's own explainable scoring workspace instead of only routing users between the classic optimizer and the embedded Balatrolator module.

The first product slice is an explainable score path:

- Model the played hand as structured cards, hand type, level, deck rules, and ordered Jokers.
- Return a step list that shows exactly when rank Chips, card enhancements, editions, Chips, Mult, and XMult changed.
- Keep unsupported Joker effects explicit, so future coverage work has a visible backlog instead of silent wrong math.

## Current Evidence

- Recent GSC memory showed `balatro calculator` as the highest visible query cluster, so the homepage calculator experience remains the highest-leverage surface.
- The classic calculator engine in `balatro-sim.js` has broad logic, but its array-based state is hard to expose as user-readable product copy.
- The embedded `balatrolator-module/` gives an alternate calculator, but the main site owns only the shell and has limited ability to explain or instrument its internal scoring path.
- `cards.js` contains local Joker source constants and descriptions that are useful for a first curated Joker coverage set.
- `blueprint/` focuses on seed and run data; it is a reference for Balatro data vocabulary, not a direct score path UI.

## Input Contract

```js
{
  handType: "pair",
  level: 1,
  playedCards: [
    { rank: "A", suit: "hearts", enhancement: "mult", edition: "none" },
    { rank: "A", suit: "clubs", enhancement: "none", edition: "foil" }
  ],
  jokers: [
    "jolly",
    "fibonacci",
    "cavendish"
  ],
  rules: {
    plasmaDeck: false
  }
}
```

## Output Contract

```js
{
  handType: "pair",
  handLabel: "Pair",
  chips: 82,
  mult: 90,
  score: 7380,
  steps: [
    { phase: "hand", label: "Pair level 1", chips: 10, mult: 2, score: 20 },
    { phase: "card", label: "Ace of Hearts: +11 Chips", chips: 21, mult: 2, score: 42 },
    { phase: "enhancement", label: "Ace of Hearts: Mult Card adds +4 Mult", chips: 21, mult: 6, score: 126 },
    { phase: "card", label: "Ace of Clubs: +11 Chips", chips: 32, mult: 6, score: 192 },
    { phase: "edition", label: "Ace of Clubs: Foil adds +50 Chips", chips: 82, mult: 6, score: 492 },
    { phase: "joker", label: "Jolly Joker: +8 Mult", chips: 82, mult: 14, score: 1148 },
    { phase: "joker", label: "Fibonacci: 2 matching scoring cards add +16 Mult", chips: 82, mult: 30, score: 2460 },
    { phase: "joker", label: "Cavendish: X3 Mult", chips: 82, mult: 90, score: 7380 }
  ],
  unsupportedJokers: []
}
```

## First Coverage Set

This slice covers hand bases, rank chips, hand inference, and deterministic Joker effects that can be represented without run history:

- Flat Mult: Joker, Jolly, Zany, Mad, Crazy, Droll, Half Joker
- Scored card modifiers: Bonus Card, Mult Card, Glass Card, Stone Card
- Scored card editions: Foil, Holographic, Polychrome
- Flat Chips: Sly, Wily, Clever, Devious, Crafty
- Per-card suit/rank effects: Greedy, Lusty, Wrathful, Gluttonous, Fibonacci, Even Steven, Odd Todd, Scholar, Scary Face
- XMult order effects: Cavendish, The Duo, The Trio, The Family, The Order, The Tribe
- Joker count effect: Abstract Joker

The model intentionally reports unsupported IDs such as `blueprint` instead of estimating them.

## Next Iteration

1. Add a real homepage entry after the current dirty `index.html` module-preference work is resolved.
2. Extend the model with seals, steel-in-hand, gold/lucky expected-value controls, and retrigger phases.
3. Add copy/copyable state serialization so examples can move between classic, version 2, and Calculator 3.
4. Add a Joker coverage table generated from `JOKER_CATALOG` and compare it against the 150 local Joker definitions in `cards.js`.
5. Decide how Calculator 3 coexists with Worker optimization: manual explainable score path first, optimizer migration later.
