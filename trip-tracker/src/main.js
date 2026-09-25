import TRIP from './data/trip.js';
import { TZ, stopEmoji } from './lib/places.js';
import { DAY, key, canonCountry, plural, hav, parseCSV, buildTrip, geocodeMissing, clampToTrip, currentStopIndex } from './lib/trip.js';
import { renderMap, inEU } from './map.js';
import { feature } from '../vendor/geo.js';
import { photosEnabled, loadPhotos } from './lib/photos.js';

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
let photosByDay = new Map(); // 'YYYY-MM-DD' → the travellers' uploads for that day
const isoDay = t => new Date(t).toISOString().slice(0, 10);

// Wall-clock time (minutes after midnight on day t) in time zone tz → a real instant.
const tzOffset = (t, tz) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(new Date(t)).map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
};
function zoned(t, minutes, tz) {
  const local = t + minutes * 6e4; // wall-clock time in tz, written as if UTC
  const guess = local - tzOffset(local, tz);
  return local - tzOffset(guess, tz); // second pass handles DST edges
}
const clock12 = m => `${(Math.floor(m / 60) + 11) % 12 + 1}${m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''}${m < 720 ? 'am' : 'pm'}`;

// Travel days with an Arrive time: where they're flying to, and when they land (a real instant).
function flight(t) {
  const m = trip.arrivals.get(t);
  if (m == null) return null;
  const s = stopAt(t), home = TRIP.home;
  const dest = s ? { city: s.city, country: s.country, stop: s, tz: TZ[s.mapCountry] || 'Europe/Paris' }
    : trip.homeDays.has(t) && home ? { city: home.city, country: home.country, home: true, tz: TZ[canonCountry(home.country)] || TRIP.todayTimeZone } : null;
  return dest && { ...dest, minutes: m, lands: zoned(t, m, dest.tz) };
}
// In the air for most of a travel day: shown flying unless it's today and they've already landed.
const inAir = t => { const f = flight(t); return !!f && (t !== realToday || Date.now() < f.lands); };
const here = t => inAir(t) ? null : stopAt(t); // where to put the faces

// Flights with both a Depart and an Arrive time, so the plane can track along the route as it flies.
// Departure is in the time zone of where they're leaving from; the landing is the next Arrive on/after that day.
// A travel day's route for display, without the "The sky" placeholders.
const routeText = r => r.filter(p => !/^(the )?sky$|^in the air$/i.test(p)).map(esc).join(' → ');
const homeTz = () => TZ[canonCountry(TRIP.home?.country || '')] || TRIP.todayTimeZone || 'Pacific/Auckland';
function flightsWithTimes() {
  const out = [];
  for (const [d, mins] of trip.departures) {
    let from = null; // the last place they were before this day
    for (let t = d - DAY; t >= trip.start && !from; t -= DAY) from = stopAt(t) || (trip.homeDays.has(t) ? 'home' : null);
    const tz = from && from !== 'home' ? TZ[from.mapCountry] || 'Europe/Paris' : homeTz();
    const arrDay = [...trip.arrivals.keys()].filter(t => t >= d).sort((a, b) => a - b)[0];
    const f = arrDay != null && flight(arrDay);
    if (f) out.push({ depDay: d, arrDay, depMinutes: mins, departs: zoned(d, mins, tz), lands: f.lands });
  }
  return out;
}
// Today's flight, if they're on (or about to board) one right now: how far along it they are, 0 to 1.
function liveFlight() {
  if (sel !== realToday) return null;
  const now = Date.now();
  const f = flightsWithTimes().find(f => realToday >= f.depDay && realToday <= f.arrDay && now < f.lands);
  return f ? { ...f, boarding: now < f.departs, progress: Math.max(0, Math.min(1, (now - f.departs) / (f.lands - f.departs))) } : null;
}
function flightRows(live) {
  if (!live) return '';
  const pct = Math.round(live.progress * 100);
  return live.boarding ? `<div class="row"><span>Boarding</span><b>Takes off ${clock12(live.depMinutes)} local time</b></div>`
    : `<div class="row"><span>Took off</span><b>${clock12(live.depMinutes)} local time</b></div>
       <div class="row"><span>Flight</span><b class="fprog"><span class="fbar"><i style="width:${pct}%"></i></span>${pct}% of the way</b></div>`;
}

