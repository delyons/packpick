import test from 'node:test';
import assert from 'node:assert/strict';
import { topUpFor, rankReturning } from '../js/data/meal.js';
import { money } from '../js/format.js';

test('money formats with commas', () => assert.equal(money(1240), '$1,240'));
test('top up is a non-negative multiple of 5', () => {
  for (const k of ['flex500', 'flex800', 'block60']) {
    const t = topUpFor(k, 100);
    assert.ok(t >= 0 && t % 5 === 0);
  }
});
test('rankReturning returns ranked plans', () => {
  const r = rankReturning([0, 0, 0, 60, null]);
  assert.ok(Array.isArray(r) && r.length > 0);
});
