/* Everything that draws: screens, transitions, the profile overlay and the toast. */
import { $app } from './dom.js';
import { state, profile, ui, resetState } from './state.js';
import { money, WEEKS } from './format.js';
import { MEAL, withTop, topUpFor } from './data/meal.js';
import { V, H } from './data/housing.js';
import { YEARS, ineligible } from './eligibility.js';
import { getFlow, QUIZZES } from './flow.js';
import { mealResult, housingResult } from './results.js';
import { recordHistory } from './history.js';

/* ================= Rendering ================= */
const reduceMotion = () => { try { return !!(window.__noMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return true; } };

/* Fade the current screen out, swap in the next one, and fade it in from the matching side. */
function navigate(update, dir) {
  if (reduceMotion()) { update(); return; }
  const cur = $app.firstElementChild;
  const enter = () => {
    try {
      update();
      const el = $app.firstElementChild;
      if (el) { el.classList.add('enter', 'go-' + dir); setTimeout(() => el.classList.remove('enter', 'go-next', 'go-prev'), 380); }
    } finally { ui.busy = false; }
  };
  if (!cur) { enter(); return; }
  ui.busy = true;
  cur.classList.add('leave', 'go-' + dir);
  setTimeout(enter, 150);
}
function showToast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  document.getElementById('toast-text').textContent = msg;
  t.setAttribute('aria-hidden', 'false'); t.classList.add('show');
  clearTimeout(ui.toastTimer); ui.toastTimer = setTimeout(hideToast, 3800);
}
function hideToast() {
  const t = document.getElementById('toast'); if (!t) return;
  clearTimeout(ui.toastTimer); t.classList.remove('show'); t.setAttribute('aria-hidden', 'true');
}
function openProfile(from) {
  openOverlay(from, false);
  renderProfile();
  document.getElementById('overlay-close').focus();
}
function openProfileSetup(from) {
  openOverlay(from, true);
  renderProfileSetup();
  document.getElementById('profile-setup-year').focus();
}
function openOverlay(from, setup) {
  ui.lastFocus = from || null; ui.overlayOpen = true; ui.profileSetup = setup;
  const ov = document.getElementById('overlay');
  ov.hidden = false; document.body.style.overflow = 'hidden';
  if (reduceMotion()) ov.classList.add('open');
  else requestAnimationFrame(() => requestAnimationFrame(() => { if (ui.overlayOpen) ov.classList.add('open'); }));
}
function closeProfile(restore) {
  ui.overlayOpen = false; ui.profileSetup = false; ui.profileNotice = '';
  const ov = document.getElementById('overlay');
  ov.classList.remove('open'); document.body.style.overflow = '';
  if (reduceMotion()) ov.hidden = true; else setTimeout(() => { if (!ui.overlayOpen) ov.hidden = true; }, 230);
  if (restore) {
    const back = (ui.lastFocus && document.contains(ui.lastFocus)) ? ui.lastFocus : document.getElementById('profile-btn');
    if (back) back.focus();
  }
}
function home() { resetState(); render(); }
function render() {
  if (state.view === 'home') homeView();
  else {
    const f = getFlow();
    if (f.done && state.step >= f.qs.length) resultView(f); else questionView(f);
  }
  if (ui.overlayOpen) {
    if (ui.profileSetup) renderProfileSetup();
    else renderProfile();
  }
}
function dateLabel(iso) {
  try { const d = new Date(iso); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
}
function historyHtml() {
  const kinds = ['meal', 'housing'].filter(k => profile.history[k] && profile.history[k].length);
  if (!kinds.length) return '';
  return `<section class="history" aria-labelledby="hist-h">
    <div class="history-head"><h2 class="hist-title" id="hist-h">Recent quizzes</h2><button class="btn small ghost" data-clear-history>Clear recent quizzes</button></div>
    <div class="hist-cols">${kinds.map(k => `
      <div class="hist-col"><h4>${QUIZZES[k].name}</h4>
        ${profile.history[k].map((e, i) => `
        <details class="hist"><summary><span class="hist-main">${e.title}</span><span class="hist-date">${dateLabel(e.at)}</span></summary>
          <div class="hist-body">
            <h5>Your responses</h5>
            <dl class="qa">${e.answers.map(a => `<div><dt>${a[0]}</dt><dd>${a[1]}</dd></div>`).join('')}</dl>
            <h5>Result</h5>
            <ul class="notes">${e.lines.map(x => `<li>${x}</li>`).join('')}</ul>
            <button class="btn small ghost" data-reopen="${k}:${i}">Open this result</button>
          </div></details>`).join('')}
      </div>`).join('')}</div>
  </section>`;
}
const quizIcon = kind => kind === 'meal'
  ? '<svg class="quiz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9.5V21M16 3v18M16 3c2 2 3 4.5 3 7v2h-3"/></svg>'
  : '<svg class="quiz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/></svg>';
function homeView() {
  const saved = k => profile[k] ? `<span class="saved">Saved: ${profile[k].name}</span>` : '';
  const yearText = profile.year ? YEARS.find(([y]) => y === profile.year)?.[1] || 'Year set' : 'Year not set';
  const athleteText = profile.athlete == null ? 'Athlete status not set' : profile.athlete ? 'Athlete' : 'Not an athlete';
  const profileStatus = !profile.year || profile.athlete == null
    ? `<div class="warn profile-needed"><span><strong>Profile needed:</strong> choose your year and athlete status before starting a quiz.</span><button class="btn small" data-setup>Set up profile</button></div>`
    : `<div class="saved" style="margin:0 0 14px"><strong>Profile:</strong> ${yearText} · ${athleteText}</div>`;
  $app.innerHTML = `<div class="home">
    <h1>Find your fit on campus.</h1>
    <p class="lede">Short quizzes that match you to a meal plan or a place to live using this year's NC State options. Save your picks to your profile.</p>
    ${profileStatus}
    <div class="picker">
      ${Object.keys(QUIZZES).map(k => `
        <button class="pick" data-start="${k}">
          <span class="meta">${QUIZZES[k].len}</span>
          <h2 class="pick-title">${quizIcon(k)}<span>${QUIZZES[k].name}</span></h2>
          <p>${QUIZZES[k].blurb}</p>
          ${saved(k === 'meal' ? 'meal' : 'housing')}
        </button>`).join('')}
    </div>
    ${historyHtml()}
  </div>`;
}
function questionView(f) {
  if (state.step > f.qs.length - 1) state.step = f.qs.length - 1;
  const q = f.qs[state.step];
  const total = Math.max(f.total, state.step + 1);
  const prevVal = state.picks[state.step];
  let body;
  if (q.type === 'slider') {
    const v = typeof prevVal === 'number' ? prevVal : q.def;
    body = `
      <div class="slider-box">
        <div class="field dd-number-field" style="margin-top:0"><label for="dd-num">Exact amount per week</label>
          <div class="money-input"><span>$</span><input type="number" id="dd-num" inputmode="numeric" min="${q.min}" max="${q.max}" step="1" value="${v}" aria-label="Weekly Dining Dollar budget in dollars"></div></div>
        <input type="range" id="dd-range" min="${q.min}" max="${q.max}" step="${q.step}" value="${v}" aria-label="Weekly Dining Dollar budget">
        <div class="ticks"><span>${money(q.min)}</span><span>${money((q.min + q.max) / 2)}</span><span>${money(q.max)}</span></div>
        <div class="count" id="dd-sem">About ${money(v * WEEKS)} over a ${WEEKS}-week semester</div>
        <div><button class="btn" data-slider>Continue</button></div>
      </div>`;
  } else {
    body = `<div class="opts">${q.opts.map((o, i) => `<button class="opt${prevVal === i ? ' sel' : ''}" data-pick="${i}"${prevVal === i ? ' aria-pressed="true"' : ''}><b>${o.label}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</button>`).join('')}</div>`;
  }
  $app.innerHTML = `
    <div class="panel">
      <div class="top quiz-top">
        <span aria-hidden="true"></span>
        <div class="progress" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('')}</div>
        <span class="count">${state.step + 1} / ${total}</span>
      </div>
      ${q.lead ? `<p class="lead">${q.lead}</p>` : ''}
      <h2 class="q">${q.q}</h2>
      ${q.sub ? `<p class="sub">${q.sub}</p>` : ''}
      ${body}
      <div class="actions quiz-navigation">
        ${state.step > 0 ? '<button class="btn ghost" data-back>Back</button>' : ''}
        <button class="btn ghost" data-home>All quizzes</button>
      </div>
    </div>`;
}
function resultView(f) {
  const isMeal = state.quiz === 'meal';
  const content = isMeal ? mealResult() : housingResult(f);
  recordHistory(f);
  $app.innerHTML = `
    <div class="panel">
      <div class="top"><span class="count">${QUIZZES[state.quiz].name} result</span></div>
      ${content}
      <div class="actions">
        <button class="btn ghost" data-back>Back</button>
        <button class="btn ghost" data-other>Try the ${isMeal ? 'housing' : 'meal plan'} quiz</button>
        ${(profile.meal || profile.housing) ? '<button class="btn ghost" data-profile>View my profile</button>' : ''}
        <button class="btn ghost" data-home>All quizzes</button>
      </div>
    </div>`;
}
function renderProfile() {
  const body = document.getElementById('overlay-body'); if (!body) return;
  const dialog = document.getElementById('dialog');
  dialog.classList.add('profile-dialog');
  dialog.classList.remove('setup-dialog');
  document.getElementById('profile-title').textContent = 'Your Profile';
  document.getElementById('overlay-close').setAttribute('aria-label', 'Close profile');
  const m = profile.meal, h = profile.housing;
  const when = x => x.savedAt ? new Date(x.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const src = x => (x.source === 'manual' ? 'chosen by you' : 'from quiz') + (x.savedAt ? ' · ' + when(x) : '');
  const hideAth = (kind, k, cur) => kind === 'meal' && k.indexOf('ath') === 0 && profile.athlete !== true && cur !== k;   // athletic plans show only once you say you are a roster athlete
  const options = (groups, cur, kind, label) => '<option value="">Choose one</option>' + groups.map(g => [g[0], g[1].filter(k => !ineligible(kind, k) && !hideAth(kind, k, cur))]).filter(g => g[1].length).map(g =>
    `<optgroup label="${g[0]}">${g[1].map(k => `<option value="${k}"${cur === k ? ' selected' : ''}>${label(k)}</option>`).join('')}</optgroup>`).join('');
  const mealGroups = [['Flex plans', ['flex500', 'flex800']], ['Block plans', ['block60', 'block80', 'block100', 'block120']], ['Commuter', ['commuter']], ['Athletic plans', ['ath50', 'ath80', 'ath120', 'ath150']]];
  const houseGroups = [['Residence halls and apartments', ['general', 'hall', 'wolfvillage', 'wolfridge', 'esking', 'westernmanor']], ['Off campus', ['apartment', 'athome']], ['Living and learning villages', Object.keys(V)]];
  const mp = m && MEAL[m.key], hp = h && H[h.key];
  const dd = m && typeof m.dd === 'number' ? m.dd : null;
  const need = m ? topUpFor(m.key, dd) : 0;
  const known = !!profile.year || profile.athlete != null;
  const athVal = profile.athlete === true ? 'yes' : profile.athlete === false ? 'no' : '';
  const firstNote = profile.year === 'first' && profile.athlete
    ? 'First-year athletes can pick a Flex plan or an athletic plan. Ask NC State Dining whether an athletic plan can stand in for Flex in your first year.' : '';
  const aboutCard = `
    <div class="pcard">
      <span class="eyebrow">About you</span>
      <div class="field" style="margin-top:6px"><label for="profile-year">Year</label>
        <select id="profile-year" data-field="year"><option value="">Choose one</option>${YEARS.map(y => `<option value="${y[0]}"${profile.year === y[0] ? ' selected' : ''}>${y[1]}</option>`).join('')}</select></div>
      <div class="field"><label for="profile-athlete">Roster athlete</label>
        <select id="profile-athlete" data-field="athlete"><option value=""${athVal === '' ? ' selected' : ''}>Choose one</option><option value="yes"${athVal === 'yes' ? ' selected' : ''}>Yes</option><option value="no"${athVal === 'no' ? ' selected' : ''}>No</option></select></div>
      <p class="hint">${known ? 'The meal plans and housing below are limited to what is open to you.' : 'Choose your year and athlete status to see only the plans and housing open to you.'}${firstNote ? ' ' + firstNote : ''}</p>
    </div>`;
  const selectionCards = `
    <div class="pcards profile-columns">
      <div class="pcard">
        <span class="eyebrow profile-quiz-title">${quizIcon('meal')}<span>Meal plan${m ? ' · ' + src(m) : ''}</span></span>
        <h3>${m ? withTop(m.key, dd) : 'Not chosen yet'}</h3>
        <p>${mp ? `${money(mp.price)} per semester plus tax. ${mp.meals}. ${mp.dd} Dining Dollars included, about ${money(mp.dd / WEEKS)} a week.` : 'Take the quiz for a recommendation, or pick a plan yourself.'}${mp && need > 0 ? ` Top up ${money(need)} in Dining Dollars to reach ${money(dd)} a week, for about ${money(mp.price + need)} a semester in total.` : ''}${mp && dd !== null && need === 0 ? ` The Dining Dollars included already cover your ${money(dd)} a week.` : ''}</p>
        ${m ? `<div class="field" style="margin-top:0"><label for="profile-dd">Weekly Dining Dollars you want</label>
          <div class="money-input"><span>$</span><input id="profile-dd" data-field="mealdd" type="number" inputmode="numeric" min="10" max="150" step="1" value="${dd === null ? '' : dd}" aria-label="Weekly Dining Dollars you want"></div></div>
        <p class="hint">${dd === null ? 'Set a weekly amount to see how much to top up.' : 'Dining Dollars can be added through the One Card portal. Dining hall meals cannot.'}</p>` : ''}
        <div class="field"><label for="manual-meal">${m ? 'Change plan' : 'Pick a plan yourself'}</label>
          <select id="manual-meal" data-manual="meal">${options(mealGroups, m && m.key, 'meal', k => MEAL[k].name + ' · ' + money(MEAL[k].price))}</select></div>
        <p class="hint meal-plan-hint">Flex 500 and 800 are required for first-years living on campus. Athletic plans are for roster athletes. Commuter 900 is for off-campus and apartment residents.</p>
        <div class="actions" style="margin-top:12px"><button class="btn small ghost quiz-action" data-start="meal">${m ? 'Retake quiz' : 'Take the quiz'}</button>${m ? '<button class="btn small ghost" data-remove="meal">Remove</button>' : ''}</div>
      </div>
      <div class="pcard">
        <span class="eyebrow profile-quiz-title">${quizIcon('housing')}<span>Housing${h ? ' · ' + src(h) : ''}</span></span>
        <h3>${h ? h.name : 'Not chosen yet'}</h3>
        <p>${hp ? hp.line : 'Take the quiz for a recommendation, or pick a place yourself.'}</p>
        <div class="field"><label for="manual-housing">${h ? 'Change housing' : 'Pick housing yourself'}</label>
          <select id="manual-housing" data-manual="housing">${options(houseGroups, h && h.key, 'housing', k => H[k].name)}</select></div>
        <div class="actions" style="margin-top:12px"><button class="btn small ghost quiz-action" data-start="housing">${h ? 'Retake quiz' : 'Take the quiz'}</button>${h ? '<button class="btn small ghost" data-remove="housing">Remove</button>' : ''}</div>
      </div>
    </div>`;

  body.innerHTML = `
    ${ui.profileNotice ? `<p class="warn" style="margin:0 0 14px">${ui.profileNotice}</p>` : ''}
    <p class="res-sub" style="margin:0 0 18px">Tell us a bit about you, then keep your picks from the quizzes or choose your own.</p>
    <div class="profile-layout">
      ${aboutCard}
      ${selectionCards}
    </div>
    <p class="hint" style="margin-top:14px">Saved in this browser.</p>`;
}

function renderProfileSetup() {
  const dialog = document.getElementById('dialog');
  const body = document.getElementById('overlay-body');
  if (!body) return;
  dialog.classList.remove('profile-dialog');
  dialog.classList.add('setup-dialog');
  document.getElementById('profile-title').textContent = 'Set up your profile';
  document.getElementById('overlay-close').setAttribute('aria-label', 'Close setup');
  const athlete = profile.athlete === true ? 'yes' : profile.athlete === false ? 'no' : '';
  body.innerHTML = `
    <p class="res-sub setup-intro">Choose your year and athlete status to personalize your quiz recommendations.</p>
    <div class="setup-fields">
      <div class="field"><label for="profile-setup-year">Current year</label>
        <select id="profile-setup-year" data-field="year"><option value="">Choose your year</option>${YEARS.map(y => `<option value="${y[0]}"${profile.year === y[0] ? ' selected' : ''}>${y[1]}</option>`).join('')}</select></div>
      <div class="field"><label for="profile-setup-athlete">Are you a roster athlete?</label>
        <select id="profile-setup-athlete" data-field="athlete"><option value=""${athlete === '' ? ' selected' : ''}>Choose yes or no</option><option value="yes"${athlete === 'yes' ? ' selected' : ''}>Yes</option><option value="no"${athlete === 'no' ? ' selected' : ''}>No</option></select></div>
    </div>
    ${ui.profileNotice ? `<p class="warn">${ui.profileNotice}</p>` : ''}
    <div class="actions setup-actions"><button class="btn" data-setup-continue>Continue</button></div>`;
}

export { navigate, showToast, hideToast, openProfile, openProfileSetup, closeProfile, home, render };