// The whole trip, there and back: for the "trip complete" panel.
function tripTotals() {
  const home = TRIP.home?.ll, pts = [...(home ? [home] : []), ...trip.stops.filter(s => s.ll).map(s => s.ll), ...(home ? [home] : [])];
  let km = 0; for (let i = 1; i < pts.length; i++) km += hav(pts[i - 1], pts[i]);
  return { km: Math.round(km) };
}

function doneHtml() {
  const pair = /&| and /.test(TRIP.travellers || '');
  return `<div class="done"><div class="eyebrow">Trip complete 🎉</div><div class="big">Welcome home${pair ? ', you two' : ''}!</div>
    <div class="small">${plural(trip.days.length, 'day')} · ${plural(trip.stops.length, 'stop')} · ${tripTotals().km.toLocaleString('en-GB')} km</div></div>`;
}

function renderStats() {
  const started = Date.now() >= takeoffAt(); // everything reads 0 until they're off
  const { idx } = started ? mapState() : { idx: -1 }; // a stop only counts once they've landed there
  const done = trip.stops.slice(0, idx + 1);
  const countries = new Set(done.map(s => s.country)), allC = new Set(trip.stops.map(s => s.country));
  // Distance along the located stops, starting from home (and back to it once they're home).
  const home = TRIP.home?.ll, last = trip.stops[trip.stops.length - 1];
  const pts = [...(home && done.length ? [home] : []), ...done.filter(s => s.ll).map(s => s.ll), ...(home && last && sel > last.end && trip.homeDays.size && !inAir(sel) && !liveFlight() ? [home] : [])];
  let km = 0; for (let i = 1; i < pts.length; i++) km += hav(pts[i - 1], pts[i]);
  const dayN = started ? Math.round((sel - trip.start) / DAY) + 1 : 0;
  $('stats').innerHTML = [
    [dayN, `/${trip.days.length}`, 'Days on the road'],
    [countries.size, `/${allC.size}`, 'Countries'],
    [done.length, `/${trip.stops.length}`, 'Cities'],
    [Math.round(km).toLocaleString('en-GB'), 'km', 'Travelled so far'],
  ].map(([a, b, c]) => `<div class="stat"><b>${a}<small>${b}</small></b><span>${c}</span></div>`).join('');
}

