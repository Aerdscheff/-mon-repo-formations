export const SCORE_KEY = 'aerdscheff:scores:v1';
export function loadScores(){ try{ return JSON.parse(localStorage.getItem(SCORE_KEY))||{} } catch { return {} } }
export function getScore(pack){ const d = loadScores(); return d[pack]?.value ?? null }
export function saveScore(pack, value){
  const d = loadScores();
  d[pack] = { value, date: new Date().toISOString() };
  localStorage.setItem(SCORE_KEY, JSON.stringify(d));
}