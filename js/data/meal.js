/* Meal plans (2026-27 per-semester rates before tax), the meal quiz questions, and the scoring that ranks plans. */
import { WEEKS, money } from '../format.js';

/* ================= Meal plan data (2026-27, per semester, before tax) ================= */
const MEAL = {
  flex500: { name: 'Flex 500', price: 2930, dd: 500, cap: 14, meals: 'All-day dining hall access plus 1 takeout meal a day', extra: '2 guest meals a semester' },
  flex800: { name: 'Flex 800', price: 3176, dd: 800, cap: 14, meals: 'All-day dining hall access plus 1 takeout meal a day', extra: '3 guest meals a semester' },
  block60: { name: 'Block 60', price: 1350, dd: 650, cap: 3.5, meals: '60 dining hall meals (3 to 4 a week)' },
  block80: { name: 'Block 80', price: 1670, dd: 750, cap: 4.7, meals: '80 dining hall meals (4 to 5 a week)' },
  block100: { name: 'Block 100', price: 1993, dd: 850, cap: 5.9, meals: '100 dining hall meals (5 to 6 a week)' },
  block120: { name: 'Block 120', price: 2315, dd: 1000, cap: 7.1, meals: '120 dining hall meals (7 a week)' },
  commuter: { name: 'Commuter 900', price: 900, dd: 900, cap: 0, meals: 'No dining hall meals. Takeout runs through Dining Dollars.' },
  ath50: { name: 'Athletic 50', price: 980, dd: 300, meals: '50 dining hall meals (about 2.9 a week)', extra: 'Valid at Fountain, Clark, Case, One Earth or University Towers' },
  ath80: { name: 'Athletic 80', price: 1243, dd: 200, meals: '80 dining hall meals (about 4.7 a week)', extra: 'Valid at Fountain, Clark, Case, One Earth or University Towers' },
  ath120: { name: 'Athletic 120', price: 1719, dd: 200, meals: '120 dining hall meals (about 7.1 a week)' },
  ath150: { name: 'Athletic 150', price: 2083, dd: 200, meals: '150 dining hall meals (about 8.8 a week)' }
};
const ddWeek = k => MEAL[k].dd / WEEKS;
const MATCH_TEMP = 10; // lower = the best plan takes a bigger share

