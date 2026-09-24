import TRIP from './data/trip.js';
import { TZ } from './lib/places.js';
import { DAY, key, plural, hav, parseCSV, buildTrip, geocodeMissing, clampToTrip, currentStopIndex } from './lib/trip.js';
import { renderMap, inEU } from './map.js';
import { feature } from '../vendor/geo.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (t, o) => new Date(t).toLocaleDateString('en-GB', { timeZone: 'UTC', ...o });
// "Today" is the calendar date in NZ, where the friends & family following along are.
const realToday = (() => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TRIP.todayTimeZone || 'Pacific/Auckland', year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date()).map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day);
})();

// localStorage can throw (private mode, blocked storage); it only holds conveniences.
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
const geoCache = (() => { try { return JSON.parse(store.get('trip-geocache') || '{}'); } catch { return {}; } })();

let trip, sel, world, clockTimer, mapView = 'world';
const stopAt = t => trip.byDay.get(t) || null;

function renderStats() {
  const idx = currentStopIndex(trip, sel), done = trip.stops.slice(0, idx + 1);
  const countries = new Set(done.map(s => s.country)), allC = new Set(trip.stops.map(s => s.country));
  // Distance along the located stops, starting from home (and back to it once they're home).
  const home = TRIP.home?.ll, last = trip.stops[trip.stops.length - 1];
  const pts = [...(home && done.length ? [home] : []), ...done.filter(s => s.ll).map(s => s.ll), ...(home && last && sel > last.end && trip.homeDays.size ? [home] : [])];
  let km = 0; for (let i = 1; i < pts.length; i++) km += hav(pts[i - 1], pts[i]);
  const dayN = Math.round((sel - trip.start) / DAY) + 1;
  $('stats').innerHTML = [
    [dayN, `/${trip.days.length}`, 'Days on the road'],
    [countries.size, `/${allC.size}`, 'Countries'],
    [done.length, `/${trip.stops.length}`, 'Cities'],
    [Math.round(km).toLocaleString('en-GB'), 'km', 'Travelled so far'],
  ].map(([a, b, c]) => `<div class="stat"><b>${a}<small>${b}</small></b><span>${c}</span></div>`).join('');
}

function renderToday() {
  const s = stopAt(sel), idx = currentStopIndex(trip, sel), nxt = trip.stops[idx + 1];
  const dayN = Math.round((sel - trip.start) / DAY) + 1;
  const isToday = sel === realToday;
  const whenLabel = isToday ? `Today · ${fmt(sel, { weekday: 'long', day: 'numeric', month: 'long' })}` : fmt(sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let lede, city, country, rows = '';
  if (s) {
    lede = sel === s.start && s.i > 0 ? 'Just arrived in'
      : sel === s.end && s.i < trip.stops.length - 1 ? 'Last day in'
      : s.i === trip.stops.length - 1 && sel === s.end ? 'Final stop —'
      : isToday ? 'Right now they’re in' : 'That day they were in';
    if (!isToday && sel > realToday) lede = 'That day they’ll be in';
    if (sel === trip.start && realToday < trip.start) lede = 'Once they take off, first stop:'; // the countdown over the map has the exact time
    city = s.city; country = s.country;
    if (s.mystery) { lede = sel > realToday ? 'They’ll be somewhere in' : 'Somewhere in'; city = s.country || 'Parts unknown'; country = 'Exact spot TBC 🤫'; }
    const dayIn = Math.round((sel - s.start) / DAY) + 1;
    const route = trip.routeByDay.get(sel);
    rows = `<div class="row"><span>Local time</span><b id="clock">—</b></div>
      ${route ? `<div class="row"><span>Travel day</span><b>${route.map(esc).join(' → ')}</b></div>` : ''}
      <div class="row"><span>${s.mystery ? 'Here for' : 'In ' + esc(s.city)}</span><b>Day ${dayIn} of ${s.nights}</b></div>
      <div class="row"><span>${s.nights > 1 ? 'Dates' : 'Date'}</span><b>${fmt(s.start, { day: 'numeric', month: 'short' })}${s.nights > 1 ? ' – ' + fmt(s.end, { day: 'numeric', month: 'short' }) : ''}</b></div>`;
  } else if (trip.homeDays.has(sel)) {
    lede = sel > realToday ? 'They’ll be back home in' : 'Back home in';
    city = TRIP.home.city; country = TRIP.home.country;
    rows = `<div class="row"><span>Local time</span><b id="clock">—</b></div>`;
  } else {
    lede = 'Somewhere between'; const prev = trip.stops[idx];
    city = 'In the air ✈️'; country = `${prev ? prev.city : TRIP.home?.city || '?'} → ${nxt ? nxt.city : TRIP.home?.city || '?'}`;
  }
  let nextHtml;
  if (nxt) {
    const d = Math.round((nxt.start - sel) / DAY);
    const when = d === 1 ? 'tomorrow' : `in ${plural(d, 'day')}`;
    nextHtml = `<div class="big">${esc(nxt.city)} ${when}</div><div class="small">${esc(nxt.country)} · ${plural(nxt.nights, 'day')} there</div>`;
  } else if (trip.homeDays.has(sel)) {
    nextHtml = `<div class="big">Trip complete 🎉</div><div class="small">Welcome home, you two.</div>`;
  } else {
    nextHtml = `<div class="big">${TRIP.home ? 'Flying home to ' + esc(TRIP.home.city) : 'Home sweet home'}</div><div class="small">Last stop of the trip — welcome back soon.</div>`;
  }
  const home = TRIP.home?.ll ? TRIP.home : null;
  const wxPlace = s && s.ll ? { name: s.city, ll: s.ll } : !s && home && trip.homeDays.has(sel) ? { name: home.city, ll: home.ll } : null;
  $('todayBody').innerHTML = `
    <div class="eyebrow">${whenLabel}</div>
    <div class="stampbadge"><span>Day</span><b>${dayN}</b><span>of ${trip.days.length}</span></div>
    <div>
      <p class="lede">${lede}</p>
      <div class="city">${esc(city)}</div>
      <div class="country"><span class="dot"></span>${esc(country)}</div>
    </div>
    <div class="rows">${rows}</div>
    ${wxPlace ? `<div class="weather" id="weather"><span class="wx-what">Checking the weather in ${esc(wxPlace.name)}…</span></div>` : ''}
    <div class="next"><span class="eyebrow">Up next</span>${nextHtml}</div>`;

  if (wxPlace) showWeather(wxPlace, sel);
  clearInterval(clockTimer);
  if (s || trip.homeDays.has(sel)) {
    const tz = s ? TZ[s.mapCountry] || 'Europe/Paris' : TZ[TRIP.home.country] || 'Pacific/Auckland';
    const tick = () => {
      const el = $('clock'); if (!el) return;
      const now = new Date();
      const zone = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';
      el.textContent = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }) + ' ' + zone;
    };
    tick(); clockTimer = setInterval(tick, 15000);
  }
}

