import test from 'node:test';
import assert from 'node:assert/strict';
import { topUpFor, rankReturning, DD_SLIDER } from '../js/data/meal.js';
import { state, setProfile, resetQuiz } from '../js/state.js';
import { getFlow } from '../js/flow.js';
import { money } from '../js/format.js';

test('money formats with commas', () => assert.equal(money(1240), '$1,240'));
test('top up is a non-negative multiple of 5', () => {
  for (const k of ['flex500', 'flex800', 'block60']) {
    const t = topUpFor(k, 100);
    assert.ok(t >= 0 && t % 5 === 0);
  }
});
test('Dining Dollar slider uses $5 increments while exact input can use dollars', () => {
  assert.equal(DD_SLIDER.step, 5);
});
test('rankReturning returns ranked plans', () => {
  const r = rankReturning([0, 0, 60]);
  assert.ok(Array.isArray(r) && r.length > 0);
});

test('meal quiz flows finish without a final budget question', () => {
  for (const [year, athlete, picks, expectedQuestions] of [
    ['first', false, [40], 1],
    ['sophomore', true, [0], 1],
    ['sophomore', false, [0, 0, 60], 3]
  ]) {
    setProfile({ year, athlete });
    resetQuiz('meal');
    state.picks = picks;
    const flow = getFlow();
    assert.equal(flow.done, true);
    assert.equal(flow.qs.length, expectedQuestions);
  }
});

test('housing quiz has no final budget question', () => {
  setProfile({ year: 'sophomore', athlete: false });
  resetQuiz('housing');
  state.picks = [1, 0];
  const flow = getFlow();
  assert.equal(flow.done, true);
  assert.equal(flow.result, 'athome');
  assert.equal(flow.qs.length, 2);
});