function renderToday() {
  const fl = inAir(sel) ? flight(sel) : null, s = here(sel), idx = currentStopIndex(trip, sel), nxt = trip.stops[idx + 1];
  const dayN = Math.round((sel - trip.start) / DAY) + 1;
  const isToday = sel === realToday;
  const whenLabel = isToday ? `Today · ${fmt(sel, { weekday: 'short', day: 'numeric', month: 'short' })}` : fmt(sel, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  let lede, city, country, rows = '';
  if (fl) {
    lede = sel < realToday ? 'That day they flew to' : sel > realToday ? 'That day they’ll be flying to' : liveFlight()?.boarding ? 'Boarding soon 🛫 flying to' : 'Up in the air ✈️ heading to';
    city = fl.city; country = fl.country;
    const route = trip.routeByDay.get(sel);
    rows = `${route ? `<div class="row"><span>Travel day</span><b>${routeText(route)}</b></div>` : ''}
      ${flightRows(liveFlight())}
      <div class="row"><span>${sel < realToday ? 'Landed' : 'Lands'}</span><b>${clock12(fl.minutes)} local time</b></div>`;
  } else if (s) {
    lede = sel === s.start && s.i > 0 ? 'Just arrived in'
      : sel === s.end && s.i < trip.stops.length - 1 ? 'Last day in'
      : s.i === trip.stops.length - 1 && sel === s.end ? 'Final stop —'
      : isToday ? 'Right now they’re in' : 'That day they were in';
    if (!isToday && sel > realToday) lede = 'That day they’ll be in';
    if (flight(sel)) lede = 'Just landed in';
    if (sel === trip.start && realToday < trip.start) lede = 'Once they take off, first stop:'; // the countdown over the map has the exact time
    city = s.city; country = s.country;
    if (s.mystery) { lede = sel > realToday ? 'They’ll be somewhere in' : 'Somewhere in'; city = s.country || 'Parts unknown'; country = 'Exact spot TBC 🤫'; }
    const dayIn = Math.round((sel - s.start) / DAY) + 1;
    const route = trip.routeByDay.get(sel);
    rows = `      ${route ? `<div class="row"><span>Travel day</span><b>${routeText(route)}</b></div>` : ''}
      <div class="row"><span>Stay</span><b>Day ${dayIn} of ${s.nights} · ${fmt(s.start, { day: 'numeric', month: 'short' })}${s.nights > 1 ? ' – ' + fmt(s.end, { day: 'numeric', month: 'short' }) : ''}</b></div>`;
  } else if (trip.homeDays.has(sel)) {
    lede = sel > realToday ? 'They’ll be back home in' : 'Back home in';
    city = TRIP.home.city; country = TRIP.home.country;
    rows = '';
  } else {
    lede = 'Somewhere between'; const prev = trip.stops[idx];
    city = 'In the air ✈️'; country = `${prev ? prev.city : TRIP.home?.city || '?'} → ${nxt ? nxt.city : TRIP.home?.city || '?'}`;
    const live = liveFlight();
    if (live?.boarding) { lede = 'Boarding soon 🛫 in'; city = prev ? prev.city : TRIP.home?.city || '?'; country = `Flying to ${nxt ? nxt.city : TRIP.home?.city || '?'}`; }
    rows = flightRows(live);
  }
  let nextHtml;
  if (fl) {
    nextHtml = `<div class="big">${esc(fl.city)} at ${clock12(fl.minutes)}</div><div class="small">· ${fl.home ? 'Welcome home!' : `${plural(fl.stop.nights, 'day')} there`}</div>`;
  } else if (nxt) {
    const d = Math.round((nxt.start - sel) / DAY);
    const when = d === 1 ? 'tomorrow' : `in ${plural(d, 'day')}`;
    nextHtml = `<div class="big">${esc(nxt.city)} ${when}</div><div class="small">· ${plural(nxt.nights, 'day')} there</div>`;
  } else if (trip.homeDays.has(sel)) {
    // Back home: not an "up next" but a celebration, with the whole trip's numbers.
    nextHtml = doneHtml();
  } else {
    nextHtml = `<div class="big">${TRIP.home ? 'Flying home to ' + esc(TRIP.home.city) : 'Home sweet home'}</div><div class="small">· Last stop of the trip — welcome back soon.</div>`;
  }
  const home = TRIP.home?.ll ? TRIP.home : null;
  const wxPlace = fl ? null : s && s.ll ? { name: s.city, ll: s.ll } : !s && home && trip.homeDays.has(sel) ? { name: home.city, ll: home.ll } : null;
  $('todayBody').innerHTML = `
    <div class="eyebrow">${whenLabel}${s || trip.homeDays.has(sel) ? ' · <span id="clock"></span>' : ''}</div>
    <div class="stampbadge"><span>Day</span><b>${dayN}</b><span>of ${trip.days.length}</span></div>
    <div>
      <p class="lede">${lede}</p>
      <div class="city">${esc(city)}</div>
      <div class="country"><span class="dot"></span>${esc(country)}</div>
    </div>
    ${dayPhotoHtml(sel)}
    <div class="rows">${rows}</div>
    ${wxPlace ? `<div class="weather" id="weather"><span class="wx-what">Checking the weather in ${esc(wxPlace.name)}…</span></div>` : ''}
    ${nextHtml.startsWith('<div class="done">') ? nextHtml : `<div class="next"><span class="eyebrow">Up next</span>${nextHtml}</div>`}`;

  renderPolaroid();
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
  // Open-Meteo forecasts 15 days past *the place's* today, which in Europe is usually a day behind NZ's: so stop at 14.
  const tooFar = () => set(`<span class="wx-what">🔭 The forecast for ${esc(place.name)} shows up about 2 weeks out</span>`);
  if (t > realToday + 14 * DAY) return tooFar();
  if (t < realToday - 92 * DAY) return set(`<span class="wx-what">Weather for ${esc(place.name)} isn't available this far back</span>`);
  fetchWeather(place.ll, t).then(j => {
    const d = j.daily || {}, cur = j.current;
    const code = cur ? cur.weather_code : d.weather_code?.[0];
    const [icon, label] = WX[code] || ['🌡️', 'Weather'];
    const hi = d.temperature_2m_max?.[0], lo = d.temperature_2m_min?.[0];
    // Near the end of the forecast range the models may not have filled a day in yet: they send nulls, not an error.
    if (code == null && hi == null && !cur) return t > realToday ? tooFar() : set(`<span class="wx-what">No weather recorded for ${esc(place.name)} that day</span>`);
    const range = hi != null && lo != null ? ` · High ${round(hi)}° · Low ${round(lo)}°` : '';
    const when = cur ? `${esc(place.name)} right now` : t > realToday ? `${esc(place.name)} forecast` : `${esc(place.name)} on the day`;
    set(`<span class="wx-what"><span class="wx-icon">${icon}</span><span>${label}<small>${when}${range}</small></span></span>`
      + `<b>${cur ? round(cur.temperature_2m) + '°C' : hi != null ? round(hi) + '°C' : ''}</b>`);
  }).catch(() => t > realToday + 12 * DAY ? tooFar() // right at the edge of the forecast: not there yet rather than broken
    : set(`<span class="wx-what">Couldn't load the weather for ${esc(place.name)} right now</span>`));
}

// The day's photo from the travellers (the latest one; tap to see them all full size).
function dayPhotoHtml(t) {
  const pics = photosByDay.get(isoDay(t)) || [];
  if (!pics.length) return '';
  const p = pics[pics.length - 1];
  return `<figure class="daypic" id="daypic" role="button" tabindex="0" aria-label="Open photo">
    <img src="${esc(p.url)}" alt="${esc(p.caption || 'Photo from the day')}" loading="lazy">
    ${pics.length > 1 ? `<span class="count">📷 ${pics.length}</span>` : ''}
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`;
}
// ── Photo gallery ─────────────────────────────────────────────────────────
// A stop's photos across all its days, oldest first.
function stopPhotos(st) {
  const out = [];
  for (let t = st.start; t <= st.end; t += DAY) out.push(...(photosByDay.get(isoDay(t)) || []));
  return out;
}
// Opens the full-screen gallery at `photo`. It shows every photo from that photo's stop,
// or just that day's photos on a day that isn't a stop (in the air, back home).
let lb = { pics: [], i: 0, stop: null, t: null };
function openGallery(t, photo) {
  const st = stopAt(t);
  const pics = st ? stopPhotos(st) : photosByDay.get(isoDay(t)) || [];
  if (!pics.length) return;
  lb = { pics, i: Math.max(0, photo ? pics.findIndex(p => p.id === photo.id) : pics.length - 1), stop: st, t };
  const home = trip.homeDays.has(t) && TRIP.home;
  $('lbEyebrow').textContent = st ? `Stop ${st.i + 1} of ${trip.stops.length}` : home ? 'Home' : 'On the move';
  $('lbTitle').textContent = st ? (st.mystery ? `Somewhere in ${st.country}` : st.city) : home ? home.city : 'In the air ✈️';
  const range = st && `${fmt(st.start, { day: 'numeric', month: 'short' })}${st.nights > 1 ? ' – ' + fmt(st.end, { day: 'numeric', month: 'short' }) : ''}`;
  $('lbSub').innerHTML = st ? `${esc(st.country)} · <b>${plural(st.nights, 'day')}</b> there<br>${range} · ${plural(pics.length, 'photo')}`
    : `${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} · ${plural(pics.length, 'photo')}`;
  $('lbThumbs').innerHTML = pics.length > 1 ? pics.map((p, i) => `<button type="button" data-i="${i}" aria-label="Photo ${i + 1}"><img src="${esc(p.url)}" alt="" loading="lazy"></button>`).join('') : '';
  showPhoto();
  if (!$('lightbox').open) $('lightbox').showModal();
}
function showPhoto() {
  const p = lb.pics[lb.i];
  $('lbImg').src = p.url; $('lbImg').alt = p.caption || 'Trip photo';
  $('lbDay').textContent = `${fmt(Date.parse(p.day), { weekday: 'long', day: 'numeric', month: 'long' })}${lb.pics.length > 1 ? ` · ${lb.i + 1} of ${lb.pics.length}` : ''}`;
  $('lbCap').textContent = p.caption || '';
  $('lbPrev').hidden = $('lbNext').hidden = lb.pics.length < 2;
  $('lbThumbs').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === lb.i));
}
const stepPhoto = d => { lb.i = (lb.i + d + lb.pics.length) % lb.pics.length; showPhoto(); };

