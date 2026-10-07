/* Saving a choice to the profile, from a quiz result or from the profile dropdowns. */
import { state, profile } from './state.js';
import { persist } from './persistence.js';
import { MEAL, withTop } from './data/meal.js';
import { H } from './data/housing.js';
import { ineligible } from './eligibility.js';
import { render, showToast } from './views.js';

function quizDD() {
  if (state.quiz !== 'meal') return null;
  const who = profile.athlete === true ? 'athlete' : profile.year === 'first' ? 'first' : 'returning';
  const v = who === 'first' ? state.picks[0] : who === 'returning' ? state.picks[2] : null;
  return typeof v === 'number' ? v : null;
}
function saveOutcome(kind, key) {
  if (ineligible(kind, key)) return;
  const name = kind === 'meal' ? MEAL[key].name : H[key].name;
  const entry = { key, name, source: 'quiz', savedAt: new Date().toISOString() };
  if (kind === 'meal') entry.dd = quizDD();
  profile[kind] = entry;
  persist(); render();
  showToast('Saved ' + (kind === 'meal' ? withTop(key, entry.dd) : name) + ' to your profile.');
}

function saveManual(kind, key) {
  if (ineligible(kind, key)) return;
  const name = kind === 'meal' ? (MEAL[key] && MEAL[key].name) : (H[key] && H[key].name);
  if (!name) return;
  const entry = { key, name, source: 'manual', savedAt: new Date().toISOString() };
  if (kind === 'meal') entry.dd = (profile.meal && typeof profile.meal.dd === 'number') ? profile.meal.dd : null;
  profile[kind] = entry;
  persist();
}

export { saveOutcome, saveManual };
