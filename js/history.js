/* Quiz history: the three most recent finished quizzes of each type. */
import { state, profile, ui } from './state.js';
import { money } from './format.js';
import { persist } from './persistence.js';

function answerText(q, v) {
  if (q.type === 'slider') return money(v) + ' a week';
  if (q.type === 'budget') return typeof v === 'number' ? money(v) + ' ' + q.unit : 'No set budget';
  const o = q.opts && q.opts[v]; return o ? o.label : '';
}
/* Keep the three most recent finished quizzes per type. Finishing the same attempt again updates its entry instead of adding one. */
function recordHistory(f) {
  if (!ui.lastSummary) return;
  const kind = state.quiz;
  const list = profile.history[kind] || (profile.history[kind] = []);
  if (!state.attempt) state.attempt = 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const picks = state.picks.slice(0, f.qs.length);
  const sig = JSON.stringify([picks, ui.lastSummary]);
  const idx = list.findIndex(e => e.id === state.attempt);
  if (idx >= 0 && list[idx].sig === sig) return;
  const entry = { id: state.attempt, at: new Date().toISOString(), picks, answers: f.qs.map((q, i) => [q.q, answerText(q, picks[i])]), title: ui.lastSummary.title, lines: ui.lastSummary.lines, sig };
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(entry);
  if (list.length > 3) list.length = 3;
  persist();
}

export { recordHistory };