// Laptop view: the day's newest photos as a row of polaroids on the map, overlapping only at the edges.
// As many as fit beside the map (1–4) are shown; the last one says how many more there are.
const PILE = [[10, -5], [0, 3], [14, -2], [4, 4]]; // [y offset, rotation] per card, left to right
function renderPolaroid() {
  const pics = photosByDay.get(isoDay(sel)) || [], pile = $('polaroid');
  pile.hidden = !pics.length;
  if (!pics.length) { pile.innerHTML = ''; return; }
  const css = getComputedStyle(pile);
  const pw = parseFloat(css.getPropertyValue('--pw')) || 170, ph = parseFloat(css.getPropertyValue('--ph')) || 125;
  const step = Math.round(pw * 0.85); // ~15% overlap
  const room = $('side').getBoundingClientRect().left - $('topleft').getBoundingClientRect().left - 460; // leave the map ~460px
  const fit = Math.max(1, Math.min(4, Math.floor((room - pw) / step) + 1));
  const shown = pics.slice(-fit), extra = pics.length - shown.length;
  pile.innerHTML = shown.map((p, k) => {
    const [y, r] = shown.length === 1 ? [4, -3] : PILE[k];
    return `<button class="pol" type="button" data-id="${esc(p.id)}" style="--x:${k * step + 8}px;--y:${y}px;--r:${r}deg;z-index:${k + 1}" aria-label="Open photo${p.caption ? ': ' + esc(p.caption) : ''}">
      <img src="${esc(p.url)}" alt="" loading="lazy"><span>${esc(p.caption || '')}</span>
      ${k === shown.length - 1 && extra ? `<em class="more">+${extra} more</em>` : ''}</button>`;
  }).join('');
  pile.style.width = `${pw + (shown.length - 1) * step + 24}px`;
  pile.style.height = `${ph + 70}px`;
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
    const cls = ['day', s ? (s.i % 2 ? 'alt' : '') : 'gap', t < sel ? 'past' : '', t === sel ? 'sel' : '', photosByDay.has(isoDay(t)) ? 'has-photo' : ''].join(' ');
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
  const { idx } = mapState(), s = here(sel);
  $('cards').innerHTML = trip.stops.map(st => {
    const state = s && st.i === s.i ? 'now' : st.i <= idx ? 'done' : 'soon';
    const tag = { now: 'Here', done: 'Visited' }[state];
    const dates = `${fmt(st.start, { day: 'numeric', month: 'short' })} – ${fmt(st.end, { day: 'numeric', month: 'short' })}`;
    const pics = stopPhotos(st), cover = pics[pics.length - 1];
    return `<button class="pc ${state}${cover ? ' has-pics' : ''}" data-i="${st.i}" title="${esc(st.city)}, ${esc(st.country)} · ${dates}">
      ${cover ? `<img src="${esc(cover.url)}" alt="" loading="lazy">` : `<span class="emo" aria-hidden="true">${st.mystery ? '❓' : stopEmoji(st.city)}</span>`}${tag ? `<span class="tag">${tag}</span>` : ''}
      <span class="nm">${esc(st.city)}</span><span class="info">${plural(st.nights, 'day')}${pics.length ? ` · 📷 ${pics.length}` : ''}</span></button>`;
  }).join('');
}