// Weather from Open-Meteo (free, no API key). It covers roughly the past 3 months to 2 weeks ahead.
const WX = { 0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Cloudy'], 45: ['🌫️', 'Foggy'], 48: ['🌫️', 'Foggy'],
  51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'], 56: ['🌧️', 'Freezing drizzle'], 57: ['🌧️', 'Freezing drizzle'],
  61: ['🌦️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'], 66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
  71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow'], 80: ['🌦️', 'Showers'], 81: ['🌧️', 'Showers'],
  82: ['⛈️', 'Heavy showers'], 85: ['🌨️', 'Snow showers'], 86: ['🌨️', 'Snow showers'], 95: ['⛈️', 'Thunderstorms'], 96: ['⛈️', 'Thunderstorms'], 99: ['⛈️', 'Thunderstorms'] };
const wxCache = new Map();
function fetchWeather(ll, t) {
  const date = new Date(t).toISOString().slice(0, 10), now = t === realToday;
  const k = `${ll}|${date}|${now}`;
  if (!wxCache.has(k)) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ll[1]}&longitude=${ll[0]}&timezone=auto&start_date=${date}&end_date=${date}`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min${now ? '&current=temperature_2m,weather_code' : ''}`;
    wxCache.set(k, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(e => { wxCache.delete(k); throw e; }));
  }
  return wxCache.get(k);
}
function showWeather(place, t) {
  const el = () => sel === t && $('weather'); // ignore late answers once another day is picked
  const set = html => { const w = el(); if (w) w.innerHTML = html; };
  const round = v => Math.round(v);
  if (t > realToday + 15 * DAY) return set(`<span class="wx-what">🔭 The forecast for ${esc(place.name)} shows up about 2 weeks out</span>`);
  if (t < realToday - 92 * DAY) return set(`<span class="wx-what">Weather for ${esc(place.name)} isn't available this far back</span>`);
  fetchWeather(place.ll, t).then(j => {
    const d = j.daily || {}, cur = j.current;
    const code = cur ? cur.weather_code : d.weather_code?.[0];
    const [icon, label] = WX[code] || ['🌡️', 'Weather'];
    const hi = d.temperature_2m_max?.[0], lo = d.temperature_2m_min?.[0];
    const range = hi != null && lo != null ? ` · High ${round(hi)}° · Low ${round(lo)}°` : '';
    const when = cur ? `${esc(place.name)} right now` : t > realToday ? `${esc(place.name)} forecast` : `${esc(place.name)} on the day`;
    set(`<span class="wx-what"><span class="wx-icon">${icon}</span><span>${label}<small>${when}${range}</small></span></span>`
      + `<b>${cur ? round(cur.temperature_2m) + '°C' : hi != null ? round(hi) + '°C' : ''}</b>`);
  }).catch(() => set(`<span class="wx-what">Couldn't load the weather for ${esc(place.name)} right now</span>`));
}

