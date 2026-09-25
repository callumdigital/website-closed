import { select, geoPath, geoNaturalEarth1, geoConicConformal, geoGraticule10 } from '../vendor/geo.js';
import { key, hav } from './lib/trip.js';

import TRIP from './data/trip.js';
import { REGIONS } from './lib/regions.js';

// The zoomed-in region (set in src/data/trip.js): which places count as "in" it, and how to draw it.
const REGION = TRIP.region;
export const inRegion = ll => ll[0] >= REGION.bounds[0][0] && ll[0] <= REGION.bounds[1][0] && ll[1] >= REGION.bounds[0][1] && ll[1] <= REGION.bounds[1][1];

// Text with a light backdrop rect (cheaper than stroke halos, which crashed iOS Safari in the prototype).
function haloText(parent, txt, x, y, anchor, ff, fs, fw, fill) {
  const t = parent.append('text').text(txt).attr('x', x).attr('y', y).attr('text-anchor', anchor)
    .attr('font-family', ff).attr('font-size', fs).attr('font-weight', fw).attr('fill', fill);
  const bb = t.node().getBBox();
  parent.insert('rect', () => t.node()).attr('x', bb.x - 3).attr('y', bb.y - 1).attr('width', bb.width + 6).attr('height', bb.height + 2)
    .attr('rx', 2).attr('fill', 'var(--sea)').attr('opacity', .85);
  return t;
}

// Size of the travellers' marker: the cut-out photo at its own proportions, or the initials bubble.
const facesSize = (R, avatar) => avatar.src ? { w: R * 2.8 * avatar.ratio, h: R * 2.8 } : { w: R * 2, h: R * 2 };

// The travellers' marker. With a photo (a cut-out of their heads, transparent background) it's just the
// image with a soft shadow that follows its outline; until then, a bubble with their initials.
function drawFaces(sg, R, avatar) {
  const { w, h } = facesSize(R, avatar);
  if (avatar.src) {
    sg.append('image').attr('class', 'faces').attr('href', avatar.src).attr('x', -w / 2).attr('y', -h / 2)
      .attr('width', w).attr('height', h).attr('preserveAspectRatio', 'xMidYMid meet');
    return { w, h };
  }
  sg.append('circle').attr('r', R).attr('fill', 'var(--accent)').attr('class', 'pulse face');
  sg.append('circle').attr('r', R).attr('fill', 'var(--accent)');
  sg.append('text').text(avatar.initials).attr('text-anchor', 'middle').attr('dy', '.35em')
    .attr('font-family', 'Comfortaa, sans-serif').attr('font-weight', 700).attr('font-size', R * .62).attr('fill', 'var(--card)');
  sg.append('circle').attr('r', R).attr('fill', 'none').attr('stroke', 'var(--card)').attr('stroke-width', 3);
  sg.append('circle').attr('r', R + 1.5).attr('fill', 'none').attr('stroke', 'var(--accent)').attr('stroke-width', 1.5);
  return { w, h };
}

/**
 * Draws the route map into `svgEl`, sized to `box`.
 * view: 'world' (flight map of the whole trip) | 'region' (zoomed in on TRIP.region). fit: optional [[x0,y0],[x1,y1]] the route must sit inside
 * (the part of the map not covered by floating panels). counties: optional county shapes, each with .region
 * (plus .borders and .coast lines), for the zoomed-in view: the island in one colour, visited regions highlighted. Returns whether the view toggle is relevant.
 */