// On wide screens the panels float over the map, so fit the route into the part that's still visible.
function visibleArea(W, H) {
  const side = $('side');
  if (getComputedStyle(side).position !== 'absolute') return null;
  const m = $('map').getBoundingClientRect(), r = el => el.getBoundingClientRect();
  const toggle = r($('viewToggle')), title = r($('topleft').querySelector('h1')), sideR = r(side);
  const pol = $('polaroid').offsetParent ? r($('polaroid')) : null; // keep the route clear of the photo too
  const x0 = Math.max(toggle.right, pol ? pol.right : 0) - m.left + 40, y0 = title.bottom - m.top + 40;
  const x1 = sideR.left - m.left - 50, y1 = r($('strip').closest('.scrub')).top - m.top - 30;
  return x1 - x0 > 200 && y1 - y0 > 200 ? [[x0, y0], [x1, y1]] : null;
}

// While flying into a stop, that stop isn't reached yet: the leg into it gets the plane.
function mapState() {
  const fl = inAir(sel) ? flight(sel) : null;
  if (fl) return { idx: fl.home ? trip.stops.length - 1 : fl.stop.i - 1, cur: null, atHome: false, flyingTo: fl.home ? trip.stops.length : fl.stop.i };
  return { idx: currentStopIndex(trip, sel), cur: stopAt(sel), atHome: trip.homeDays.has(sel), flyingTo: null };
}

