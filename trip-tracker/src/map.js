import { select, geoPath, geoNaturalEarth1, geoConicConformal, geoGraticule10 } from '../vendor/geo.js';
import { key, hav } from './lib/trip.js';

const inEU = ll => ll[0] > -30 && ll[0] < 45 && ll[1] > 30;

// Text with a light backdrop rect (cheaper than stroke halos, which crashed iOS Safari in the prototype).
function haloText(parent, txt, x, y, anchor, ff, fs, fw, fill) {
  const t = parent.append('text').text(txt).attr('x', x).attr('y', y).attr('text-anchor', anchor)
    .attr('font-family', ff).attr('font-size', fs).attr('font-weight', fw).attr('fill', fill);
  const bb = t.node().getBBox();
  parent.insert('rect', () => t.node()).attr('x', bb.x - 3).attr('y', bb.y - 1).attr('width', bb.width + 6).attr('height', bb.height + 2)
    .attr('rx', 2).attr('fill', 'var(--sea)').attr('opacity', .85);
  return t;
}

// The travellers' faces bubble; falls back to their initials until a photo is set (see src/data/trip.js).
function drawFaces(sg, R, avatar) {
  sg.append('circle').attr('r', R).attr('fill', 'var(--accent)').attr('class', 'pulse face');
  sg.append('circle').attr('r', R).attr('fill', 'var(--accent)');
  if (avatar.src) {
    sg.append('clipPath').attr('id', 'avatarClip').append('circle').attr('r', R);
    sg.append('image').attr('href', avatar.src).attr('x', -R).attr('y', -R).attr('width', R * 2).attr('height', R * 2)
      .attr('preserveAspectRatio', 'xMidYMid slice').attr('clip-path', 'url(#avatarClip)');
  } else {
    sg.append('text').text(avatar.initials).attr('text-anchor', 'middle').attr('dy', '.35em')
      .attr('font-family', 'Figtree, sans-serif').attr('font-weight', 700).attr('font-size', R * .62).attr('fill', 'var(--card)');
  }
  sg.append('circle').attr('r', R).attr('fill', 'none').attr('stroke', 'var(--card)').attr('stroke-width', 3);
  sg.append('circle').attr('r', R + 1.5).attr('fill', 'none').attr('stroke', 'var(--accent)').attr('stroke-width', 1.5);
}

/**
 * Draws the route map into `svgEl`, sized to `box`.
 * view: 'world' (flight map of the whole trip) | 'europe'. fit: optional [[x0,y0],[x1,y1]] the route must sit inside
 * (the part of the map not covered by floating panels). Returns whether the view toggle is relevant.
 */