const WHO_MEAL = { id: 'who', q: 'Which one describes you?', opts: [
  { label: 'First-year living on campus', sub: 'You are required to pick Flex 500 or Flex 800.', v: 'first' },
  { label: 'Roster athlete', sub: 'Training table meals are covered Monday to Friday.', v: 'athlete' },
  { label: 'Returning or transfer student', sub: 'Flex, Block and Commuter plans are open to you.', v: 'returning' }
]};
const DD_SLIDER = { id: 'dd', type: 'slider', q: 'What weekly Dining Dollar budget do you want?', sub: 'Dining Dollars pay at restaurants, cafés and markets with a 5% discount. You can add more Dining Dollars later, so a plan with fewer of them can still work. Dining hall meals come from your plan and cannot be added.', min: 10, max: 150, step: 5, def: 40 };
const MEAL_BUDGET = { id: 'mb', type: 'budget', q: 'Do you have a budget for your meal plan?', sub: 'An exact or rough amount is fine, per semester and before sales tax. Count your plan plus any Dining Dollars you would add on top. Skip it if you have not set one.', min: 800, max: 3400, step: 50, def: 2500, unit: 'per semester' };
const FY_QS = [DD_SLIDER, MEAL_BUDGET];
/* Dining Dollars can be topped up later. Dining hall meals cannot. So a plan's real cost is its price plus the top-up needed to reach the weekly Dining Dollar target. Top-ups are rounded up to the next $5. */
const ceil5 = x => Math.ceil(x / 5) * 5;
const topUpFor = (key, d) => (typeof d === 'number') ? Math.max(0, ceil5(d * WEEKS - MEAL[key].dd)) : 0;
const withTop = (key, d) => { const t = topUpFor(key, d); return MEAL[key].name + (t > 0 ? ' + ' + money(t) + ' top up' : ''); };
function fyCosts(d) {
  const t5 = topUpFor('flex500', d), t8 = topUpFor('flex800', d);
  return { T: Math.round(d * WEEKS), t5, t8, eff5: MEAL.flex500.price + t5, eff8: MEAL.flex800.price + t8 };
}
function ddPoints(d) {
  const c = fyCosts(d); const T = c.T;
  if (c.t5 === 0) return { p: { f5: 2 }, why: `Your ${money(d)} a week target (${money(T)} a semester) fits inside the 500 Dining Dollars in Flex 500, so Flex 800's extra 300 would go unused.` };
  if (c.eff5 < c.eff8) return { p: { f5: 1 }, why: `Reaching ${money(d)} a week (${money(T)} a semester) means topping up ${money(c.t5)} on Flex 500, for ${money(c.eff5)} in total. That is less than Flex 800${c.t8 > 0 ? ' with a ' + money(c.t8) + ' top-up' : ''} at ${money(c.eff8)}.` };
  if (c.eff8 < c.eff5) return { p: { f8: T >= 800 ? 2 : 1 }, why: `Reaching ${money(d)} a week (${money(T)} a semester) costs ${money(c.eff8)} on Flex 800${c.t8 > 0 ? ' with a ' + money(c.t8) + ' top-up' : ''} and ${money(c.eff5)} on Flex 500 with a ${money(c.t5)} top-up, so Flex 800's extra Dining Dollars save money.` };
  return { p: {}, why: '' };
}
function budgetPoints(b, d) {
  if (typeof b !== 'number') return { p: {}, why: '' };
  const c = fyCosts(d); const e5 = c.eff5, e8 = c.eff8;
  const fits5 = e5 <= b, fits8 = e8 <= b;
  if (fits5 && fits8) return { p: {}, why: '' };
  if (fits5) return { p: { f5: 2 }, why: `Flex 500 fits your ${money(b)} budget at ${money(e5)} with the top-up, and Flex 800 (${money(e8)}) does not.` };
  if (fits8) return { p: { f8: 2 }, why: `Flex 800 fits your ${money(b)} budget at ${money(e8)}, and Flex 500 with the top-up it needs (${money(e5)}) does not.` };
  return e5 <= e8
    ? { p: { f5: 2 }, why: `Both Flex plans are above your ${money(b)} budget once you reach your Dining Dollar target. Flex 500 is closer at ${money(e5)}.` }
    : { p: { f8: 2 }, why: `Both Flex plans are above your ${money(b)} budget once you reach your Dining Dollar target. Flex 800 is closer at ${money(e8)}.` };
}
const ATH_Q = { id: 'ath', q: 'Beyond training table meals, how many dining hall meals do you need per week?', opts: [
  { label: '2 to 3 a week', sub: 'Mostly weekends and the odd extra.', v: 'ath50' },
  { label: '4 to 5 a week', v: 'ath80' },
  { label: '6 to 7 a week', sub: 'About one extra a day.', v: 'ath120' },
  { label: '8 or more a week', v: 'ath150' }
]};
const RET_QS = [
  { id: 'live', q: 'Where do you live?', opts: [
    { label: 'A residence hall', v: 'hall' },
    { label: 'An on-campus apartment', sub: 'Wolf Village, Wolf Ridge, E.S. King Village or Western Manor.', v: 'apt' },
    { label: 'Off campus', v: 'off' },
    { label: 'A fraternity or sorority house', sub: 'Eligibility for Commuter 900 depends on who owns the house and how many meals it serves.', v: 'greek' }
  ]},
  { id: 'meals', q: 'How many dining hall meals do you want each week?', opts: [
    { label: 'Almost none', sub: 'I mostly cook or eat out.', m: 0 },
    { label: '3 to 4 a week', m: 3.5 },
    { label: '4 to 5 a week', m: 4.7 },
    { label: '5 to 6 a week', m: 5.9 },
    { label: '7 a week', sub: 'About one a day.', m: 7.1 },
    { label: 'Whenever I want', sub: 'Two or more a day, no counting.', m: 14 }
  ]},
  DD_SLIDER,
  MEAL_BUDGET
];
function rankReturning(picks) {
  const live = RET_QS[0].opts[picks[1]].v;
  const m = RET_QS[1].opts[picks[2]].m;
  const d = picks[3];
  const b = picks[4];
  const keys = ['flex500', 'flex800', 'block60', 'block80', 'block100', 'block120'];
  if (live !== 'hall') keys.push('commuter');
  return keys.map(k => {
    const p = MEAL[k];
    const topUp = topUpFor(k, d);                              // Dining Dollars can be added later
    const eff = p.price + topUp;
    const short = Math.max(0, m - p.cap) * 5;                  // dining hall meals cannot be added later
    const excess = Math.max(0, p.cap - m) * (p.cap >= 14 ? 0.6 : 2);
    const ddExcess = Math.max(0, p.dd / WEEKS - d) * 0.5;      // included Dining Dollars you would not spend
    const over = (typeof b === 'number' && eff > b) ? 12 + (eff - b) / 25 : 0;
    return { key: k, topUp, eff, pen: short + excess + ddExcess + (topUp / WEEKS) * 0.03 + eff / 250 + over };
  }).sort((a, c) => a.pen - c.pen);
}

export { MEAL, ddWeek, MATCH_TEMP, WHO_MEAL, DD_SLIDER, MEAL_BUDGET, FY_QS, topUpFor, withTop, fyCosts, ddPoints, budgetPoints, ATH_Q, RET_QS, rankReturning };
