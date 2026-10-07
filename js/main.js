/* Entry point: wires up clicks, dropdown changes and the keyboard, then shows the home screen. */
import { $app } from './dom.js';
import { state, profile, ui, resetState, resetQuiz, setProfile } from './state.js';
import { money, WEEKS } from './format.js';
import { getFlow } from './flow.js';
import { ineligible } from './eligibility.js';
import { persist, loadProfile } from './persistence.js';
import { navigate, render, home, openProfile, openProfileSetup, closeProfile, hideToast } from './views.js';
import { saveOutcome, saveManual } from './actions.js';

let pendingQuiz = null;

function historyPicks(kind, entry) {
  const picks = entry.picks.slice();
  const firstQuestion = entry.answers && entry.answers[0] && entry.answers[0][0];
  if (kind === 'meal' && firstQuestion === 'Which one describes you?') {
    const branch = picks.shift();
    return branch === 2 ? picks.slice(0, 3) : picks.slice(0, 1);
  }
  if (kind === 'housing' && firstQuestion === 'Where are you in your NC State journey?') {
    const year = picks.shift();
    if (year !== 0) picks.pop();
  }
  return picks;
}

$app.addEventListener('input', e => {
  if (e.target.id === 'dd-range') {
    const v = +e.target.value;
    document.getElementById('dd-num').value = v;
    document.getElementById('dd-sem').textContent = 'About ' + money(v * WEEKS) + ' over a ' + WEEKS + '-week semester';
  } else if (e.target.id === 'dd-num') {
    const num = e.target, v = Number(num.value), r = document.getElementById('dd-range');
    if (num.value !== '' && num.checkValidity()) {
      r.value = v;
      document.getElementById('dd-sem').textContent = 'About ' + money(v * WEEKS) + ' over a ' + WEEKS + '-week semester';
    }
  }
});
document.addEventListener('click', e => {
  if (e.target.id === 'overlay') { pendingQuiz = null; closeProfile(true); return; }
  const t = e.target.closest('button'); if (!t) return;
  if (t.hasAttribute('data-close')) { pendingQuiz = null; closeProfile(true); return; }
  if (t.hasAttribute('data-setup-continue')) {
    if (!profile.year) { document.getElementById('profile-setup-year').focus(); return; }
    if (profile.athlete == null) { document.getElementById('profile-setup-athlete').focus(); return; }
    const quiz = pendingQuiz;
    pendingQuiz = null;
    closeProfile(false);
    if (quiz) {
      resetQuiz(quiz);
      navigate(() => { render(); window.scrollTo({ top: 0 }); }, 'next');
    } else {
      home();
    }
    return;
  }
  if (t.hasAttribute('data-setup')) { hideToast(); pendingQuiz = null; openProfileSetup(t); return; }
  if (t.hasAttribute('data-profile')) { hideToast(); openProfile(t); return; }
  if (t.hasAttribute('data-clear-history')) {
    if (!window.confirm('Clear all recent meal and housing quizzes? This cannot be undone.')) return;
    profile.history.meal = [];
    profile.history.housing = [];
    persist();
    render();
    return;
  }
  if (t.dataset.remove) { profile[t.dataset.remove] = null; persist(); render(); return; }
  if (t.dataset.save) { const sv = t.dataset.save.split(':'); saveOutcome(sv[0], sv[1]); return; }
  if (ui.busy) return;
  let dir = 'next';
  if (t.dataset.start) {
    if (!profile.year || profile.athlete == null) { pendingQuiz = t.dataset.start; openProfileSetup(t); return; }
    if (ui.overlayOpen) closeProfile(false);
    resetQuiz(t.dataset.start);
    navigate(() => { render(); window.scrollTo({ top: 0 }); }, dir);
    return;
  }
  else if (t.hasAttribute('data-home')) {
    const alreadyHome = state.view === 'home';
    dir = 'prev';
    resetState();
    if (alreadyHome) { render(); window.scrollTo({ top: 0 }); return; }
  }
  else if (t.dataset.pick != null) {
    const i = +t.dataset.pick;
    if (state.picks[state.step] !== i) state.picks = state.picks.slice(0, state.step);   // a different answer can change the questions that follow
    state.picks[state.step] = i; state.step++;
  }
  else if (t.hasAttribute('data-slider')) {
    const inp = document.getElementById('dd-num');
    if (!inp.checkValidity() || inp.value === '') { inp.reportValidity(); inp.focus(); return; }
    state.picks[state.step] = +inp.value; state.step++;
  }
  else if (t.hasAttribute('data-back')) { dir = 'prev'; state.step = Math.max(0, state.step - 1); }
  else if (t.hasAttribute('data-other')) resetQuiz(state.quiz === 'meal' ? 'housing' : 'meal');
  else if (t.dataset.reopen) {
    const ro = t.dataset.reopen.split(':'); const en = (profile.history[ro[0]] || [])[+ro[1]]; if (!en) return;
    state.view = 'quiz'; state.quiz = ro[0]; state.picks = historyPicks(ro[0], en); state.attempt = en.id;
    const fl = getFlow(); state.step = fl.done ? fl.qs.length : 0;
  }
  else return;
  navigate(() => { render(); window.scrollTo({ top: 0 }); }, dir);
});
document.addEventListener('change', e => {
  const fld = e.target.closest ? e.target.closest('[data-field]') : null;
  if (fld) {
    const v = fld.value, id = fld.id;
    if (fld.dataset.field === 'mealdd') {
      if (v !== '' && !fld.checkValidity()) { fld.reportValidity(); return; }
      if (profile.meal) profile.meal.dd = v ? +v : null;
      persist(); render(); const a0 = document.getElementById(id); if (a0) a0.focus(); return;
    }
    if (fld.tagName !== 'SELECT') return;
    if (fld.dataset.field === 'year') profile.year = v || null; else profile.athlete = v === 'yes' ? true : v === 'no' ? false : null;
    const dropped = [];
    ['meal', 'housing'].forEach(k => { if (profile[k] && ineligible(k, profile[k].key)) { dropped.push(profile[k].name); profile[k] = null; } });
    ui.profileNotice = dropped.length ? 'Removed ' + dropped.join(' and ') + ' because it is not open to your year or athlete status.' : '';
    persist(); render();
    const again0 = document.getElementById(id); if (again0) again0.focus();
    return;
  }
  const sel = e.target.closest ? e.target.closest('select[data-manual]') : null; if (!sel) return;
  const kind = sel.dataset.manual, id = sel.id;
  ui.profileNotice = '';
  if (sel.value) saveManual(kind, sel.value); else { profile[kind] = null; persist(); }
  render();
  const again = document.getElementById(id); if (again) again.focus();
});
document.addEventListener('keydown', e => {
  if (!ui.overlayOpen) return;
  if (e.key === 'Escape') { pendingQuiz = null; closeProfile(true); return; }
  if (e.key !== 'Tab') return;
  const f = Array.from(document.getElementById('dialog').querySelectorAll('button, select, [href]'));
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

setProfile(loadProfile());
home();