export function renderMap({ svgEl, box, fit, trip, sel, idx, cur, home, atHome, flyingTo, flightProgress, world, counties, view, avatar, onPick }) {
  const W = box.width, H = box.height;
  const svg = select(svgEl).attr('viewBox', `0 0 ${W} ${H}`); svg.selectAll('*').remove();
  const hasAway = !!home || trip.stops.some(s => s.ll && !inRegion(s.ll));
  const wide = hasAway && view === 'world';

  const shown = trip.stops.map(s => !!s.ll && (wide || inRegion(s.ll)));
  const pts = trip.stops.filter((s, i) => shown[i]).map(s => s.ll);
  if (wide && home) pts.push(home.ll);
  const lons = pts.map(p => p[0]).concat(wide ? [] : [REGION.show[0][0], REGION.show[1][0]]), lats = pts.map(p => p[1]).concat(wide ? [] : [REGION.show[0][1], REGION.show[1][1]]);
  const pad = wide ? [10, 8] : REGION.pad;
  // Fit all four corners of the padded box plus every stop: on a curved projection, two corners
  // alone don't bound the route (corner stops can poke out past them).
  const [w0, s0, e0, n0] = [Math.min(...lons) - pad[0], Math.min(...lats) - pad[1], Math.max(...lons) + pad[0], Math.max(...lats) + pad[1]];
  const ext = { type: 'MultiPoint', coordinates: [[w0, s0], [e0, s0], [e0, n0], [w0, n0], ...pts] };
  const proj = (wide
    ? geoNaturalEarth1().rotate([-(Math.min(...lons) + Math.max(...lons)) / 2, 0])
    : geoConicConformal().rotate([-REGION.center, 0]).parallels(REGION.parallels)
  ).fitExtent(fit || [[40, wide ? 90 : 40], [W - 40, H - 70]], ext).clipExtent([[0, 0], [W, H]]);
  const path = geoPath(proj);
  const edge = fit ? fit[1][0] + 50 : W; // right edge of the uncovered map area

  const visited = new Set(trip.stops.slice(0, idx + 1).map(s => key(s.mapCountry)));
  const planned = new Set(trip.stops.map(s => key(s.mapCountry)));
  const g = svg.append('g');
  g.append('path').attr('d', path(geoGraticule10())).attr('fill', 'none').attr('stroke', 'var(--graticule)').attr('stroke-width', .6).attr('stroke-dasharray', '2 3');
  const byCounty = counties && !wide; // zoomed in: the counties take over the shading of the region itself
  if (world) g.selectAll('path.c').data(world).join('path').attr('class', 'c').attr('d', path)
    .attr('fill', d => {
      const k = key(d.properties.name);
      if (byCounty && planned.has(k)) return 'var(--land)';
      return wide && home && k === key(home.country) ? 'var(--home-land)'
        : cur && k === key(cur.mapCountry) ? 'var(--accent-mid)'
        : visited.has(k) ? 'var(--accent-soft)'
        : planned.has(k) ? 'var(--planned-land)' : 'var(--land)';
    })
    .attr('stroke', 'var(--land-stroke)').attr('stroke-width', wide ? .5 : .8).attr('stroke-linejoin', 'round');
  // The island in one colour, the regions they've reached highlighted, dashed lines between regions, and an inked coast.
  const been = new Set(trip.stops.slice(0, idx + 1).map(s => s.county?.region).filter(Boolean));
  if (byCounty) {
    const fill = d => been.has(d.region) ? 'var(--region-on)' : 'var(--island)';
    g.selectAll('path.county').data(counties).join('path').attr('class', 'county').attr('d', path)
      .attr('fill', fill).attr('stroke', fill).attr('stroke-width', .6) // stroke = fill hides the seams between counties
      .append('title').text(d => REGIONS[d.region]?.name ? `${REGIONS[d.region].name} Taiwan` : d.properties.COUNTYENG);
    g.append('path').attr('d', path(counties.borders)).attr('fill', 'none').attr('stroke', 'var(--ink)').attr('stroke-opacity', .35)
      .attr('stroke-width', 1).attr('stroke-dasharray', '3 3').attr('stroke-linejoin', 'round');
    g.append('path').attr('d', path(counties.coast)).attr('fill', 'none').attr('stroke', 'var(--ink)').attr('stroke-width', 1.2).attr('stroke-linejoin', 'round');
  }

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
    [[home.ll, trip.stops[firstI].ll, idx >= 0], [trip.stops[lastI].ll, home.ll, atHome || (flyingTo == null && sel > trip.stops[trip.stops.length - 1].end)]].forEach(([a, b, past], k) => {
      const el = g.append('path').attr('d', path({ type: 'LineString', coordinates: [a, b] })).attr('fill', 'none')
        .attr('stroke', past ? 'var(--accent)' : 'var(--muted)').attr('stroke-width', past ? 2 : 1.3)
        .attr('stroke-dasharray', past ? null : '5 6').attr('stroke-linecap', 'round').attr('opacity', past ? 1 : .7);
      legs[k === 0 ? 0 : trip.stops.length] = el.node(); // flights out and home, for the plane marker
    });
    const hg = g.append('g').attr('transform', `translate(${H0})`);
    if (atHome) drawFaces(hg, 18, avatar); else hg.append('rect').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', 'var(--stamp)')
      .attr('stroke', 'var(--card)').attr('stroke-width', 2).attr('transform', 'rotate(45)');
    const flip = H0[0] > edge - 160;
    const hx = atHome ? facesSize(18, avatar).w / 2 + 8 : 12;
    haloText(hg, `Home · ${home.city}`, flip ? -hx : hx, 4, flip ? 'end' : 'start', '"DM Mono", monospace', 12.5, 500, 'var(--stamp)');
  }

  // Zoomed out, only label the current city, the ends, and anything touching a stop outside the region.
  const away = s => s && s.ll && !inRegion(s.ll);
  const small = wide || W < 700; // zoomed-out or phone-sized map: smaller pins and labels
  const R = wide ? 18 : small ? 20 : 26; // travellers' marker size
  const F = facesSize(R, avatar);
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
  P.forEach((p, i) => { if (p) { const [hw, hh] = cur && cur.i === i ? [F.w / 2 + 2, F.h / 2 + 2] : [pinR + 2, pinR + 2]; taken.push({ i, city: key(trip.stops[i].city), x: p[0] - hw, y: p[1] - hh, w: 2 * hw, h: 2 * hh }); } });
  const labelled = new Set(); // a city visited twice (e.g. London) shares one pin position and gets one label
  const gap = small ? 8 : 11, fs = small ? 12.5 : 16;
  const order = trip.stops.map((s, i) => i).filter(i => P[i]).sort((a, b) => (cur && b === cur.i) - (cur && a === cur.i));
  order.forEach(i => {
    const s = trip.stops[i], isCur = cur && cur.i === i, past = i <= idx;
    const showLabel = !wide || isCur || !inRegion(s.ll) || i === 0 || i === trip.stops.length - 1 || away(trip.stops[i - 1]) || away(trip.stops[i + 1]);
    if (!showLabel || labelled.has(key(s.city))) return;
    const tries = isCur ? [[0, -(F.h / 2 + 12), 'middle']] : [[gap, small ? 4 : 5.5, 'start'], [-gap, small ? 4 : 5.5, 'end']];
    for (const [x, y, anchor] of tries) {
      const t = haloText(groups[i], s.city, x, y, anchor, isCur ? 'Comfortaa, sans-serif' : '"DM Mono", monospace',
        isCur ? (small ? 24 : 32) : fs, isCur ? 700 : 500, isCur ? 'var(--ink)' : past ? 'var(--ink)' : 'var(--muted)');
      const bb = t.node().getBBox();
      const box = { x: P[i][0] + bb.x - 3, y: P[i][1] + bb.y - 1, w: bb.width + 6, h: bb.height + 2 };
      const inside = box.x >= 2 && box.y >= 2 && box.x + box.w <= edge && box.y + box.h <= H - 2;
      if (isCur || (inside && !taken.some(o => o.i !== i && o.city !== key(s.city) && hit(box, o)))) { taken.push({ i, ...box }); labelled.add(key(s.city)); break; }
      t.node().previousSibling.remove(); t.remove(); // drop the backdrop rect + text and try the other side
    }
  });
  if (curG) curG.raise(); // keep the faces on top of nearby pins

  // Region names out in the sea beside each region, wherever they don't bump into a city label.
  if (byCounty) Object.entries(REGIONS).forEach(([id, r]) => r.labels.some(([lon, lat, anchor]) => {
    const p = proj([lon, lat]), lg = g.append('g').attr('class', 'region-name').attr('transform', `translate(${p})`);
    const t = haloText(lg, r.name.toUpperCase(), 0, 0, anchor, '"DM Mono", monospace', small ? 10.5 : 12.5, 500, been.has(id) ? 'var(--accent)' : 'var(--muted)').attr('letter-spacing', '.24em');
    const bb = t.node().getBBox(), box = { x: p[0] + bb.x - 3, y: p[1] + bb.y - 1, w: bb.width + 6, h: bb.height + 2 };
    const inside = box.x >= 2 && box.y >= 2 && box.x + box.w <= edge && box.y + box.h <= H - 2;
    if (!inside || taken.some(o => hit(box, o))) { lg.remove(); return false; }
    t.node().previousSibling.remove(); taken.push(box); return true; // no backdrop needed out at sea
  }));

  // In transit: the travellers riding a little cartoon plane halfway along the leg. The plane faces the way
  // they're going and tilts with the route (never upside down); their heads stay upright, and it gently bobs.
  if (!cur && !atHome) {
    const L = legs[flyingTo ?? idx + 1];
    if (L) {
      // Halfway along, unless we know how far through the flight they are right now.
      const len = L.getTotalLength(), at = Math.max(0, Math.min(len - 2, len * (flightProgress ?? 0.5)));
      const m = L.getPointAtLength(at), n = L.getPointAtLength(at + 2);
      const dx = n.x - m.x, dy = n.y - m.y, left = dx < 0;
      const tilt = Math.max(-20, Math.min(20, Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI));
      const bob = g.append('g').attr('transform', `translate(${m.x},${m.y})`).append('g').attr('class', 'bob');
      // Heads first, so the plane's body covers their chins: they're sitting in it.
      const heads = bob.append('g').attr('transform', `rotate(${left ? -tilt : tilt})`);
      if (avatar.src) {
        const hh = small ? 32 : 38, hw = hh * avatar.ratio;
        heads.append('image').attr('href', avatar.src).attr('x', -hw / 2).attr('y', -hh - 1).attr('width', hw).attr('height', hh)
          .attr('preserveAspectRatio', 'xMidYMid meet').style('filter', 'drop-shadow(0 2px 2px rgba(42,37,32,.3))');
      } else {
        heads.append('circle').attr('cy', -15).attr('r', 11).attr('fill', 'var(--accent)').attr('stroke', 'var(--card)').attr('stroke-width', 2);
        heads.append('text').text(avatar.initials).attr('y', -15).attr('dy', '.35em').attr('text-anchor', 'middle')
          .attr('font-family', 'Comfortaa, sans-serif').attr('font-weight', 700).attr('font-size', 7.5).attr('fill', 'var(--card)');
      }
      const plane = bob.append('g').attr('transform', `scale(${left ? -1 : 1},1) rotate(${tilt})`);
      [[-36, 1, 4.5], [-46, 3, 3.5], [-54, 1, 2.5]].forEach(([x, y, r]) =>
        plane.append('circle').attr('cx', x).attr('cy', y).attr('r', r).attr('fill', '#fff').attr('stroke', 'var(--line)').attr('opacity', .9));
      plane.append('path').attr('d', 'M-24,-3 L-31,-17 L-21,-17 L-12,-3 Z').attr('fill', 'var(--stamp)').attr('stroke', 'var(--ink)').attr('stroke-width', 1.2).attr('stroke-linejoin', 'round');
      plane.append('path').attr('d', 'M-27,-2 Q-27,-7 -20,-7 L15,-7 Q28,-7 31,0 Q28,6 15,6 L-20,6 Q-27,6 -27,2 Z')
        .attr('fill', 'var(--card)').attr('stroke', 'var(--ink)').attr('stroke-width', 1.5);
      plane.append('path').attr('d', 'M-24,2.5 L24,2.5').attr('stroke', 'var(--stamp)').attr('stroke-width', 1.5);
      plane.append('path').attr('d', 'M19,-6 Q26,-5 28,-1 L20,-1 Z').attr('fill', 'var(--accent-mid)');
      [-12, -5, 2, 9].forEach(x => plane.append('circle').attr('cx', x).attr('cy', -2).attr('r', 1.7).attr('fill', 'var(--accent-mid)'));
      plane.append('path').attr('d', 'M-6,3 L7,3 L-1,15 L-10,15 Z').attr('fill', 'var(--accent)').attr('stroke', 'var(--ink)').attr('stroke-width', 1.2).attr('stroke-linejoin', 'round');
    }
  }
  return hasAway;
}
