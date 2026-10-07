/* The quiz catalog and the logic that decides which question comes next and when a quiz is done. */
import { state } from './state.js';
import { WHO_MEAL, ATH_Q, MEAL_BUDGET, FY_QS, RET_QS } from './data/meal.js';
import { ROOT_H, HOUSE_BUDGET, depth } from './data/housing.js';

const QUIZZES = {
  meal: { name: 'Meal plan', blurb: 'Flex, Block, Commuter or an athletic plan, matched to how you eat and your weekly Dining Dollar budget.', len: '3 to 5 questions' },
  housing: { name: 'Housing', blurb: 'Villages, halls and apartments for first-years and returning students.', len: '2 to 9 questions' }
};

/* ================= Flow ================= */
function getFlow() {
  if (state.quiz === 'meal') {
    const qs = [WHO_MEAL];
    if (state.picks[0] != null) {
      const who = WHO_MEAL.opts[state.picks[0]].v;
      qs.push(...(who === 'athlete' ? [ATH_Q, MEAL_BUDGET] : who === 'first' ? FY_QS : RET_QS));
    }
    const known = state.picks[0] != null;
    return { qs, done: known && state.picks.length >= qs.length, total: known ? qs.length : 5 };
  }
  let node = ROOT_H; const qs = [node]; const chosen = []; let result = null;
  for (let i = 0; i < state.picks.length; i++) {
    const o = node.opts[state.picks[i]]; chosen.push(o);
    if (o.result) { result = o.result; break; }
    node = typeof o.next === 'function' ? o.next(chosen) : o.next; qs.push(node);
  }
  if (result !== null) {
    if (state.picks[0] === 0) return { qs, done: true, result, budget: undefined, total: qs.length };
    qs.push(HOUSE_BUDGET);
    const answered = state.picks.length >= qs.length;
    return { qs, done: answered, result, budget: answered ? state.picks[qs.length - 1] : undefined, total: qs.length };
  }
  const last = qs[qs.length - 1];
  return { qs, done: false, result: null, total: qs.length - 1 + depth(last) + (state.picks[0] === 0 ? 0 : 1) };
}

export { QUIZZES, getFlow };