function drawMap() {
  const box = $('map').getBoundingClientRect();
  if (!box.width || !box.height) return;
  const hasAway = renderMap({
    svgEl: $('svg'), box, fit: visibleArea(box.width, box.height), trip, sel, world, view: mapView, home: TRIP.home?.ll ? TRIP.home : null,
    ...mapState(), flightProgress: liveFlight()?.progress ?? null, avatar, onPick: go,
  });
  $('viewToggle').style.display = hasAway ? '' : 'none';
  $('viewToggle').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === mapView));
}

// Europe view while they're in Europe; whole-trip view before they get there, in the air, and after they leave.
// A mystery stop ("???") takes the view of the last place they were seen.
function autoView(t) {
  const s = here(t);
  if (!s) return 'world';
  const seen = trip.stops.slice(0, s.i + 1).reverse().find(x => x.ll);
  return seen && inEU(seen.ll) ? 'europe' : 'world';
}

// On laptops the today card keeps one height whatever the day holds: tall enough for a full day (travel route, stay,
// weather, up next) using this trip's longest names, measured on a hidden copy. Phones keep their natural height.
let sizedFor = '';
function sizeToday() {
  const card = document.querySelector('.today');
  if (!matchMedia('(min-width:1101px)').matches) { card.style.removeProperty('--today-h'); sizedFor = ''; return; }
  const longest = xs => xs.reduce((a, b) => (b.length > a.length ? b : a), '');
  const city = longest(trip.stops.map(s => s.city)), route = longest([...trip.routeByDay.values()].map(routeText));
  const k = `${card.clientWidth}|${innerHeight}|${city}|${route}`;
  if (k === sizedFor) return; sizedFor = k;
  const probe = card.cloneNode(false);
  probe.removeAttribute('id'); probe.style.cssText = 'position:absolute;visibility:hidden;height:auto;left:0;top:0;width:' + card.offsetWidth + 'px';
  probe.innerHTML = `<div class="today-body"><div class="eyebrow">Today · Wed, 30 Sep · 23:59 GMT+13</div>
    <div class="stampbadge"><span>Day</span><b>88</b><span>of 88</span></div>
    <div><p class="lede">Right now they’re in</p><div class="city">${esc(city)}</div><div class="country"><span class="dot"></span>Country</div></div>
    <div class="rows"><div class="row"><span>Travel day</span><b>${route || 'A → B'}</b></div><div class="row"><span>Stay</span><b>Day 1 of 5 · 30 Sep – 4 Oct</b></div></div>
    <div class="weather"><span class="wx-what"><span class="wx-icon">🌤️</span><span>Mostly clear<small>${esc(city)} right now · High 25° · Low 18°</small></span></span><b>22°C</b></div>
    <div class="next"><span class="eyebrow">Up next</span><div class="big">${esc(city)} tomorrow</div><div class="small">· 5 days there</div></div></div>
    <div class="daynav"><button class="btn">.</button></div>`;
  card.parentNode.appendChild(probe);
  const full = probe.getBoundingClientRect().height;
  // The home-day version (weather + the trip-complete panel) can be the tallest instead.
  probe.querySelector('.rows').remove();
  probe.querySelector('.next').outerHTML = doneHtml();
  probe.querySelector('.city').textContent = TRIP.home?.city || city;
  card.style.setProperty('--today-h', Math.ceil(Math.max(full, probe.getBoundingClientRect().height)) + 'px');
  probe.remove();
}
function renderAll() { sizeToday(); renderStats(); renderToday(); renderStrip(); renderCards(); drawMap(); }
function go(t) { sel = clampToTrip(trip, t); mapView = autoView(sel); renderAll(); } // the toggle overrides until the day changes

