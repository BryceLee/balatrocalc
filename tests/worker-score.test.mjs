import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const workerSource = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
const context = {
  importScripts() {},
  self: {},
};

vm.createContext(context);
vm.runInContext(workerSource, context);

assert.equal(context.compareBigScore([9, 2], [10, 2]), -1);
assert.equal(context.compareBigScore([8, 3], [9, 2]), 1);
assert.equal(context.compareBigScore([5, 12], [5, 12]), 0);
assert.equal(context.compareBigScore([2, 10, 999], [11, 9, 1]), 1);

console.log('worker score comparison tests passed');
