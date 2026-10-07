/* Which meal plans and housing a profile (year, athlete) is allowed to choose. */
import { profile } from './state.js';

const YEARS = [['first', 'First-year'], ['sophomore', 'Sophomore'], ['junior', 'Junior'], ['senior', 'Senior'], ['transfer', 'Transfer student']];
const VILLAGE_YEARS = { eng: ['first'], expl: ['first'], say: ['first'], thrive: ['first'], albright: ['sophomore', 'junior', 'senior', 'transfer'], centennial: ['sophomore', 'transfer'], transfer: ['transfer'] };
const VILLAGE_MSG = { eng: 'Built for first-years.', expl: 'Built for first-years.', say: 'Built for first-years.', thrive: 'Built for first-years.', albright: 'For returning and transfer students.', centennial: 'For sophomores and transfer students.', transfer: 'For transfer students.' };
/* Returns a short reason when the profile (year, athlete) rules a choice out, otherwise an empty string. */
function ineligible(kind, key) {
  const y = profile.year, first = y === 'first';
  if (kind === 'meal') {
    if (key.indexOf('ath') === 0 && profile.athlete === false) return 'Athletic plans are for roster athletes.';
    if (first && key.indexOf('flex') !== 0 && key.indexOf('ath') !== 0) return 'First-years choose Flex 500 or Flex 800.';
    return '';
  }
  if (!y) return '';
  if (first) {
    if (['wolfridge', 'esking', 'westernmanor', 'apartment', 'athome'].indexOf(key) >= 0) return 'First-years live in a hall, Wolf Village or a first-year village.';
    if (VILLAGE_YEARS[key] && VILLAGE_YEARS[key].indexOf('first') < 0) return 'Not open to first-years.';
    return '';
  }
  if (key === 'general') return 'The general application is for incoming first-years.';
  if (VILLAGE_YEARS[key] && VILLAGE_YEARS[key].indexOf(y) < 0) return VILLAGE_MSG[key] || 'Not open to your year.';
  return '';
}

export { YEARS, ineligible };
