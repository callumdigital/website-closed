import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDate, parseClock, parseCSV, buildTrip, currentStopIndex, DAY } from '../src/lib/trip.js';

test('parseDate handles ISO and day-first formats', () => {
  assert.equal(parseDate('2026-10-03'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('03/10/2026'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('3.10.26'), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('nope'), null);
});

test('parseCSV skips header, reports bad lines, accepts tabs, normalises countries', () => {
  const { rows, bad } = parseCSV('date\tcity\tcountry\n2026-09-16\tPrague\tCzech Republic\nrubbish\n2026-09-15\tLondon\tUK');
  assert.deepEqual(rows.map(r => r.city), ['London', 'Prague']);
  assert.equal(rows[1].mapCountry, 'Czechia');
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

test('parseDate infers the year from the weekday', () => {
  const near = Date.UTC(2026, 8, 24);
  assert.equal(parseDate('Sat 03 Oct', near), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('Fri 03 Oct', near), Date.UTC(2025, 9, 3));
  assert.equal(parseDate('3 Oct', near), Date.UTC(2026, 9, 3));
  assert.equal(parseDate('Sat 03 Oct 2026'), Date.UTC(2026, 9, 3));
});

test('travellers format: routes, in-the-air, mystery and home days', () => {
  const near = Date.UTC(2026, 8, 24);
  const { rows, bad } = parseCSV(`Date,Country,City
Sat 03 Oct,NZ > Singapore,Wellington > Auckland > Changi
Sun 04 Oct,Singapore > England,Changi > London
Mon 05 Oct,Scotland > England,London > ???
Tue 06 Oct,England > China,??? > Beijing
Wed 07 Oct,China > The sky,Beijing > The sky
Thu 08 Oct,The sky > NZ,The sky > Auckland > Wellington`, near);
  assert.deepEqual(bad, []);
  assert.equal(rows[0].city, 'Changi');
  assert.deepEqual(rows[1].route, ['Changi', 'London']);
  assert.equal(rows[2].country, 'England');
  assert.equal(rows[2].mapCountry, 'United Kingdom');
  const trip = buildTrip(rows, {}, { city: 'Wellington', country: 'New Zealand' });
  assert.deepEqual(trip.stops.map(s => s.city), ['Changi', 'London', '???', 'Beijing']);
  assert.ok(trip.stops[2].mystery && !trip.stops[2].ll);
  assert.equal(trip.byDay.get(Date.UTC(2026, 9, 7)), undefined); // in the air
  assert.ok(trip.homeDays.has(Date.UTC(2026, 9, 8)));
  assert.equal(trip.days.length, 6);
});

test('arrival times', () => {
  assert.equal(parseClock('21:30'), 1290);
  assert.equal(parseClock('9:30pm'), 1290);
  assert.equal(parseClock('9 PM'), 1260);
  assert.equal(parseClock('12am'), 0);
  assert.equal(parseClock('soon'), null);
  const { rows } = parseCSV('Date,Country,City,Arrive\nSat 03 Oct,NZ > Singapore,Wellington > Changi,9:30pm\nSun 04 Oct,Singapore,Changi', Date.UTC(2026, 8, 24));
  const trip = buildTrip(rows);
  assert.equal(trip.arrivals.get(Date.UTC(2026, 9, 3)), 1290);
  assert.equal(trip.arrivals.size, 1);
});

test('the committed itinerary parses cleanly', () => {
  const { rows, bad } = parseCSV(readFileSync(new URL('../src/data/itinerary.csv', import.meta.url), 'utf8'));
  assert.deepEqual(bad, [], 'fix these line numbers in src/data/itinerary.csv');
  assert.ok(rows.length > 0);
  const trip = buildTrip(rows);
  assert.equal(trip.end - trip.start, (trip.days.length - 1) * DAY);
});
