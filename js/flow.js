/* The quiz catalog and the logic that decides which question comes next and when a quiz is done. */
import { state, profile } from './state.js';
import { ATH_Q, MEAL_BUDGET, FY_QS, RET_QS } from './data/meal.js';
import { ROOT_H, HOUSE_BUDGET, N_FY, RETURNING_ROOT, depth } from './data/housing.js';

const QUIZZES = {
  meal: { name: 'Meal plan', blurb: 'Flex, Block, Commuter or an athletic plan, matched to how you eat and your weekly Dining Dollar budget.', len: '3 to 5 questions' },
  housing: { name: 'Housing', blurb: 'Villages, halls and apartments for first-years and returning students.', len: '2 to 9 questions' }
};

/* ================= Flow ================= */
function getFlow() {
  if (state.quiz === 'meal') {
    if (!profile.year || profile.athlete == null) return { qs: [], done: false, total: 0 };
    const qs = profile.athlete === true ? [ATH_Q, MEAL_BUDGET] : (profile.year === 'first' ? [...FY_QS] : [...RET_QS]);
    return { qs, done: state.picks.length >= qs.length, total: qs.length };
  }

  if (!profile.year) return { qs: [ROOT_H], done: false, result: null, total: 1 };
  const start = profile.year === 'first' ? N_FY : RETURNING_ROOT;
  let node = start; const qs = [node]; const chosen = []; let result = null;
  for (let i = 0; i < state.picks.length; i++) {
    const o = node.opts[state.picks[i]]; chosen.push(o);
    if (o.result) { result = o.result; break; }
    node = typeof o.next === 'function' ? o.next(chosen) : o.next; qs.push(node);
  }
  if (result !== null) {
    if (profile.year === 'first') return { qs, done: true, result, budget: undefined, total: qs.length };
    qs.push(HOUSE_BUDGET);
    const answered = state.picks.length >= qs.length;
    return { qs, done: answered, result, budget: answered ? state.picks[qs.length - 1] : undefined, total: qs.length };
  }
  const last = qs[qs.length - 1];
  return { qs, done: false, result: null, total: qs.length - 1 + depth(last) + (profile.year === 'first' ? 0 : 1) };
}

export { QUIZZES, getFlow };
