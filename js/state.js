/* Shared, mutable app state: where the visitor is in a quiz, their profile, and small UI flags. */

export const state = { view: 'home', quiz: null, step: 0, picks: [], attempt: null };
export const normHist = h => ({ meal: (h && Array.isArray(h.meal)) ? h.meal.slice(0, 3) : [], housing: (h && Array.isArray(h.housing)) ? h.housing.slice(0, 3) : [] });
export const normProfile = x => ({ meal: (x && x.meal) || null, housing: (x && x.housing) || null, year: (x && x.year) || null, athlete: (x && x.athlete != null) ? !!x.athlete : null, history: normHist(x && x.history) });
export const profile = normProfile(null);   // one shared object, updated in place so every module sees changes
export function setProfile(x) { Object.assign(profile, normProfile(x)); }
export const ui = { profileNotice: '', lastSummary: null, overlayOpen: false, lastFocus: null, busy: false, toastTimer: null };

export function resetState() { state.view = 'home'; state.quiz = null; state.step = 0; state.picks = []; state.attempt = null; }
export function resetQuiz(k) { state.view = 'quiz'; state.quiz = k; state.step = 0; state.picks = []; state.attempt = null; }