// Events
$('todayBody').addEventListener('click', e => { if (e.target.closest('#daypic')) openGallery(sel); });
$('polaroid').addEventListener('click', e => {
  const b = e.target.closest('.pol'); if (!b) return;
  openGallery(sel, (photosByDay.get(isoDay(sel)) || []).find(p => p.id === b.dataset.id));
});
$('todayBody').addEventListener('keydown', e => { if (e.target.closest('#daypic') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openGallery(sel); } });
$('lbPrev').onclick = () => stepPhoto(-1);
$('lbNext').onclick = () => stepPhoto(1);
$('lbClose').onclick = () => $('lightbox').close();
$('lbThumbs').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { lb.i = +b.dataset.i; showPhoto(); } });
$('lbMap').onclick = () => { $('lightbox').close(); go(lb.stop ? Date.parse(lb.pics[lb.i].day) : lb.t); $('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
$('lightbox').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') stepPhoto(-1); if (e.key === 'ArrowRight') stepPhoto(1); });
$('lightbox').addEventListener('click', e => { if (e.target.classList.contains('lb-media')) $('lightbox').close(); }); // tap the dark area beside the photo
$('strip').addEventListener('click', e => { const b = e.target.closest('.day'); if (b) go(+b.dataset.t); });
// A stop tile jumps the map there, and opens its photos if it has any.
$('cards').addEventListener('click', e => {
  const c = e.target.closest('.pc'); if (!c) return;
  const st = trip.stops[+c.dataset.i];
  go(st.start);
  if (stopPhotos(st).length) openGallery(st.start, stopPhotos(st)[0]);
  else $('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
$('viewToggle').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mapView = b.dataset.v; drawMap(); });
$('prev').onclick = () => go(sel - DAY);
$('next').onclick = () => go(sel + DAY);
$('goToday').onclick = () => go(realToday);
document.addEventListener('keydown', e => { if ($('lightbox').open) return; if (e.key === 'ArrowLeft') go(sel - DAY); if (e.key === 'ArrowRight') go(sel + DAY); });
new ResizeObserver(() => { if (trip) { drawMap(); sizeToday(); } }).observe($('map'));
document.fonts?.ready.then(() => trip && sizeToday());

// Countdown over the map until take-off (day 1 at TRIP.takeoffTime, NZ time).
function takeoffAt() {
  if (trip.departures.has(trip.start)) return zoned(trip.start, trip.departures.get(trip.start), homeTz()); // day 1's Depart time
  const [hh, mm] = (TRIP.takeoffTime || '00:00').split(':').map(Number);
  return zoned(trip.start, (hh || 0) * 60 + (mm || 0), TRIP.todayTimeZone || 'Pacific/Auckland');
}
function startCountdown() {
  const takeoff = takeoffAt();
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
  img.onload = () => { avatar.src = TRIP.avatar; avatar.ratio = img.naturalWidth / img.naturalHeight || 1; if (trip) drawMap(); };
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
  // The travellers' photos: load now, then check for new ones every few minutes.
  if (photosEnabled) {
    const refresh = () => loadPhotos().then(m => { photosByDay = m; renderToday(); renderStrip(); renderCards(); drawMap(); }).catch(e => console.warn('Photos:', e.message));
    refresh(); setInterval(refresh, 5 * 60e3);
  }
  setInterval(() => { if (liveFlight()) { renderToday(); drawMap(); } }, 60e3); // keep the plane moving along the route
  const fl = flight(realToday); // re-render the moment they land today
  if (fl && Date.now() < fl.lands && fl.lands - Date.now() < 2 ** 31 - 1) setTimeout(() => { if (sel === realToday) go(sel); }, fl.lands - Date.now() + 1000);
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
