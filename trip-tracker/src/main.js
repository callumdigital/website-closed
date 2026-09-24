import TRIP from './data/trip.js';
import { TZ } from './lib/places.js';
import { DAY, key, plural, hav, parseCSV, buildTrip, geocodeMissing, clampToTrip, currentStopIndex } from './lib/trip.js';
import { renderMap } from './map.js';
import { feature } from '../vendor/geo.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (t, o) => new Date(t).toLocaleDateString('en-GB', { timeZone: 'UTC', ...o });
// "Today" is the viewer's calendar date (friends & family are mostly in NZ).
const realToday = (() => { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); })();

// localStorage can throw (private mode, blocked storage); it only holds conveniences.
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
const geoCache = (() => { try { return JSON.parse(store.get('trip-geocache') || '{}'); } catch { return {}; } })();

let trip, sel, world, clockTimer, mapView = store.get('trip-mapview') || 'world';
const stopAt = t => trip.byDay.get(t) || null;

function renderStats() {
  const idx = currentStopIndex(trip, sel), done = trip.stops.slice(0, idx + 1);
  const countries = new Set(done.map(s => s.country)), allC = new Set(trip.stops.map(s => s.country));
  let km = 0; for (let i = 1; i < done.length; i++) if (done[i].ll && done[i - 1].ll) km += hav(done[i - 1].ll, done[i].ll);
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
    city = s.city; country = s.country;
    const dayIn = Math.round((sel - s.start) / DAY) + 1;
    rows = `<div class="row"><span>Local time</span><b id="clock">—</b></div>
      <div class="row"><span>In ${esc(s.city)}</span><b>Day ${dayIn} of ${s.nights}</b></div>
      <div class="row"><span>Dates</span><b>${fmt(s.start, { day: 'numeric', month: 'short' })} – ${fmt(s.end, { day: 'numeric', month: 'short' })}</b></div>`;
  } else {
    lede = 'Somewhere between'; const prev = trip.stops[idx];
    city = 'In transit'; country = `${prev ? prev.city : '?'} → ${nxt ? nxt.city : '?'}`;
  }
  let nextHtml;
  if (nxt) {
    const d = Math.round((nxt.start - sel) / DAY);
    const when = d === 1 ? 'tomorrow' : `in ${plural(d, 'day')}`;
    nextHtml = `<div class="big">${esc(nxt.city)} ${when}</div><div class="small">${esc(nxt.country)} · ${plural(nxt.nights, 'day')} there</div>`;
  } else {
    nextHtml = `<div class="big">${TRIP.home ? 'Flying home to ' + esc(TRIP.home.city) : 'Home sweet home'}</div><div class="small">Last stop of the trip — welcome back soon.</div>`;
  }
  $('today').innerHTML = `
    <div class="eyebrow">${whenLabel}</div>
    <div class="stampbadge"><span>Day</span><b>${dayN}</b><span>of ${trip.days.length}</span></div>
    <div>
      <p class="lede">${lede}</p>
      <div class="city">${esc(city)}</div>
      <div class="country"><span class="dot"></span>${esc(country)}</div>
    </div>
    <div class="rows">${rows}</div>
    <div class="weather"><span>Weather forecast — coming soon</span><b>— °C</b></div>
    <div class="next"><span class="eyebrow">Up next</span>${nextHtml}</div>`;

  clearInterval(clockTimer);
  if (s) {
    const tz = TZ[s.country] || 'Europe/Paris';
    const tick = () => {
      const el = $('clock'); if (!el) return;
      const now = new Date();
      const zone = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';
      el.textContent = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }) + ' ' + zone;
    };
    tick(); clockTimer = setInterval(tick, 15000);
  }
}

function renderStrip() {
  const n = trip.days.length, el = $('strip'), hasToday = trip.days.includes(realToday);
  el.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`;
  el.style.minWidth = `${n * 22}px`; // keeps day cells tappable on phones; the strip scrolls sideways
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
  const s = stopAt(sel);
  $('scrubTitle').textContent = `${fmt(sel, { weekday: 'long', day: 'numeric', month: 'long' })}${s ? ' — ' + s.city : ''}`;
  $('goToday').textContent = realToday < trip.start ? 'Jump to day one' : realToday > trip.end ? 'Jump to last day' : 'Jump to today';
}

function renderCards() {
  const idx = currentStopIndex(trip, sel), s = stopAt(sel);
  $('cards').innerHTML = trip.stops.map(st => {
    const state = s && st.i === s.i ? 'now' : st.i <= idx ? 'done' : 'soon';
    const tag = { now: 'Here', done: 'Visited', soon: 'Coming up' }[state];
    return `<button class="card pc ${state === 'now' ? 'now' : ''}" data-t="${st.start}">
      <div class="top"><div class="num">${st.i + 1}</div><div class="tag ${state}">${tag}</div></div>
      <div class="meta"><div class="nm">${esc(st.city)}</div><div class="sub">${esc(st.country)} · ${fmt(st.start, { day: 'numeric', month: 'short' })} – ${fmt(st.end, { day: 'numeric', month: 'short' })}</div></div>
    </button>`;
  }).join('');
}

function drawMap() {
  const box = $('map').getBoundingClientRect();
  if (!box.width || !box.height) return;
  const hasAway = renderMap({
    svgEl: $('svg'), box, trip, sel, world, view: mapView, home: TRIP.home?.ll ? TRIP.home : null,
    idx: currentStopIndex(trip, sel), cur: stopAt(sel), onPick: go,
  });
  $('viewToggle').style.display = hasAway ? 'flex' : 'none';
  $('viewToggle').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === mapView));
}

function renderAll() { renderStats(); renderToday(); renderStrip(); renderCards(); drawMap(); }
function go(t) { sel = clampToTrip(trip, t); renderAll(); }

// Events
$('strip').addEventListener('click', e => { const b = e.target.closest('.day'); if (b) go(+b.dataset.t); });
$('cards').addEventListener('click', e => { const c = e.target.closest('.pc'); if (c) { go(+c.dataset.t); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
$('viewToggle').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mapView = b.dataset.v; store.set('trip-mapview', mapView); drawMap(); });
$('prev').onclick = () => go(sel - DAY);
$('next').onclick = () => go(sel + DAY);
$('goToday').onclick = () => go(realToday);
document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(sel - DAY); if (e.key === 'ArrowRight') go(sel + DAY); });
new ResizeObserver(() => trip && drawMap()).observe($('map'));

// Boot
$('tripTitle').textContent = TRIP.title;
$('who').textContent = TRIP.travellers;
document.title = `Where are ${TRIP.travellers}?`;

// no-cache: always revalidate, so an edited itinerary shows as soon as GitHub Pages republishes it.
const csv = await fetch('src/data/itinerary.csv', { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').catch(() => '');
const { rows, bad } = parseCSV(csv);
if (bad.length) console.warn(`Itinerary: skipped ${plural(bad.length, 'line')} (${bad.slice(0, 6).join(', ')}).`);
if (!rows.length) {
  $('today').innerHTML = '<p class="lede">No itinerary yet — add rows to src/data/itinerary.csv.</p>';
} else {
  trip = buildTrip(rows, geoCache);
  sel = clampToTrip(trip, realToday);
  renderAll();
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