function renderStrip() {
  const n = trip.days.length, el = $('strip'), hasToday = trip.days.includes(realToday);
  el.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`;
  el.style.minWidth = `${n * 38}px`; // keeps day cells tappable on phones; the strip scrolls sideways
  let h = '';
  trip.days.forEach((t, i) => {
    if (i === 0 || new Date(t).getUTCDate() === 1) h += `<div class="monthlabel" style="grid-row:1;grid-column:${i + 1}/span ${Math.min(6, n - i)}">${fmt(t, { month: 'long' })}</div>`;
  });
  trip.days.forEach((t, i) => {
    const s = stopAt(t);
    const cls = ['day', s ? (s.i % 2 ? 'alt' : '') : 'gap', t < sel ? 'past' : '', t === sel ? 'sel' : ''].join(' ');
    h += `<button class="${cls}" style="grid-row:2;grid-column:${i + 1};margin-top:${hasToday ? 18 : 0}px" data-t="${t}" title="${fmt(t, { weekday: 'short', day: 'numeric', month: 'short' })}${s ? ' · ' + esc(s.city) : ''}">${new Date(t).getUTCDate()}${t === realToday ? '<span class="t">Today</span>' : ''}</button>`;
  });
  trip.stops.forEach(s => {
    const c = Math.round((s.start - trip.start) / DAY) + 1;
    h += `<div class="stoplabel" style="grid-row:3;grid-column:${c}/span ${s.nights}" title="${esc(s.city)}">${esc(s.city)}<small>${plural(s.nights, 'day')}</small></div>`;
  });
  el.innerHTML = h;
  // On narrow screens the strip scrolls; keep the selected day in view.
  const scroller = el.parentElement, selEl = el.querySelector('.day.sel');
  if (selEl && scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = selEl.offsetLeft - scroller.clientWidth / 2;
  $('goToday').textContent = realToday < trip.start ? 'Jump to day one' : realToday > trip.end ? 'Jump to last day' : 'Jump to today';
}

function renderCards() {
  const idx = currentStopIndex(trip, sel), s = stopAt(sel);
  $('cards').innerHTML = trip.stops.map(st => {
    const state = s && st.i === s.i ? 'now' : st.i <= idx ? 'done' : 'soon';
    const tag = { now: 'Here', done: 'Visited' }[state];
    const dates = `${fmt(st.start, { day: 'numeric', month: 'short' })} – ${fmt(st.end, { day: 'numeric', month: 'short' })}`;
    return `<button class="pc ${state}" data-t="${st.start}" title="${esc(st.city)}, ${esc(st.country)} · ${dates}">${tag ? `<span class="tag">${tag}</span>` : ''}${esc(st.city)}</button>`;
  }).join('');
}

// On wide screens the panels float over the map, so fit the route into the part that's still visible.
function visibleArea(W, H) {
  const side = $('side');
  if (getComputedStyle(side).position !== 'absolute') return null;
  const m = $('map').getBoundingClientRect(), r = el => el.getBoundingClientRect();
  const toggle = r($('viewToggle')), title = r($('topleft').querySelector('h1')), sideR = r(side);
  const x0 = toggle.right - m.left + 40, y0 = title.bottom - m.top + 40;
  const x1 = sideR.left - m.left - 50, y1 = r($('strip').closest('.scrub')).top - m.top - 30;
  return x1 - x0 > 200 && y1 - y0 > 200 ? [[x0, y0], [x1, y1]] : null;
}

function drawMap() {
  const box = $('map').getBoundingClientRect();
  if (!box.width || !box.height) return;
  const hasAway = renderMap({
    svgEl: $('svg'), box, fit: visibleArea(box.width, box.height), trip, sel, world, view: mapView, home: TRIP.home?.ll ? TRIP.home : null,
    idx: currentStopIndex(trip, sel), cur: stopAt(sel), atHome: trip.homeDays.has(sel), avatar, onPick: go,
  });
  $('viewToggle').style.display = hasAway ? '' : 'none';
  $('viewToggle').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === mapView));
}

// Europe view while they're in Europe; whole-trip view before they get there, in the air, and after they leave.
// A mystery stop ("???") takes the view of the last place they were seen.
function autoView(t) {
  const s = stopAt(t);
  if (!s) return 'world';
  const seen = trip.stops.slice(0, s.i + 1).reverse().find(x => x.ll);
  return seen && inEU(seen.ll) ? 'europe' : 'world';
}

function renderAll() { renderStats(); renderToday(); renderStrip(); renderCards(); drawMap(); }
function go(t) { sel = clampToTrip(trip, t); mapView = autoView(sel); renderAll(); } // the toggle overrides until the day changes

// Events
$('strip').addEventListener('click', e => { const b = e.target.closest('.day'); if (b) go(+b.dataset.t); });
$('cards').addEventListener('click', e => { const c = e.target.closest('.pc'); if (c) { go(+c.dataset.t); $('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });
$('viewToggle').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mapView = b.dataset.v; drawMap(); });
$('prev').onclick = () => go(sel - DAY);
$('next').onclick = () => go(sel + DAY);
$('goToday').onclick = () => go(realToday);
document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(sel - DAY); if (e.key === 'ArrowRight') go(sel + DAY); });
new ResizeObserver(() => trip && drawMap()).observe($('map'));

// Countdown over the map until take-off (day 1 at TRIP.takeoffTime, NZ time).
const tzOffset = (t, tz) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(new Date(t)).map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
};
function startCountdown() {
  const tz = TRIP.todayTimeZone || 'Pacific/Auckland';
  const [hh, mm] = (TRIP.takeoffTime || '00:00').split(':').map(Number);
  const local = trip.start + ((hh || 0) * 60 + (mm || 0)) * 6e4; // wall-clock time in tz, written as if UTC
  let takeoff = local - tzOffset(local, tz); takeoff = local - tzOffset(takeoff, tz); // second pass handles DST edges
  if (Date.now() >= takeoff) return;
  const first = trip.stops[0], pad = n => String(n).padStart(2, '0');
  $('cdFrom').textContent = TRIP.home ? `Take-off from ${TRIP.home.city} in` : 'Take-off in';
  $('cdSub').innerHTML = first ? `First stop: <b>${esc(first.city)}</b>, ${esc(first.country)} · ${fmt(first.start, { weekday: 'short', day: 'numeric', month: 'short' })}` : '';
  $('countdown').hidden = false;
  const tick = () => {
    const ms = takeoff - Date.now();
    if (ms <= 0) { clearInterval(timer); location.reload(); return; } // reload so "today" rolls over too
    const sec = Math.floor(ms / 1000);
    $('cdD').textContent = Math.floor(sec / 86400);
    $('cdH').textContent = pad(Math.floor(sec / 3600) % 24);
    $('cdM').textContent = pad(Math.floor(sec / 60) % 60);
    $('cdS').textContent = pad(sec % 60);
  };
  const timer = setInterval(tick, 1000); tick();
  $('cdPeek').onclick = () => { $('countdown').hidden = true; };
}

// Boot
// Initials ("A&M") until the photo loads; a missing or broken photo just keeps the initials.
const avatar = { src: null, initials: TRIP.travellers.split(/\s*(?:&|and|,)\s*/).map(n => n.trim()[0] || '').join('&') };
if (TRIP.avatar) {
  const img = new Image();
  img.onload = () => { avatar.src = TRIP.avatar; if (trip) drawMap(); };
  img.onerror = () => console.warn(`Traveller photo not found: ${TRIP.avatar}`);
  img.src = TRIP.avatar;
}
$('who').textContent = TRIP.travellers;
document.title = `Where are ${TRIP.travellers}?`;

// no-cache: always revalidate, so an edited itinerary shows as soon as GitHub Pages republishes it.
const csv = await fetch('src/data/itinerary.csv', { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '');
const { rows, bad } = parseCSV(csv);
if (bad.length) console.warn(`Itinerary: skipped ${plural(bad.length, 'line')} (${bad.slice(0, 6).join(', ')}).`);
if (!rows.length) {
  $('todayBody').innerHTML = '<p class="lede">No itinerary yet — add rows to src/data/itinerary.csv.</p>';
} else {
  trip = buildTrip(rows, geoCache, TRIP.home);
  sel = clampToTrip(trip, realToday);
  mapView = autoView(sel);
  renderAll();
  startCountdown();
  if (trip.stops.some(s => !s.ll)) {
    geocodeMissing(trip, geoCache).then(failed => {
      store.set('trip-geocache', JSON.stringify(geoCache));
      renderStats(); drawMap();
      if (failed.length) console.warn('Could not place on the map:', failed.join(', '));
    });
  }
  // Country outlines are served from this site (no CDN), loaded after first paint to keep startup quick.
  fetch('vendor/countries-50m.json').then(r => r.json()).then(w => {
    world = feature(w, w.objects.countries).features.filter(f => f.properties.name !== 'Antarctica');
    drawMap();
  }).catch(() => { /* map still works without country shading */ });
}
