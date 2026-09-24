// Trip settings. The day-by-day itinerary lives in ./itinerary.csv (date, city, country per row).
export default {
  title: 'The Big Europe Trip',
  travellers: 'Annalisa & Mitchell',
  // Photo of the travellers' faces, shown as the "you are here" marker on the map.
  // Drop a square photo into img/ and set the path, e.g. 'img/travellers.jpg'. Until then their initials show.
  avatar: '',
  // Which time zone decides what "today" is on the site.
  todayTimeZone: 'Pacific/Auckland',
  // Departure time (in todayTimeZone) on day 1, for the countdown over the map. e.g. '14:35' for the flight time.
  takeoffTime: '00:00',
  // Where the trip starts and ends: drawn on the map, not counted as a stop.
  home: { city: 'Wellington', country: 'New Zealand', ll: [174.7762, -41.2865] },
};
