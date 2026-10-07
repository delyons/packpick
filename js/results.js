/* Builds the result screens (HTML strings) for both quizzes and keeps a plain-text summary for quiz history. */
import { state, profile, ui } from './state.js';
import { money, WEEKS } from './format.js';
import { MEAL, ddWeek, MATCH_TEMP, WHO_MEAL, FY_QS, ATH_Q, RET_QS, topUpFor, withTop, fyCosts, ddPoints, budgetPoints, rankReturning } from './data/meal.js';
import { V, H, costOf, range } from './data/housing.js';
import { ineligible } from './eligibility.js';

const isSaved = (kind, key) => profile[kind] && profile[kind].key === key;
const saveBtn = (kind, key, small) => {
  if (isSaved(kind, key)) return `<span class="btn ${small ? 'small' : ''} done">Saved to profile</span>`;
  const why = ineligible(kind, key);
  if (why) return `<span class="badge over">${why}</span>`;
  return `<button class="btn ${small ? 'small' : ''}" data-save="${kind}:${key}">Save to my profile</button>`;
};
function budgetTag(price, b) {
  if (typeof b !== 'number') return '';
  return price <= b ? '<span class="badge ok">Within budget</span>' : `<span class="badge over">${money(price - b)} over budget</span>`;
}
function planRow(key, o) {
  const p = MEAL[key]; const w = ddWeek(key);
  const need = topUpFor(key, o.dd); const eff = p.price + need;
  return `<div class="plan ${o.win ? 'win' : ''}">
    <div class="plan-head"><span class="nm"><b>${p.name}${need > 0 ? ' + ' + money(need) + ' top up' : ''}</b>${o.bar != null ? `<span class="pct">${o.bar}% match</span>` : ''}</span><span class="price">${money(p.price)} / semester</span></div>
    ${o.bar != null ? `<div class="bar"><i style="width:${o.bar}%"></i></div>` : ''}
    <small>${[o.badge ? `<span class="badge">${o.badge}</span>` : '', budgetTag(eff, o.budget)].filter(Boolean).map(x => x + ' · ').join('')}${p.meals}</small>
    <small>${p.dd} Dining Dollars included, about ${money(w)} a week${p.extra ? ' · ' + p.extra : ''}</small>
    ${need > 0 ? `<small>Plan ${money(p.price)} + ${money(need)} in Dining Dollars = about ${money(eff)} a semester, reaching ${money(o.dd)} a week.</small>` : ''}
    <div class="plan-foot"><span></span>${saveBtn('meal', key, true)}</div>
  </div>`;
}
const MEAL_NOTES = [
  'Dining Dollars give 5% off at restaurants, cafés and markets, and 50¢ off dining hall meals. They carry from fall to spring and then expire.',
  'Prices are per semester plus NC sales tax. Dining hall meals do not roll over.',
  'You can add Dining Dollars during the semester through the <a href="https://onecard.ncsu.edu/meal-plan/" target="_blank" rel="noopener">One Card portal</a>. Dining hall meals cannot be added.'
];
function mealResult() {
  const who = WHO_MEAL.opts[state.picks[0]].v;
  const hasB = x => typeof x === 'number';
  const SCHOLAR = ' If you are experiencing food insecurity and cannot afford a meal plan, you may qualify for a <a href="https://go.ncsu.edu/pack-essentials" target="_blank" rel="noopener">meal plan scholarship</a>.';
  if (who === 'athlete') {
    const key = ATH_Q.opts[state.picks[1]].v; const p = MEAL[key]; const b = state.picks[2];
    const over = hasB(b) && p.price > b;
    const cheaper = over ? ['ath50', 'ath80', 'ath120', 'ath150'].filter(k => k !== key && MEAL[k].price <= b).sort((x, y) => MEAL[y].price - MEAL[x].price).slice(0, 2) : [];
    ui.lastSummary = { title: p.name, lines: [`${p.name} · ${money(p.price)} a semester`, p.meals].concat(over ? [`${money(p.price - b)} over your ${money(b)} budget`] : []).concat(cheaper.length ? ['Within your budget: ' + cheaper.map(k => MEAL[k].name).join(', ')] : []) };
    return `
      <p class="eyebrow">Your match</p>
      <h2 class="res-title">${p.name}</h2>
      <p class="res-sub">${p.meals} on top of the training table meals from NC State Athletics, plus ${p.dd} Dining Dollars.</p>
      <div class="plans">${planRow(key, { win: true, budget: b })}</div>
      ${over ? `<p class="warn">This plan is ${money(p.price - b)} over your ${money(b)} budget.${cheaper.length ? ' These athletic plans fit it.' : ' Every athletic plan costs more than your budget, and Athletic 50 is the lowest at ' + money(MEAL.ath50.price) + '.'}${cheaper.length ? '' : SCHOLAR}</p>` : ''}
      ${cheaper.length ? `<h4>Within your budget</h4><div class="plans">${cheaper.map(k => planRow(k, { budget: b })).join('')}</div>` : ''}
      <h4>Good to know</h4>
      <ul class="notes"><li>Athletic plans are priced for a 17-week semester, before sales tax.</li><li>${MEAL_NOTES[0]}</li><li>${MEAL_NOTES[2]}</li><li>If you are enrolled in fall you are auto-enrolled for spring unless you change or cancel by the deadline.</li></ul>`;
  }
  if (who === 'first') {
    let s5 = 0, s8 = 0; const w5 = [], w8 = []; const d = state.picks[1]; const b = state.picks[2];
    FY_QS.forEach((q, i) => {
      const pick = state.picks[i + 1];
      const x = q.type === 'slider' ? ddPoints(pick) : budgetPoints(pick, d);
      s5 += x.p.f5 || 0; s8 += x.p.f8 || 0;
      if ((x.p.f5 || 0) > (x.p.f8 || 0)) w5.push(x.why);
      if ((x.p.f8 || 0) > (x.p.f5 || 0)) w8.push(x.why);
    });
    const p5 = Math.round(100 * (s5 + 1) / (s5 + s8 + 2)), p8 = 100 - p5;
    const win8 = s8 > s5, tie = s8 === s5; const reasons = win8 ? w8 : w5; const close = Math.abs(s8 - s5) <= 1;
    const fc = fyCosts(d);
    const allOver = hasB(b) && b < Math.min(fc.eff5, fc.eff8);
    const title = tie ? 'Either plan works' : withTop(win8 ? 'flex800' : 'flex500', d);
    ui.lastSummary = { title, lines: [['flex500', p5], ['flex800', p8]].map(x => `${withTop(x[0], d)} · ${x[1]}% match · about ${money(MEAL[x[0]].price + topUpFor(x[0], d))} a semester`) };
    return `
      <p class="eyebrow">${close ? 'Close call' : 'Your match'}</p>
      <h2 class="res-title">${title}</h2>
      <p class="res-sub">First-years living on campus choose between these two, and this match is based on how many Dining Dollars you want each week. Both plans include all-day dining hall access and one takeout meal a day. Flex 800 costs $246 more per semester for 300 more Dining Dollars and one more guest meal.</p>
      <div class="plans">${planRow('flex500', { win: !win8 || tie, bar: p5, budget: b, dd: d })}${planRow('flex800', { win: win8 || tie, bar: p8, budget: b, dd: d })}</div>
      ${allOver ? `<p class="warn">Both Flex plans cost more than your ${money(b)} budget once you reach your Dining Dollar target, and first-years living on campus must pick one.${SCHOLAR}</p>` : ''}
      ${reasons.length ? `<h4>Why</h4><ul class="notes">${reasons.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <h4>Good to know</h4><ul class="notes">${MEAL_NOTES.map(x => `<li>${x}</li>`).join('')}</ul>`;
  }
  const ranked = rankReturning(state.picks); const d = state.picks[3]; const b = state.picks[4];
  const live = RET_QS[0].opts[state.picks[1]].v;
  const top = ranked.slice(0, 3);
  const wts = top.map(t => Math.exp(-(t.pen - top[0].pen) / MATCH_TEMP));
  const tot = wts.reduce((a, c) => a + c, 0);
  const pcts = wts.map(w => Math.max(3, Math.round(100 * w / tot)));
  pcts[0] += 100 - pcts.reduce((a, c) => a + c, 0);
  const t0 = ranked[0]; const p0 = MEAL[t0.key];
  const allOver = hasB(b) && ranked.every(t => t.eff > b);
  const cheapest = ranked.slice().sort((x, y) => x.eff - y.eff)[0];
  const flexBest = ranked.filter(t => t.key.indexOf('flex') === 0).sort((x, y) => x.eff - y.eff)[0];
  const save = t0.key.indexOf('flex') === 0 ? 0 : flexBest.eff - t0.eff;
  const why = [];
  if (save > 0) why.push(`This costs about ${money(save)} less per semester than the cheapest Flex plan, even after topping up Dining Dollars to your target.`);
  if (t0.topUp > 0 && t0.key.indexOf('flex') !== 0 && t0.key !== 'commuter') why.push('Dining hall meals cannot be added later, so this plan has enough of them for how often you eat in the halls. Dining Dollars can be topped up, so the extra spending comes from there.');
  const sub = t0.topUp > 0
    ? `${p0.meals}. It includes about ${money(ddWeek(t0.key))} a week in Dining Dollars, and topping up ${money(t0.topUp)} gets you to your ${money(d)} a week target, for about ${money(t0.eff)} a semester in total.`
    : `${p0.meals}. It includes about ${money(ddWeek(t0.key))} a week in Dining Dollars, which covers your ${money(d)} a week target.`;
  ui.lastSummary = { title: withTop(t0.key, d), lines: top.map((t, i) => `${withTop(t.key, d)} · ${pcts[i]}% match · about ${money(t.eff)} a semester`) };
  return `
    <p class="eyebrow">Your best match · ${pcts[0]}%</p>
    <h2 class="res-title">${withTop(t0.key, d)}</h2>
    <p class="res-sub">${sub}</p>
    <div class="plans">${top.map((t, i) => planRow(t.key, { win: i === 0, bar: pcts[i], budget: b, dd: d, badge: i === 0 ? 'Best match' : 'Also consider' })).join('')}</div>
    ${allOver ? `<p class="warn">No plan available to you fits ${money(b)} once you reach your Dining Dollar target. ${MEAL[cheapest.key].name} is the lowest at about ${money(cheapest.eff)} including the top-up.${SCHOLAR}</p>` : ''}
    ${why.length ? `<h4>Why</h4><ul class="notes">${why.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
    <h4>Good to know</h4>
    <ul class="notes">
      ${MEAL_NOTES.map(x => `<li>${x}</li>`).join('')}
      <li>Plans are compared by plan price plus the Dining Dollar top-up needed to reach your weekly target. Weekly figures divide each plan's Dining Dollars across a ${WEEKS}-week semester, and top-ups are rounded up to the next $5.</li>
      <li>Match percentages compare these three plans against your answers${hasB(b) ? ' and budget' : ''} and add up to 100%.</li>
      ${live === 'hall' ? '<li>Commuter 900 is not offered for residence hall residents, so it is left out.</li>' : ''}
      ${live === 'greek' ? '<li>Commuter 900 is open to non-university-owned fraternity and sorority houses, or university-owned Greek housing with at least ten hot meals a week. Check your house before choosing it.</li>' : ''}
    </ul>`;
}
function housingResult(f) {
  const h = H[f.result]; const c = costOf(f.result); const b = f.budget; const hasB = typeof b === 'number';
  const facts = h.facts.slice();
  let costText;
  if (f.result === 'athome') costText = 'No NC State housing charge. Count gas, parking and other commuting costs.';
  else if (c) costText = `${range(c)} per semester, including the $150 ResNet fee. These are 2026-27 projected rates.${(V[f.result] || f.result === 'general') ? ' The price depends on the building you are assigned to.' : ''}`;
  else costText = 'Set by each landlord, so compare listings.';
  facts.push(['Cost', costText]);
  let box = ''; let msg = ''; let altNames = [];
  if (hasB) {
    if (!c) msg = `Private rents vary. Compare each listing against your ${money(b)} budget per semester.`;
    else if (b >= c[1]) msg = `This fits your ${money(b)} budget at any price in the range.`;
    else if (b >= c[0]) msg = `This fits your ${money(b)} budget at the lower end of the range. Higher-priced rooms run up to ${money(c[1] - b)} over.`;
    else msg = `This is at least ${money(c[0] - b)} over your ${money(b)} budget.`;
    box = `<p class="warn budget-note"><b>Budget.</b> ${msg}</p>`;
    if (c && b < c[0]) {
      const pool = ['hall', 'esking', 'westernmanor', 'wolfvillage', 'wolfridge', 'athome']
        .filter(k => k !== f.result && !ineligible('housing', k) && costOf(k) && costOf(k)[0] <= b)
        .sort((x, y) => costOf(y)[0] - costOf(x)[0]).slice(0, 2);
      altNames = pool.map(k => H[k].name);
      if (pool.length) {
        box += `<h4>Within your budget instead</h4><div class="plans">${pool.map(k => `
          <div class="plan"><div class="plan-head"><b>${H[k].name}</b><span class="price">${range(costOf(k))} / semester</span></div>
          <small>${H[k].line}</small><div class="plan-foot"><span></span>${saveBtn('housing', k, true)}</div></div>`).join('')}</div>`;
      } else {
        box += `<p class="warn">Nothing on NC State's housing list fits ${money(b)} per semester. Living at home or comparing private apartments may get closer.</p>`;
      }
    }
  }
  ui.lastSummary = { title: h.name, lines: [h.line, 'Cost: ' + costText].concat(msg ? [msg] : []).concat(altNames.length ? ['Within your budget instead: ' + altNames.join(', ')] : []) };
  return `
    <p class="eyebrow">Your match</p>
    <h2 class="res-title">${h.name}</h2>
    <p class="res-sub">${h.line}</p>
    <dl class="facts">${facts.map(x => `<div><dt>${x[0]}</dt><dd>${x[1]}</dd></div>`).join('')}</dl>
    ${h.warn ? `<p class="warn">${h.warn}</p>` : ''}
    ${box}
    ${h.notes.length ? `<h4>Good to know</h4><ul class="notes">${h.notes.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
    <div class="actions">${saveBtn('housing', f.result)}</div>`;
}

export { mealResult, housingResult };
