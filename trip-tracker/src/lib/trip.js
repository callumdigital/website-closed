import { COORDS, COUNTRY_ALIAS } from './places.js';

export const DAY = 864e5;
export const key = s => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const canonCountry = c => COUNTRY_ALIAS[key(c)] || c.trim();
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// Great-circle distance in km between two [lon, lat] points.
export function hav(a, b) {
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b[1] - a[1]), dLo = r(b[0] - a[0]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Accepts 2026-10-03, 03/10/2026 (day first), 3.10.26, or anything Date can parse. Returns a UTC midnight timestamp.
export function parseDate(s) {
  s = s.trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return Date.UTC(+m[1], m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/))) return Date.UTC(m[3].length == 2 ? 2000 + +m[3] : +m[3], m[2] - 1, +m[1]);
  const d = new Date(s); return isNaN(d) ? null : Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

// CSV or tab-separated (pasted from a spreadsheet); an optional header row is skipped.
export function parseCSV(text) {
  const rows = [], bad = [];
  text.trim().split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const cols = line.split(line.includes('\t') ? '\t' : ',').map(s => s.replace(/^"|"$/g, '').trim());
    if (i === 0 && /date/i.test(cols[0])) return;
    const d = parseDate(cols[0] || ''); if (d == null || !cols[1]) { bad.push(i + 1); return; }
    rows.push({ t: d, city: cols[1], country: canonCountry(cols[2] || '') });
  });
  rows.sort((a, b) => a.t - b.t);
  return { rows, bad };
}

// Collapses consecutive days in the same city into stops. Days with no row become gaps ("in transit").
export function buildTrip(rows, geoCache = {}) {
  const stops = [], byDay = new Map();
  rows.forEach(r => {
    const last = stops[stops.length - 1];
    if (last && key(last.city) === key(r.city) && r.t - last.end <= DAY) last.end = r.t;
    else stops.push({ city: r.city, country: r.country, start: r.t, end: r.t });
  });
  stops.forEach((s, i) => {
    s.i = i;
    s.nights = Math.round((s.end - s.start) / DAY) + 1;
    s.ll = COORDS[key(s.city)] || geoCache[key(s.city) + '|' + key(s.country)] || null;
    for (let t = s.start; t <= s.end; t += DAY) byDay.set(t, s);
  });
  const start = stops[0]?.start, end = stops[stops.length - 1]?.end;
  const days = []; if (stops.length) for (let t = start; t <= end; t += DAY) days.push(t);
  return { stops, byDay, start, end, days };
}

// Looks up cities missing from COORDS via OpenStreetMap (1 req/sec per their usage policy).
export async function geocodeMissing(trip, geoCache) {
  const failed = [];
  for (const s of trip.stops.filter(s => !s.ll)) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(s.city + ', ' + s.country)}`);
      const j = await r.json();
      if (j[0]) { s.ll = [+j[0].lon, +j[0].lat]; geoCache[key(s.city) + '|' + key(s.country)] = s.ll; } else failed.push(s.city);
    } catch { failed.push(s.city); }
    await new Promise(r => setTimeout(r, 1100));
  }
  return failed;
}

export const clampToTrip = (trip, t) => Math.max(trip.start, Math.min(trip.end, t));
// Index of the last stop that started on/before t.
export function currentStopIndex(trip, t) {
  let idx = -1; trip.stops.forEach((s, i) => { if (s.start <= t) idx = i; }); return idx;
}
