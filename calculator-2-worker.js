'use strict';

importScripts('balatro-sim.js');

function buildZeroScore() {
  return {
    total: [0, 0],
    chips: 0,
    mult: [0, 0],
    typeIndex: null,
  };
}

self.onmessage = (event) => {
  const { requestId, payload } = event.data || {};

  if (!requestId) return;

  if (!payload || !payload.cards || payload.cards.length === 0) {
    self.postMessage({
      requestId,
      score: buildZeroScore(),
    });
    return;
  }

  try {
    const hand = new Hand(payload);
    hand.compileAll();
    const result = hand.simulateBestHand();

    self.postMessage({
      requestId,
      score: {
        total: [result[0], result[1]],
        chips: result[2],
        mult: result[3],
        typeIndex: hand.typeOfHand,
      },
    });
  } catch (error) {
    self.postMessage({
      requestId,
      error: error && error.message ? error.message : String(error),
    });
  }
};
