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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Accepts 2026-10-03, 03/10/2026 (day first), 3.10.26, or "Sat 03 Oct" with no year.
// With no year, the weekday picks the year (nearest to `near`); without a weekday, the year of `near`.
// Returns a UTC midnight timestamp, or null.
export function parseDate(s, near = Date.now()) {
  s = s.trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return Date.UTC(+m[1], m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/))) return Date.UTC(m[3].length == 2 ? 2000 + +m[3] : +m[3], m[2] - 1, +m[1]);
  if ((m = s.match(/^(?:([a-z]{3})[a-z]*,?\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?(?:\s+(\d{4}))?$/i))) {
    const [, wd, day, mon, yr] = m, mo = MONTHS.indexOf(mon.toLowerCase());
    if (mo < 0) return null;
    if (yr) return Date.UTC(+yr, mo, +day);
    const y0 = new Date(near).getUTCFullYear();
    const years = [y0, y0 + 1, y0 - 1, y0 + 2, y0 - 2];
    const want = wd ? WEEKDAYS.indexOf(wd.toLowerCase()) : -1;
    const y = want < 0 ? y0 : years.find(y => new Date(Date.UTC(y, mo, +day)).getUTCDay() === want);
    return y == null ? null : Date.UTC(y, mo, +day);
  }
  const d = new Date(s); return isNaN(d) ? null : Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

// "21:30", "9:30pm", "9 PM" → minutes after midnight, or null.
export function parseClock(v) {
  const m = (v || '').trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1] % (m[3] ? 12 : 24); if (m[3] && m[3].toLowerCase() === 'pm') h += 12;
  return h < 24 && +(m[2] || 0) < 60 ? h * 60 + +(m[2] || 0) : null;
}

// Cities that mean "not anywhere yet" or "we don't know".
const IN_AIR = new Set(['the sky', 'sky', 'in the air', 'flying', 'plane', 'flight', 'in transit']);
const UNKNOWN = /^(\?+|tbc|tbd|unknown)$/i;
const lastLeg = v => v.split('>').map(x => x.trim()).filter(Boolean);

/**
 * Spreadsheet (CSV or tab-separated) with one row per day. Columns are found by their header names
 * (date / city / country, any order); with no header they're read as date, city, country.
 * Travel days can list a route like "London > Edinburgh": the last place is where they end up that day.
 * An optional Arrive column ("21:30") says when they land there; until then they show as in the air.
 * An optional Depart column says when they take off (local time where they leave from).
 */
export function parseCSV(text, near) {
  const rows = [], bad = [];
  const lines = text.trim().split(/\r?\n/);
  const split = line => line.split(line.includes('\t') ? '\t' : ',').map(s => s.replace(/^"|"$/g, '').trim());
  let col = { date: 0, city: 1, country: 2 }, first = 0;
  const head = split(lines[0] || '').map(h => h.toLowerCase());
  if (head.some(h => h.includes('date'))) {
    col = { date: head.findIndex(h => h.includes('date')), city: head.findIndex(h => h.includes('city')), country: head.findIndex(h => h.includes('country')), arrive: head.findIndex(h => h.includes('arriv')), depart: head.findIndex(h => h.includes('depart')) };
    first = 1;
  }
  lines.forEach((line, i) => {
    if (i < first || !line.trim()) return;
    const cols = split(line);
    const d = parseDate(cols[col.date] || '', near);
    const route = lastLeg(cols[col.city] || '');
    if (d == null || !route.length) { bad.push(i + 1); return; }
    const countries = lastLeg(cols[col.country] || '');
    const city = route[route.length - 1], country = countries[countries.length - 1] || '';
    const arrive = col.arrive >= 0 ? parseClock(cols[col.arrive]) : null; // local time they land, on a travel day
    const depart = col.depart >= 0 ? parseClock(cols[col.depart]) : null; // local time they take off
    rows.push({ t: d, city, country, mapCountry: canonCountry(country), route: route.length > 1 ? route : null, arrive, depart });
  });
  rows.sort((a, b) => a.t - b.t);
  return { rows, bad };
}

/**
 * Collapses consecutive days in the same city into stops. "In the air" days, days with no row,
 * and days back in the home city aren't stops. "???" becomes a mystery stop with no map position.
 */
export function buildTrip(rows, geoCache = {}, home = null) {
  const stops = [], byDay = new Map(), routeByDay = new Map(), homeDays = new Set(), arrivals = new Map(), departures = new Map();
  rows.forEach(r => {
    if (r.route) routeByDay.set(r.t, r.route);
    if (r.arrive != null) arrivals.set(r.t, r.arrive);
    if (r.depart != null) departures.set(r.t, r.depart);
    const k = key(r.city);
    if (IN_AIR.has(k)) return;
    if (home && k === key(home.city)) { homeDays.add(r.t); return; }
    const mystery = UNKNOWN.test(r.city);
    const last = stops[stops.length - 1];
    if (last && key(last.city) === k && r.t - last.end <= DAY) last.end = r.t;
    else stops.push({ city: mystery ? '???' : r.city, country: r.country, mapCountry: r.mapCountry || r.country, mystery, start: r.t, end: r.t });
  });
  stops.forEach((s, i) => {
    s.i = i;
    s.nights = Math.round((s.end - s.start) / DAY) + 1;
    s.ll = s.mystery ? null : COORDS[key(s.city)] || geoCache[key(s.city) + '|' + key(s.mapCountry)] || null;
    for (let t = s.start; t <= s.end; t += DAY) byDay.set(t, s);
  });
  const start = rows[0]?.t, end = rows[rows.length - 1]?.t;
  const days = []; if (rows.length) for (let t = start; t <= end; t += DAY) days.push(t);
  return { stops, byDay, routeByDay, homeDays, arrivals, departures, start, end, days };
}

// Looks up cities missing from COORDS via OpenStreetMap (1 req/sec per their usage policy).
export async function geocodeMissing(trip, geoCache) {
  const failed = [];
  for (const s of trip.stops.filter(s => !s.ll && !s.mystery)) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(s.city + ', ' + s.mapCountry)}`);
      const j = await r.json();
      if (j[0]) { s.ll = [+j[0].lon, +j[0].lat]; geoCache[key(s.city) + '|' + key(s.mapCountry)] = s.ll; } else failed.push(s.city);
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
