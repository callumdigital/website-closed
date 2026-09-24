import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDate, parseCSV, buildTrip, currentStopIndex, DAY } from '../src/lib/trip.js';

test('parseDate handles ISO and day-first formats', () => {
  assert.equal(parseDate('2026-10-03'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('03/10/2026'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('3.10.26'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('nope'), null);
});

test('parseCSV skips header, reports bad lines, accepts tabs, normalises countries', () => {
  const { rows, bad } = parseCSV('date\tcity\tcountry\n2026-09-16\tPrague\tCzech Republic\nrubbish\n2026-09-15\tLondon\tUK');
  assert.deepEqual(rows.map(r => r.city), ['London', 'Prague']);
  assert.equal(rows[1].country, 'Czechia');
  assert.deepEqual(bad, [3]);
});

test('buildTrip merges consecutive days and leaves gaps as transit', () => {
  const { rows } = parseCSV('2026-09-01,Paris,France\n2026-09-02,paris,France\n2026-09-04,Rome,Italy');
  const trip = buildTrip(rows);
  assert.equal(trip.stops.length, 2);
  assert.equal(trip.stops[0].nights, 2);
  assert.equal(trip.days.length, 4);
  assert.equal(trip.byDay.get(Date.UTC(2026, 8, 3)), undefined);
  assert.equal(currentStopIndex(trip, Date.UTC(2026, 8, 3)), 0);
  assert.deepEqual(trip.stops[1].ll, [12.4964, 41.9028]);
});

test('the committed itinerary parses cleanly', () => {
  const { rows, bad } = parseCSV(readFileSync(new URL('../src/data/itinerary.csv', import.meta.url), 'utf8'));
  assert.deepEqual(bad, [], 'fix these line numbers in src/data/itinerary.csv');
  assert.ok(rows.length > 0);
  const trip = buildTrip(rows);
  assert.equal(trip.end - trip.start, (trip.days.length - 1) * DAY);
});
