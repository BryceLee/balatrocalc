# Calculator 3 Product Blueprint

## Theme

Calculator 3 should become BalatroCalc's own explainable scoring workspace instead of only routing users between the classic optimizer and the embedded Balatrolator module.

The first product slice is an explainable score path:

- Model the played hand as structured cards, hand type, level, deck rules, and ordered Jokers.
- Return a step list that shows exactly when Chips, Mult, and XMult changed.
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
    { rank: "A", suit: "hearts" },
    { rank: "A", suit: "clubs" }
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
  chips: 32,
  mult: 54,
  score: 1728,
  steps: [
    { phase: "hand", label: "Pair level 1", chips: 10, mult: 2, score: 20 },
    { phase: "card", label: "Ace of Hearts: +11 Chips", chips: 21, mult: 2, score: 42 },
    { phase: "joker", label: "Jolly Joker: +8 Mult", chips: 32, mult: 10, score: 320 }
  ],
  unsupportedJokers: []
}
```

## First Coverage Set

This slice covers hand bases, rank chips, hand inference, and deterministic Joker effects that can be represented without run history:

- Flat Mult: Joker, Jolly, Zany, Mad, Crazy, Droll, Half Joker
- Flat Chips: Sly, Wily, Clever, Devious, Crafty
- Per-card suit/rank effects: Greedy, Lusty, Wrathful, Gluttonous, Fibonacci, Even Steven, Odd Todd, Scholar, Scary Face
- XMult order effects: Cavendish, The Duo, The Trio, The Family, The Order, The Tribe
- Joker count effect: Abstract Joker

The model intentionally reports unsupported IDs such as `blueprint` instead of estimating them.

## Next Iteration

1. Add a real homepage entry after the current dirty `index.html` module-preference work is resolved.
2. Extend the model with enhancement, edition, seal, stone, steel, glass, and in-hand card phases.
3. Add copy/copyable state serialization so examples can move between classic, version 2, and Calculator 3.
4. Add a Joker coverage table generated from `JOKER_CATALOG` and compare it against the 150 local Joker definitions in `cards.js`.
5. Decide how Calculator 3 coexists with Worker optimization: manual explainable score path first, optimizer migration later.
