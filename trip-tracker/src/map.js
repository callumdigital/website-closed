import { select } from 'd3-selection';
import { geoPath, geoNaturalEarth1, geoConicConformal, geoGraticule10 } from 'd3-geo';
import { key, hav } from './lib/trip.js';

const inEU = ll => ll[0] > -30 && ll[0] < 45 && ll[1] > 30;

// Text with a light backdrop rect (cheaper than stroke halos, which crashed iOS Safari in the prototype).
function haloText(parent, txt, x, y, anchor, ff, fs, fw, fill) {
  const t = parent.append('text').text(txt).attr('x', x).attr('y', y).attr('text-anchor', anchor)
    .attr('font-family', ff).attr('font-size', fs).attr('font-weight', fw).attr('fill', fill);
  const bb = t.node().getBBox();
  parent.insert('rect', 'text').attr('x', bb.x - 3).attr('y', bb.y - 1).attr('width', bb.width + 6).attr('height', bb.height + 2)
    .attr('rx', 2).attr('fill', 'var(--sea)').attr('opacity', .85);
  return t;
}

/**
 * Draws the route map into `svgEl`, sized to `box`.
 * view: 'world' (flight map of the whole trip) | 'europe'. Returns whether the view toggle is relevant.
 */
export function renderMap({ svgEl, box, trip, sel, idx, cur, home, world, view, onPick }) {
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
  ).fitExtent([[40, wide ? 90 : 40], [W - 40, H - 70]], ext).clipExtent([[0, 0], [W, H]]);
  const path = geoPath(proj);

  const visited = new Set(trip.stops.slice(0, idx + 1).map(s => key(s.country)));
  const planned = new Set(trip.stops.map(s => key(s.country)));
  const g = svg.append('g');
  g.append('path').attr('d', path(geoGraticule10())).attr('fill', 'none').attr('stroke', '#DCD6C9').attr('stroke-width', .6).attr('stroke-dasharray', '2 3');
  if (world) g.selectAll('path.c').data(world).join('path').attr('class', 'c').attr('d', path)
    .attr('fill', d => {
      const k = key(d.properties.name);
      return wide && home && k === key(home.country) ? '#EBD3C6'
        : cur && k === key(cur.country) ? 'var(--accent-mid)'
        : visited.has(k) ? 'var(--accent-soft)'
        : planned.has(k) ? '#EDE4D3' : 'var(--land)';
    })
    .attr('stroke', 'var(--land-stroke)').attr('stroke-width', wide ? .5 : .8).attr('stroke-linejoin', 'round');

  // Legs: short hops as gentle arcs, long-haul (>2500 km) as great-circle flight paths.
  const P = trip.stops.map((s, i) => shown[i] ? proj(s.ll) : null);
  const arc = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], k = .18; return `M${a}Q${mx - dy * k},${my + dx * k} ${b}`; };
  const legs = [];
  for (let i = 1; i < P.length; i++) {
    if (!P[i] || !P[i - 1]) continue;
    const past = i <= idx, fl = hav(trip.stops[i - 1].ll, trip.stops[i].ll) > 2500;
    const d = fl ? path({ type: 'LineString', coordinates: [trip.stops[i - 1].ll, trip.stops[i].ll] }) : arc(P[i - 1], P[i]);
    legs[i] = g.append('path').attr('d', d).attr('fill', 'none')
      .attr('stroke', past ? 'var(--accent)' : 'var(--muted)').attr('stroke-width', past ? (wide ? 2 : 2.6) : (wide ? 1.3 : 1.6))
      .attr('stroke-dasharray', past ? null : '5 6').attr('stroke-linecap', 'round').attr('opacity', past ? 1 : .7).node();
  }

  const firstI = P.findIndex(p => p), lastI = P.length - 1 - [...P].reverse().findIndex(p => p);
  if (wide && home && firstI >= 0) {
    const H0 = proj(home.ll);
    [[home.ll, trip.stops[firstI].ll, true], [trip.stops[lastI].ll, home.ll, sel > trip.end]].forEach(([a, b, past]) => {
      g.append('path').attr('d', path({ type: 'LineString', coordinates: [a, b] })).attr('fill', 'none')
        .attr('stroke', past ? 'var(--accent)' : 'var(--muted)').attr('stroke-width', past ? 2 : 1.3)
        .attr('stroke-dasharray', past ? null : '5 6').attr('stroke-linecap', 'round').attr('opacity', past ? 1 : .7);
    });
    const hg = g.append('g').attr('transform', `translate(${H0})`);
    hg.append('rect').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', 'var(--stamp)')
      .attr('stroke', 'var(--card)').attr('stroke-width', 2).attr('transform', 'rotate(45)');
    const flip = H0[0] > W - 120;
    haloText(hg, `Home · ${home.city}`, flip ? -12 : 12, 4, flip ? 'end' : 'start', 'Figtree, sans-serif', 12.5, 700, 'var(--stamp)');
  }

  // Zoomed out, only label the current city, the ends, and anything touching a non-European stop.
  const away = s => s && s.ll && !inEU(s.ll);
  trip.stops.forEach((s, i) => {
    if (!P[i]) return;
    const isCur = cur && cur.i === i, past = i <= idx;
    const showLabel = !wide || isCur || !inEU(s.ll) || i === 0 || i === trip.stops.length - 1 || away(trip.stops[i - 1]) || away(trip.stops[i + 1]);
    const sg = g.append('g').attr('transform', `translate(${P[i]})`).style('cursor', 'pointer').on('click', () => onPick(s.start));
    sg.append('title').text(s.city);
    if (isCur) {
      sg.append('circle').attr('r', 9).attr('fill', 'var(--accent)').attr('class', 'pulse');
      sg.append('circle').attr('r', wide ? 7 : 9).attr('fill', 'var(--accent)').attr('stroke', 'var(--card)').attr('stroke-width', 3);
    } else {
      sg.append('circle').attr('r', wide ? 3.5 : 5).attr('fill', past ? 'var(--ink)' : 'var(--card)').attr('stroke', 'var(--ink)').attr('stroke-width', wide ? 1.3 : 1.6);
    }
    if (!showLabel) return;
    const cp = cur && P[cur.i];
    if (wide && !isCur && cp && Math.hypot(P[i][0] - cp[0], P[i][1] - cp[1]) < 60 && inEU(s.ll)) return;
    const flip = !isCur && P[i][0] > W - 90;
    haloText(sg, s.city, isCur ? 0 : flip ? -8 : 8, isCur ? -20 : 4, isCur ? 'middle' : flip ? 'end' : 'start',
      isCur ? 'Young Serif, serif' : 'Figtree, sans-serif', isCur ? 22 : 12.5, isCur ? 400 : 600,
      isCur ? 'var(--ink)' : past ? 'var(--ink)' : 'var(--muted)');
  });

  // In transit: a plane midway along the leg, pointing the way.
  if (!cur) {
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
