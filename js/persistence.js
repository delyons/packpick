/* Saves the profile and quiz history in this browser. */
import { profile, normProfile } from './state.js';

const KEY = 'packpick.profile';
function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) { /* storage can be blocked; the app still works */ } }
export function loadProfile() { return normProfile(read()); }