export function renderMap({ svgEl, box, fit, trip, sel, idx, cur, home, atHome, world, view, avatar, onPick }) {
  const W = box.width, H = box.height;
  const svg = select(svgEl).attr('viewBox', `0 0 ${W} ${H}`); svg.selectAll('*').remove();
  const hasAway = !!home || trip.stops.some(s => s.ll && !inEU(s.ll));
  const wide = hasAway && view === 'world';

  const shown = trip.stops.map(s => !!s.ll && (wide || inEU(s.ll)));
  const pts = trip.stops.filter((s, i) => shown[i]).map(s => s.ll);
  if (wide && home) pts.push(home.ll);
  const lons = pts.map(p => p[0]).concat(wide ? [] : [-9, 24]), lats = pts.map(p => p[1]).concat(wide ? [] : [37, 56]);
  const pad = wide ? [10, 8] : [3, 2];
  const ext = { type: 'MultiPoint', coordinates: [[Math.min(...lons) - pad[0], Math.min(...lats) - pad[1]], [Math.max(...lons) + pad[0], Math.max(...lats) + pad[1]]] };
  const proj = (wide
    ? geoNaturalEarth1().rotate([-(Math.min(...lons) + Math.max(...lons)) / 2, 0])
    : geoConicConformal().rotate([-12, 0]).parallels([40, 58])
  ).fitExtent(fit || [[40, wide ? 90 : 40], [W - 40, H - 70]], ext).clipExtent([[0, 0], [W, H]]);
  const path = geoPath(proj);
  const edge = fit ? fit[1][0] + 50 : W; // right edge of the uncovered map area

  const visited = new Set(trip.stops.slice(0, idx + 1).map(s => key(s.mapCountry)));
  const planned = new Set(trip.stops.map(s => key(s.mapCountry)));
  const g = svg.append('g');
  g.append('path').attr('d', path(geoGraticule10())).attr('fill', 'none').attr('stroke', '#DCD6C9').attr('stroke-width', .6).attr('stroke-dasharray', '2 3');
  if (world) g.selectAll('path.c').data(world).join('path').attr('class', 'c').attr('d', path)
    .attr('fill', d => {
      const k = key(d.properties.name);
      return wide && home && k === key(home.country) ? '#EBD3C6'
        : cur && k === key(cur.mapCountry) ? 'var(--accent-mid)'
        : visited.has(k) ? 'var(--accent-soft)'
        : planned.has(k) ? '#EDE4D3' : 'var(--land)';
    })
    .attr('stroke', 'var(--land-stroke)').attr('stroke-width', wide ? .5 : .8).attr('stroke-linejoin', 'round');

  // Legs: short hops as gentle arcs, long-haul (>2500 km) as great-circle flight paths.
  const P = trip.stops.map((s, i) => shown[i] ? proj(s.ll) : null);
  const arc = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], k = .18; return `M${a}Q${mx - dy * k},${my + dx * k} ${b}`; };
  const legs = [];
  // Each leg joins the previous stop that has a position (mystery stops have none and are skipped).
  for (let i = 1, j = P.findIndex(p => p); i < P.length; i++) {
    if (!P[i] || j < 0 || j >= i) continue;
    const a = trip.stops[j], b = trip.stops[i], from = P[j]; j = i;
    const past = i <= idx, fl = hav(a.ll, b.ll) > 2500;
    const d = fl ? path({ type: 'LineString', coordinates: [a.ll, b.ll] }) : arc(from, P[i]);
    legs[i] = g.append('path').attr('d', d).attr('fill', 'none')
      .attr('stroke', past ? 'var(--accent)' : 'var(--muted)').attr('stroke-width', past ? (wide ? 2 : 2.6) : (wide ? 1.3 : 1.6))
      .attr('stroke-dasharray', past ? null : '5 6').attr('stroke-linecap', 'round').attr('opacity', past ? 1 : .7).node();
  }

  const firstI = P.findIndex(p => p), lastI = P.length - 1 - [...P].reverse().findIndex(p => p);
  if (wide && home && firstI >= 0) {
    const H0 = proj(home.ll);
    [[home.ll, trip.stops[firstI].ll, true], [trip.stops[lastI].ll, home.ll, sel > trip.stops[trip.stops.length - 1].end]].forEach(([a, b, past], k) => {
      const el = g.append('path').attr('d', path({ type: 'LineString', coordinates: [a, b] })).attr('fill', 'none')
        .attr('stroke', past ? 'var(--accent)' : 'var(--muted)').attr('stroke-width', past ? 2 : 1.3)
        .attr('stroke-dasharray', past ? null : '5 6').attr('stroke-linecap', 'round').attr('opacity', past ? 1 : .7);
      if (k === 1) legs[trip.stops.length] = el.node(); // the flight home, for the plane marker
    });
    const hg = g.append('g').attr('transform', `translate(${H0})`);
    if (atHome) drawFaces(hg, 18, avatar); else hg.append('rect').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', 'var(--stamp)')
      .attr('stroke', 'var(--card)').attr('stroke-width', 2).attr('transform', 'rotate(45)');
    const flip = H0[0] > edge - 160;
    const hx = atHome ? 26 : 12;
    haloText(hg, `Home · ${home.city}`, flip ? -hx : hx, 4, flip ? 'end' : 'start', 'Figtree, sans-serif', 12.5, 700, 'var(--stamp)');
  }

  // Zoomed out, only label the current city, the ends, and anything touching a non-European stop.
  const away = s => s && s.ll && !inEU(s.ll);
  const small = wide || W < 700; // zoomed-out or phone-sized map: smaller pins and labels
  const R = wide ? 18 : small ? 20 : 26; // travellers' face bubble radius
  const pinR = wide ? 3.5 : small ? 5 : 6.5;
  let curG = null;
  const groups = [];
  // Drawn last-to-first so an earlier (visited) pin sits on top of a later visit to the same city.
  [...trip.stops].reverse().forEach(s => {
    const i = s.i;
    if (!P[i]) return;
    const isCur = cur && cur.i === i, past = i <= idx;
    const sg = g.append('g').attr('transform', `translate(${P[i]})`).style('cursor', 'pointer').on('click', () => onPick(s.start));
    sg.append('title').text(s.city);
    groups[i] = sg;
    if (isCur) {
      curG = sg;
      drawFaces(sg, R, avatar);
    } else {
      sg.append('circle').attr('r', pinR).attr('fill', past ? 'var(--ink)' : 'var(--card)').attr('stroke', 'var(--ink)').attr('stroke-width', wide ? 1.3 : small ? 1.6 : 2);
    }
  });

  // Labels: the current city first, then the rest. Each tries the right side, then the left,
  // and is dropped if both would collide with another label or pin (the dot's tooltip still names it).
  const taken = [];
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  P.forEach((p, i) => { if (p) { const r = cur && cur.i === i ? R + 2 : pinR + 2; taken.push({ i, city: key(trip.stops[i].city), x: p[0] - r, y: p[1] - r, w: 2 * r, h: 2 * r }); } });
  const labelled = new Set(); // a city visited twice (e.g. London) shares one pin position and gets one label
  const gap = small ? 8 : 11, fs = small ? 12.5 : 16;
  const order = trip.stops.map((s, i) => i).filter(i => P[i]).sort((a, b) => (cur && b === cur.i) - (cur && a === cur.i));
  order.forEach(i => {
    const s = trip.stops[i], isCur = cur && cur.i === i, past = i <= idx;
    const showLabel = !wide || isCur || !inEU(s.ll) || i === 0 || i === trip.stops.length - 1 || away(trip.stops[i - 1]) || away(trip.stops[i + 1]);
    if (!showLabel || labelled.has(key(s.city))) return;
    const tries = isCur ? [[0, -(R + 12), 'middle']] : [[gap, small ? 4 : 5.5, 'start'], [-gap, small ? 4 : 5.5, 'end']];
    for (const [x, y, anchor] of tries) {
      const t = haloText(groups[i], s.city, x, y, anchor, isCur ? 'Young Serif, serif' : 'Figtree, sans-serif',
        isCur ? (small ? 24 : 32) : fs, isCur ? 400 : 600, isCur ? 'var(--ink)' : past ? 'var(--ink)' : 'var(--muted)');
      const bb = t.node().getBBox();
      const box = { x: P[i][0] + bb.x - 3, y: P[i][1] + bb.y - 1, w: bb.width + 6, h: bb.height + 2 };
      const inside = box.x >= 2 && box.y >= 2 && box.x + box.w <= edge && box.y + box.h <= H - 2;
      if (isCur || (inside && !taken.some(o => o.i !== i && o.city !== key(s.city) && hit(box, o)))) { taken.push({ i, ...box }); labelled.add(key(s.city)); break; }
      t.node().previousSibling.remove(); t.remove(); // drop the backdrop rect + text and try the other side
    }
  });
  if (curG) curG.raise(); // keep the faces on top of nearby pins

  // In transit: a plane midway along the leg, pointing the way.
  if (!cur && !atHome) {
    const L = legs[idx + 1];
    if (L) {
      const len = L.getTotalLength(), m = L.getPointAtLength(len / 2), n = L.getPointAtLength(Math.min(len, len / 2 + 2));
      const ang = Math.atan2(n.y - m.y, n.x - m.x) * 180 / Math.PI;
      const pg = g.append('g').attr('transform', `translate(${m.x},${m.y}) rotate(${ang})`);
      pg.append('circle').attr('r', 14).attr('fill', 'var(--card)').attr('stroke', 'var(--stamp)').attr('stroke-width', 1.5);
      pg.append('path').attr('d', 'M9,0 L-3,-2 L-6,-9 L-8,-9 L-6,-2 L-9,-1.5 L-11,-4 L-12,-4 L-11,0 L-12,4 L-11,4 L-9,1.5 L-6,2 L-8,9 L-6,9 L-3,2 Z')
        .attr('transform', 'translate(1.5,0)').attr('fill', 'var(--stamp)');
    }
  }
  return hasAway;
}
