export const STOPS = [
  { id:'earth', name:'Earth', subtitle:'Our blue home', color:'#84c8ba', question:'What makes day turn into night?', note:'Earth spins. The side facing the Sun has daytime; the side facing away has night. One full turn takes about 24 hours.', source:'https://spaceplace.nasa.gov/seasons/en/', sourceLabel:'NASA Space Place · Earth’s spin and tilt', badge:'Day & night', x:0.25, y:0.58 },
  { id:'moon', name:'Moon', subtitle:'A giant leap', color:'#d9d7cf', question:'Could you jump higher on the Moon?', note:'The Moon’s surface gravity is about one-sixth of Earth’s. With the same take-off speed, you would jump about six times as high in this simplified model.', source:'https://science.nasa.gov/moon/facts/', sourceLabel:'NASA Science · Moon facts', badge:'Gravity explorer', x:0.54, y:0.27 },
  { id:'mars', name:'Mars', subtitle:'The rusty planet', color:'#ed956f', question:'Why is the Red Planet red?', note:'Iron minerals in Martian dust have oxidised: a chemical change that makes rust. This gives much of the surface its reddish colour.', source:'https://science.nasa.gov/mars/facts/', sourceLabel:'NASA Science · Mars facts', badge:'Planet detective', x:0.81, y:0.57 }
];
export const STORAGE_KEY = 'almanac.expedition.v1';
export function readProgress(storage) {
  try { const value = JSON.parse(storage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? [...new Set(value.filter(id => STOPS.some(s => s.id === id)))] : []; }
  catch { return []; }
}
export function saveProgress(storage, ids) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(ids)); return true; } catch { return false; }
}
export function jumpHeight(gravity, seconds, speed = 4) { return Math.max(0, speed * seconds - 0.5 * gravity * seconds * seconds); }
export function isDay(angle) { return Math.cos(angle * Math.PI / 180) >= 0; }
